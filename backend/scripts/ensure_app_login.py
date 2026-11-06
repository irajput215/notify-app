"""Create or update the login role the API connects as: a member of `notify_app`, nothing more.

Run by the migration job after `alembic upgrade head`, as the schema owner
(`MIGRATION_DATABASE_URL`). The baseline migration creates `notify_app` as a `NOLOGIN` group role;
a credential never belongs in a migration, so this script gives the API its login:

    CREATE ROLE notify_api LOGIN PASSWORD '...' NOBYPASSRLS IN ROLE notify_app;
    ALTER ROLE notify_api SET role = 'notify_app';

Idempotent: on every run the password is reset to `APP_DB_PASSWORD` (so rotating the secret and
re-running the job rotates the login) and the role is re-asserted as non-superuser, `NOBYPASSRLS`.

Environment: `MIGRATION_DATABASE_URL`, `APP_DB_USER` (default `notify_api`), `APP_DB_PASSWORD`.
The password is never printed.
"""

import os
import sys

import psycopg
from psycopg import sql

APP_GROUP_ROLE = "notify_app"


def _conninfo(url: str) -> str:
    return url.replace("postgresql+psycopg://", "postgresql://", 1)


def main() -> int:
    url = os.environ.get("MIGRATION_DATABASE_URL")
    user = os.environ.get("APP_DB_USER", "notify_api")
    password = os.environ.get("APP_DB_PASSWORD")
    if not url or not password:
        sys.stderr.write("MIGRATION_DATABASE_URL and APP_DB_PASSWORD are required
")
        return 2
    role = sql.Identifier(user)
    secret = sql.Literal(password)
    with psycopg.connect(_conninfo(url), autocommit=True) as connection:
        exists = connection.execute(
            "SELECT 1 FROM pg_roles WHERE rolname = %s", (user,)
        ).fetchone()
        if exists is None:
            connection.execute(
                sql.SQL("CREATE ROLE {} LOGIN PASSWORD {} NOBYPASSRLS").format(
                    role, secret
                )
            )
        else:
            connection.execute(
                sql.SQL("ALTER ROLE {} WITH LOGIN NOBYPASSRLS PASSWORD {}").format(
                    role, secret
                )
            )
        connection.execute(
            sql.SQL("GRANT {} TO {}").format(sql.Identifier(APP_GROUP_ROLE), role)
        )
        # Every session of the login runs as the group role: RLS applies, owner rights never do.
        connection.execute(
            sql.SQL("ALTER ROLE {} SET role = {}").format(
                role, sql.Literal(APP_GROUP_ROLE)
            )
        )
        superuser, bypass = connection.execute(
            "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = %s", (user,)
        ).fetchone() or (True, True)
    if superuser or bypass:
        sys.stderr.write(f"{user} is a superuser or bypasses RLS; refusing\n")
        return 1
    sys.stdout.write(f"{user}: login ready, member of {APP_GROUP_ROLE}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
