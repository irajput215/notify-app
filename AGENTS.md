# AGENTS.md: standing orders for this repository

## What this repository is

Notify: a WhatsApp business messaging platform for small businesses, with a ready-made workflow for
Australian health clinics. Two apps in one repository:

- `backend/`: FastAPI + SQLModel + PostgreSQL. The platform layer (workspaces with row-level security,
  roles, hash-chained audit, field encryption, structured logging, the booking engine) came from
  ClinicOS; the clinical domain was removed. Modules in `backend/app/modules/`.
- `frontend/`: Next.js (App Router) + Tailwind + shadcn/ui. Its services still serve demo data and move
  onto the API (`frontend/lib/api/client.ts`) module by module.

`docs/` is ClinicOS's platform contract, kept for the layer Notify inherited; check `backend/app/` for
what actually exists.

## Commands

```bash
# Backend (run from backend/)
uv sync                                   # install
uv run alembic upgrade head               # migrate (needs a database: docker compose up -d db)
uv run fastapi dev app/main.py            # dev server on :8000
uv run pytest -q                          # the lean suite, a few seconds
uv run ruff check . && uv run ruff format .
uv run mypy app                           # strict
uv run alembic revision --autogenerate -m "message"
uv run alembic check                      # must report no operations

# Frontend (run from frontend/)
npm install && npm run dev                # :3000
npm run lint && npm run build
bash ../scripts/generate-client.sh        # regenerate lib/api/schema.d.ts from the backend
```

`.env` is **not** committed. Run `cp .env.example .env` before anything that reads settings.

## Non-negotiables

The full statement is [docs/reference/build-contract.md](docs/reference/build-contract.md) §6 and §8.
These hold everywhere and are never traded for schedule:

- **Deny by default.** `DENY → EXPLICITLY AUTHORISE → AUDIT → VALIDATE → EXECUTE`. Never
  `ACCEPT → PROCESS → TRY TO SECURE LATER`.
- **The backend is the only security boundary** (INV-3). The frontend hides, disables and warns; it never
  decides.
- **Tenant identity is resolved, never supplied** (INV-1). A `tenant_id` from a body, header or query
  parameter is ignored and audited as a cross-tenant attempt.
- **No personal data in logs, metrics, traces or error responses** (INV-5). Never log a message body,
  a phone number, an email address or a connector credential, at any level, including in errors.
- **Audit in the same transaction as the change**, append-only, and a failed audit write fails the
  operation (INV-4).
- **Fail closed.** A missing tenant setting matches nothing, never everything.
- **`404`, not `403`, across a tenant boundary** — a `403` confirms the resource exists.
- **No secret** in source, image, log, client bundle or a committed `.env`.

## Boundaries

- **Always:** write the denial path before the success path; add the test the design names in the same
  change; run `ruff`, `mypy` and `pytest` before committing.
- **Ask first:** any schema change; any new dependency; any change to RLS, the tenant-setting helper or
  the permission matrix; any change to CI pipeline order; any new third-party data flow.
- **Never:** accept `tenant_id` from the client; commit `.env`; ship a feature with an open High or Critical finding.

## Where things live

| Path | Owns |
|---|---|
| `backend/app/modules/` | Domain modules: `identity_tenancy`, `users_roles`, `contacts`, `locations`, `practice`, `appointments`, `audit` |
| `backend/app/core/` | Tenant transactions, field encryption, logging and redaction, rate limits, security headers |
| `backend/app/alembic/versions/` | `0001_notify_baseline` and what follows it |
| `frontend/` | The Next.js app |
| [`docs/features/`](docs/features/README.md) | Platform feature contracts inherited from ClinicOS |
| [`docs/reference/`](docs/reference/) | Build contract, gates, Definition of Done, database conventions, decisions |
| [`.agents/skills/`](.agents/skills/) | Reusable workflows. Load the matching skill before doing the work it covers |

## Conventions that differ from the upstream template

- **Python 3.14.** `except A, B:` without parentheses is valid (PEP 758). It looks like a Python 2 syntax
  error to older tools and to Python 3.13 — it is correct here. Do not "fix" it.
- **Layout — one convention, no exceptions.** All new domain code lives in
  `backend/app/modules/<module_id>/{models,schemas,service,router}.py`. A module owns its tables and is
  reached only through its service facade. The template layer (`app/models.py`, `app/crud.py`,
  `app/api/routes/*.py`) is **legacy: frozen**. Do not add a model, service or route outside
  `app/modules/`, and do not extend the legacy layer.
- **Where models register.** Every table must be imported by `app/db_models.py` — the single place Alembic
  reads. Never import a model into `app/models.py` just to register it.
- **Constraint names.** `app.core.metadata` sets one naming convention. Declare check constraints with a
  suffix (`name="status"` renders as `ck_tenants_status`). Run `uv run alembic check` before committing a
  model change; it must report **no** operations.
- **Tenant transactions.** Use `app.core.db.tenant_transaction(...)` for any query against tenant data.
  It sets `app.tenant_id` with `SET LOCAL` inside the transaction and refuses to open without a tenant.
  Never use a session-level `SET`.
- **Workspace, internally tenant.** The API and the UI say *workspace*; the database and the code say
  `tenant` (`tenants`, `tenant_id`, `app.tenant_id`). Say *contact*, *agent* and *location*, never
  *patient*, *prescriber* or *clinic*, outside a clinic-specific feature.
- **Every new tenant table gets forced RLS in its migration**, with the two policies the baseline's
  `_standard_policies` creates, and explicit grants to `notify_app` (no `DELETE` unless the app really
  deletes). The app connects as `notify_app`; migrations run as the owner (`MIGRATION_DATABASE_URL`).
