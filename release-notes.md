# Release notes

## Unreleased

### Platform (migrated from ClinicOS)

- Backend copied from ClinicOS's platform layer: workspaces with forced row-level security, Owner,
  Admin and Agent roles, signup with email verification, invitations, password reset, step-up, the
  hash-chained audit log, field encryption, structured logging and the booking engine.
- Removed the cannabis-clinic domain: prescriptions, TGA approvals, clinical records, SOPs, the
  dashboard, care relationships, intake, pharmacies and the prescriber onboarding pack.
- `patients` became `contacts` (E.164 phone, encrypted with a blind index; tags; external ids;
  WhatsApp opt-in evidence). `clinics` became `locations`. Tenancy routes moved to `/workspaces`.
- One baseline migration replaces 41: tables, RLS, the `notify_app` role and least-privilege grants.
- Log redaction covers phone numbers, message text, Meta access tokens and Cliniko API keys.
- A lean backend test suite (seconds, run as `notify_app`) and one CI workflow.
- Frontend: the Notify Next.js app, with a typed API client generated from the backend.
