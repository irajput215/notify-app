---
doc_id: OZ-FEAT-INDEX
title: Feature set index
owner: CTO (interim: Ishu Rajput)
status: DRAFT
last_reviewed: 2026-10-04
classification: RESTRICTED
---

# Feature set

> **Notify note (2026-11-06).** These are ClinicOS's platform feature documents, kept for the
> platform layer Notify inherited (tenancy, authentication, users and roles, audit, integration
> boundaries, admin, observability). Clinical features 05-12 and 14 were removed with their code. Read
> "clinic" as *workspace*, "patient" as *contact*, and the seven clinical roles as Owner, Admin and
> Agent (`backend/app/modules/users_roles/catalog.py` is the source of truth). Notify's own features
> (channels, conversations, templates, workflows, AI, Cliniko) get new folders here as they are built.

Every feature is a self-contained folder of **seven short documents**, in build order. Numbering is the
dependency order: a feature may depend on any lower number, never on a higher one.

| # | Feature | Owns | Gates | Depends on |
|:---:|---|---|:---:|---|
| 00 | [foundations](00-foundations/01-requirements.md) | repo layout, Docker, environments, CI security pipeline | 1 | — |
| 01 | [tenancy-and-clinics](01-tenancy-and-clinics/01-requirements.md) | `tenants` (workspaces), `locations`, workspace settings | 1, 2 | 00 |
| 02 | [authentication](02-authentication/01-requirements.md) | identity, sessions, MFA, step-up | 3 | 00, 01 |
| 03 | [users-and-roles](03-users-and-roles/01-requirements.md) | users, roles, permissions, break-glass | 3 | 02 |
| 04 | [audit-log](04-audit-log/01-requirements.md) | append-only `audit_log`, envelope, immutable export | 2 | 01 |
| 13 | [integration-boundaries](13-integration-boundaries/01-requirements.md) | provider contracts, SSRF, outbound calls (Meta, Cliniko) | 5 | 03 |
| 15 | [admin-and-config](15-admin-and-config/01-requirements.md) | feature flags, retention jobs, break-glass | 4 | 03 |
| 16 | [operations-and-observability](16-operations-and-observability/01-requirements.md) | logs, metrics, alerts, incident readiness | 6 | all |

## The seven documents

| File | Answers | Read it to |
|---|---|---|
| `01-requirements.md` | What must this do, and how do we know it works? | Scope R1…Rn with testable acceptance |
| `02-user-stories.md` | Who needs it and why? | Stories grouped by role, each with S: and A: criteria |
| `03-design.md` | How is it built? | Tables, constraints, RLS, endpoints, request path, failure behaviour |
| `04-threat-model.md` | What can go wrong? | STRIDE with residual score and named owner |
| `05-data-and-audit.md` | How is data handled and what is recorded? | Field classification, audit events, retention |
| `06-test-plan.md` | How do we prove it? | F / S / A test tables with exact pytest commands |
| `07-definition-of-done.md` | When is it finished, and who signs? | Six-part checklist, gate governance, blocking open items |

## The audit standard every document follows

A regulated clinical platform must **prove** its controls. Every claim carries a three-part chain:

```
SOURCE ──────────────> SCORE ──────────────────> EVIDENCE
Why the control exists  Likelihood × Impact        The executable proof
```

1. **Source** — cite the upstream document and section, or the instrument by name.
   Never introduce a constraint from nowhere.
2. **Score** — every threat carries inherent risk, the control, residual risk as
   `Likelihood × Impact` with a band (`Low ≤4`, `Medium 5–9`, `High 10–16`, `Critical ≥17`), and a
   named human role as owner — never "the dev team".
3. **Evidence** — an executable artefact: a named pytest path, a
   `information_schema.role_table_grants` extract, a gate sign-off. A test name without its command is
   not evidence.

### Non-negotiable rules

- **Append-only by grant, not by convention.** The application role gets `SELECT, INSERT` and never
  `UPDATE`, `DELETE` or `TRUNCATE` on audit and event tables. Proven by a grant-inspection test.
- **Fail closed.** Any error resolving tenant or authorisation denies. A missing tenant setting matches
  nothing, never everything (`NULLIF(current_setting('app.tenant_id', true), '')`).
- **`404`, not `403`, across a tenant boundary.** Returning `403` confirms existence.
- **Denied and failed attempts are audited** with the same fidelity as successes.
- **No self-approval.** The person who delivered the work never signs its gate.
- **`REQUIRES LEGAL/REGULATORY VALIDATION`** on anything depending on a regulator's view, a contract
  term we have not seen, or a fact we do not have. Never guess, never claim compliance.

## Format

Folder: `NN-<kebab-name>/`. Every file carries **document-governance frontmatter** so the set can be
indexed, reviewed on a cycle, and mapped to its gates and its sources:

```yaml
---
doc_id: OZ-FEAT-<NN>-<DOC>
title: "<Module> — <document type>"
owner: <role>
status: DRAFT — for review
last_reviewed: 2026-10-04
next_review: 2026-11-04
classification: RESTRICTED
feature_id: FEAT-<NN>
phase: <owning phase directory>
gate: [<gate numbers this feature must evidence>]
source:
  - clinic-os-secure-by-design/<doc>.md      # external, never rendered as a link
repo_docs:
  - 01-requirements.md                        # sibling links inside this folder
---
```

Keep files short — roughly 50–150 lines. If a document needs more, it is probably two documents.

## Source of truth

`clinic-os-secure-by-design/` — external, read-only, normative for controls, gates, invariants and
regulatory obligations. Where the source names technology this repo does not use, the control is retained
and the implementation is re-expressed against Python 3.14 / FastAPI / SQLModel / Alembic / Pydantic;
those translations are recorded in `../reference/decisions/`.
