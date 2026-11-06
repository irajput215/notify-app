# docs2: how Notify is built

Notify is two apps in one repository:

| Folder | What | Stack |
| --- | --- | --- |
| [`backend/`](../backend/) | The API: workspaces, auth, roles, contacts, bookings, audit | FastAPI, SQLModel, PostgreSQL (Neon, Sydney), Alembic |
| [`frontend/`](../frontend/) | The web app: inbox, contacts, templates, automations, settings, marketing site | Next.js (App Router), React, Tailwind, shadcn/ui |

The backend began as a copy of ClinicOS's platform layer (tenancy with row-level security, roles,
the hash-chained audit log, field encryption, structured logging and the booking engine) with the
cannabis-clinic domain removed. The frontend is the Notify Next.js app; ClinicOS's Vite frontend was
not carried over.

`docs/` holds the platform contract inherited from ClinicOS (requirements, invariants, gates). This
folder covers how the two apps fit together.

| Document | What it answers |
| --- | --- |
| [architecture.md](architecture.md) | How the frontend talks to the backend, and where each concern lives |
| [adr/](adr/) | Decisions specific to the app |
| [sdlc/](sdlc/) | API contracts carried over from ClinicOS (auth, calendar and booking) |
