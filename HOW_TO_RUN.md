# How to run Notify

## Requirements

- Python 3.14 and [uv](https://docs.astral.sh/uv/)
- Node 20+ and npm
- Docker (for PostgreSQL and Mailpit), or a PostgreSQL 16+ you run yourself

## 1. Settings

```bash
cp .env.example .env
```

Replace every `REPLACE_ME`. `SECRET_KEY` must be at least 32 bytes:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 2. Database and mail

```bash
docker compose up -d db mailpit
```

Mailpit catches every email (signup verification, invitations, password reset) at
http://localhost:8025.

## 3. Backend

```bash
cd backend
uv sync
uv run alembic upgrade head        # one baseline migration: tables, RLS, roles, grants
uv run python app/initial_data.py  # the first superuser; a demo workspace if SEED_DEMO_TENANT=true
uv run fastapi dev app/main.py     # http://localhost:8000, API docs at /docs
```

## 4. Frontend

```bash
cd frontend
cp .env.example .env.local         # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                        # http://localhost:3000
```

Sign up at `POST /api/v1/users/signup` (or from the app once it is wired), open the link from Mailpit,
and you are the Owner of a new workspace.

After any API change, regenerate the typed client:

```bash
bash scripts/generate-client.sh
```

## 5. Tests

```bash
cd backend
uv run pytest -q                   # needs the migrated local database from step 3
```

The suite connects as `notify_app` and truncates every table on start and finish, so it refuses any
database that is not on `localhost`.

## Connecting as the application role

The baseline migration creates `notify_app` (`NOLOGIN`, `NOBYPASSRLS`, not an owner). In every real
environment the API must connect as a login user that is a member of it, so row-level security is
enforced; migrations run as the owner through `MIGRATION_DATABASE_URL`. Once, as the owner:

```sql
CREATE ROLE notify_api LOGIN PASSWORD '...' NOBYPASSRLS IN ROLE notify_app;
ALTER ROLE notify_api SET role = 'notify_app';
```

Then set `DATABASE_URL` to `notify_api` and `MIGRATION_DATABASE_URL` to the owner.

## Production notes

- Neon project and app hosting both in Sydney (`ap-southeast-2`); turn scale-to-zero off.
- Set `FIELD_ENCRYPTION_KEY` before any real phone number is stored, and never change it without
  re-encrypting.
- `FRONTEND_HOST` is the only CORS origin and the base of every emailed link.
- Rate limits are in process memory: one API instance until they move to Redis.
