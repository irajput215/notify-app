# Architecture

```
Browser ──> Next.js (frontend/, Cloud Run) ──fetch──> FastAPI (backend/, Cloud Run, /api/v1) ──> Cloud SQL PostgreSQL 16 (australia-southeast1)
                                                                        │
                                                                        ├──> Memorystore Redis + arq (queues, schedules)  [next]
                                                                        ├──> WhatsApp Cloud API (Meta webhooks)   [next]
                                                                        └──> Cliniko, LLM provider                [next]
```

## Frontend to backend

- The frontend calls the API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). The backend
  allows exactly one CORS origin, `FRONTEND_HOST` (default `http://localhost:3000`), which is also the
  base of every emailed link (`/verify-email`, `/accept-invite`, `/reset-password`).
- The typed client is generated from the backend's OpenAPI document into `frontend/lib/client/` by
  `scripts/generate-client.sh`. Regenerate it after any API change.
- Authentication is a short-lived bearer token (15 minutes) from `POST /api/v1/login/access-token` or
  from `POST /api/v1/users/signup/verify`.

## Backend layers

- **Tenancy.** A workspace is a row in `tenants`. Every tenant table has `ENABLE` and `FORCE ROW LEVEL
  SECURITY` with policies on `current_setting('app.tenant_id')`, which `app.core.db.tenant_transaction`
  sets per transaction. The app connects as `notify_app` (non-owner, `NOBYPASSRLS`), so the policies
  are the isolation boundary; every query also filters on `tenant_id` as a second line of defence.
- **Authorisation.** `app.modules.users_roles.policy.can(actor, permission, resource)` is the only
  decision point. Roles (Owner, Admin, Agent) are bundles of permissions in `catalog.py`.
- **Audit.** Every write, and every read of contacts or bookings, writes a hash-chained event to the
  partitioned, append-only `audit_log` on the same transaction. Payloads are allow-listed per action.
- **Secrets at rest.** Phone numbers (and, next, Meta tokens and Cliniko keys) are AES-256-GCM
  encrypted with a keyed blind index for exact lookup (`app.core.field_crypto`).
- **Logs.** JSON lines with request and correlation ids; phone numbers, message text and credentials
  are redacted before any line is written (`app.core.logging`).

## Module map

| Module | Tables |
| --- | --- |
| `identity_tenancy` | `tenants`, `step_up_grants` |
| `users_roles` | `roles`, `permissions`, `role_permissions`, `user_roles`, `staff_invitations`, `signup_requests` |
| `contacts` | `contacts` |
| `locations` | `locations` |
| `practice` | `tenant_settings` |
| `appointments` | `appointments`, `appointment_settings`, `appointment_hours`, `appointment_notifications` |
| `audit` | `audit_log` |

Next modules: `channels/whatsapp`, `conversations`, `templates`, `webhooks`, `workflows`, `ai`,
`connectors/booking` (Cliniko plus the built-in appointments module).
