"""A lean, fast suite: one session, one database, the app connected as `notify_app`.

ClinicOS's 146 test files (and its Playwright suite) were left behind on purpose to keep the loop
fast; this suite covers the platform guarantees Notify depends on. Bring the rest back from
ClinicOS as features need them.

**Every pooled connection runs `SET ROLE notify_app`** (the non-owner, `NOBYPASSRLS` role the baseline
migration creates), so a missing grant or a query that only worked because the owner bypasses RLS
fails here, not in production. Teardown truncates as the owner on a separate engine.

Run against a local, migrated database only (`alembic upgrade head`); a remote host is refused.
"""

import secrets
from collections.abc import Iterator
from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlmodel import Session

import app.db_models  # noqa: F401  (every model registered before the first query)
from app.core.config import settings
from app.core.db import engine, init_db
from app.core.rate_limit import limiter

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "db"})
APP_ROLE = "notify_app"

if settings.DATABASE_URL.hosts()[0]["host"] not in _LOCAL_HOSTS:
    raise RuntimeError(
        "DATABASE_URL is not a local database; the suite truncates tables, so it is refused."
    )

# HS256 needs a key of at least 32 bytes; a short local key is replaced for the test process only.
if len(settings.SECRET_KEY.encode()) < 32:
    settings.SECRET_KEY = secrets.token_urlsafe(48)


def _outside_transaction(dbapi_connection: Any, statement: str) -> None:  # noqa: ANN401
    autocommit = dbapi_connection.autocommit
    dbapi_connection.autocommit = True
    try:
        dbapi_connection.execute(statement)
    finally:
        dbapi_connection.autocommit = autocommit


@event.listens_for(engine, "connect")
def _become_app_role(dbapi_connection: Any, _record: Any) -> None:  # noqa: ANN401
    _outside_transaction(dbapi_connection, f"SET ROLE {APP_ROLE}")


_TABLES = (
    "appointment_notifications",
    "appointments",
    "appointment_hours",
    "appointment_settings",
    "contacts",
    "locations",
    "staff_invitations",
    "user_roles",
    "role_permissions",
    "roles",
    "step_up_grants",
    "tenant_settings",
    "signup_requests",
    "audit_log",
    '"user"',
    "tenants",
)


def _truncate() -> None:
    owner = create_engine(str(settings.MIGRATION_DATABASE_URL))
    with owner.begin() as connection:
        connection.execute(
            text(f"TRUNCATE {', '.join(_TABLES)} RESTART IDENTITY CASCADE")
        )
    owner.dispose()


@pytest.fixture(scope="session", autouse=True)
def database() -> Iterator[None]:
    engine.dispose()  # every connection from here on is opened as the app role
    _truncate()
    with Session(engine) as session:
        init_db(session)
    yield
    engine.dispose()
    _truncate()


@pytest.fixture(autouse=True)
def _no_real_mail() -> Iterator[list[dict[str, Any]]]:
    """Capture every email instead of sending it; each test reads its own."""
    sent: list[dict[str, Any]] = []

    def capture(**message: Any) -> bool:
        sent.append(message)
        return True

    with (
        patch("app.utils.send_email", side_effect=capture),
        patch("app.utils.deliver_email", side_effect=capture),
        patch("app.api.routes.login.send_email", side_effect=capture),
    ):
        yield sent


@pytest.fixture(autouse=True)
def _reset_rate_limits() -> None:
    limiter.clear()


@pytest.fixture(scope="session")
def client(database: None) -> Iterator[TestClient]:  # noqa: ARG001 - ordering only
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
