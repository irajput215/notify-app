# Notify

A WhatsApp business messaging platform for small businesses, with a ready-made workflow for
Australian health clinics: reminders, rescheduling, FAQs and handover to a person, connected to the
clinic's booking system.

| | |
| --- | --- |
| `backend/` | FastAPI API: workspaces, auth, roles, contacts, bookings, audit. PostgreSQL with row-level security |
| `frontend/` | Next.js web app: inbox, contacts, templates, automations, settings and the marketing site |

## Run it

See [HOW_TO_RUN.md](HOW_TO_RUN.md). In short:

```bash
cp .env.example .env
docker compose up -d db mailpit
cd backend && uv sync && uv run alembic upgrade head && uv run python app/initial_data.py
uv run fastapi dev app/main.py           # http://localhost:8000/docs
cd ../frontend && npm install && npm run dev   # http://localhost:3000
```

## What is here

The backend began as a copy of ClinicOS's platform layer with the cannabis-clinic domain removed:

- **Workspaces** with forced row-level security on every tenant table; the app connects as a
  non-owner `notify_app` role that cannot bypass it.
- **Roles**: Owner, Admin and Agent over a permission set (`inbox:*`, `contacts:*`, `templates:manage`,
  `workflows:manage`, `integrations:manage`, `billing:manage`, `audit:read`, `users:manage`,
  `workspace:*`).
- **Signup** with email verification, login, staff invitations, password reset, step-up.
- **Contacts**: phone numbers in E.164, encrypted with a blind index; tags; external ids; WhatsApp
  opt-in evidence.
- **Bookings**: the built-in calendar, public booking page and idempotent reminder emails.
- **Audit**: hash-chained, append-only, partitioned; every read and write of contact data.
- **Logs**: JSON with request and correlation ids; phone numbers, message text and credentials redacted.

The frontend is the Notify Next.js app. It still runs on demo data; its services move onto the typed
API client (`frontend/lib/api/`) module by module.

## Next

`channels/whatsapp`, `conversations`, `templates`, `webhooks`, `workflows`, `ai`, `connectors/booking`
(Cliniko and the built-in appointments module), on Redis and arq for webhook intake and paced sends.

## Checks

```bash
cd backend && uv run ruff check . && uv run mypy app && uv run pytest -q
cd frontend && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs the same, plus `alembic upgrade head` and `alembic check` on an
empty database.
