# Deploying Notify on Google Cloud

Everything runs in Sydney (`australia-southeast1`), so personal data stays in Australia.

```
                 ┌────────────────────── Google Cloud (australia-southeast1) ──────────────────────┐
Browser ───────> │ Cloud Run: notify-frontend (Next.js standalone)                                  │
   │             │                                                                                  │
   └───────────> │ Cloud Run: notify-backend (FastAPI) ──Cloud SQL connector──> Cloud SQL Postgres 16│
                 │      ^  secrets from Secret Manager                    ^                          │
Cloud Scheduler ─┘ (booking reminders, every 15 min)                     │                          │
                 │ Cloud Run Job: notify-migrate (alembic, API login, seed) ┘                        │
                 │ Artifact Registry: notify/backend, notify/frontend                                │
                 └──────────────────────────────────────────────────────────────────────────────────┘
GitHub Actions ──(Workload Identity Federation, no keys)──> build, push, migrate, roll out
```

| Piece | Resource | File |
| --- | --- | --- |
| API | Cloud Run service `notify-backend` | `terraform/run.tf` |
| Web app | Cloud Run service `notify-frontend` | `terraform/run.tf` |
| Migrations | Cloud Run Job `notify-migrate` running `backend/scripts/deploy_migrate.sh` | `terraform/run.tf` |
| Database | Cloud SQL PostgreSQL 16, PITR backups, no authorised networks | `terraform/database.tf` |
| Secrets | Secret Manager, one accessor binding per secret per workload | `terraform/secrets.tf` |
| Images | Artifact Registry `notify` | `terraform/main.tf` |
| Reminders | Cloud Scheduler job calling the reminder endpoint with a bearer token | `terraform/run.tf` |
| CI/CD | Workload Identity pool trusting only this repo's `main` | `terraform/iam.tf`, `.github/workflows/deploy.yml` |

## How the database roles work

- `notify_owner` (a Cloud SQL user, created by Terraform) owns the schema and runs migrations.
- The baseline migration creates `notify_app`: `NOLOGIN`, `NOBYPASSRLS`, not an owner.
- The migration job then creates `notify_api` (`backend/scripts/ensure_app_login.py`): a login that is
  a member of `notify_app` only, with `SET role = notify_app` on every session. It is created in SQL,
  not through the Cloud SQL API, because API-created users join `cloudsqlsuperuser`.
- The API connects as `notify_api`, so forced row-level security is the isolation boundary.

## First deploy

You need `gcloud`, Terraform 1.6+, and Owner on the project.

**1. Project and state bucket** (once):

```bash
export PROJECT_ID=your-gcp-project
gcloud auth login && gcloud auth application-default login
gcloud config set project "$PROJECT_ID"
gcloud services enable cloudresourcemanager.googleapis.com serviceusage.googleapis.com
gcloud storage buckets create "gs://${PROJECT_ID}-tfstate" --location=australia-southeast1 --uniform-bucket-level-access
gcloud storage buckets update "gs://${PROJECT_ID}-tfstate" --versioning
```

The state holds generated secrets: keep that bucket private.

**2. Infrastructure:**

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill it in; it is gitignored
terraform init -backend-config="bucket=${PROJECT_ID}-tfstate"
terraform plan
terraform apply                                 # Cloud SQL takes about 10 minutes
```

The services start on Google's sample image; the first deploy replaces it.

**3. GitHub** (Settings → Secrets and variables → Actions → Variables):

| Variable | Value |
| --- | --- |
| `GCP_PROJECT_ID` | your project id |
| `GCP_WIF_PROVIDER` | `terraform output -raw workload_identity_provider` |
| `GCP_DEPLOYER_SA` | `terraform output -raw deployer_service_account` |

**4. Deploy:** push to `main` (the deploy runs after CI passes), or run the *Deploy* workflow by hand.
It builds both images, runs the migration job, rolls out the API and the web app, and checks
`/api/v1/utils/health-check/`.

**5. Sign in:** the platform superuser is `first_superuser_email`; its password:

```bash
gcloud secrets versions access latest --secret=notify-first-superuser-password
```

## Day to day

- **Logs:** Cloud Logging picks up the API's JSON lines (already redacted) per Cloud Run revision.
- **Roll back:** `gcloud run services update-traffic notify-backend --to-revisions=<rev>=100 --region australia-southeast1`.
  A migration is not rolled back by this; write a new one.
- **Rotate a secret:** add a version in Secret Manager and redeploy (bindings use `latest`). For the
  API's database password (`notify-db-app-password`), update `notify-db-app-url` to match and run the
  migration job: it resets the login's password.
- **Database shell:** `gcloud sql connect notify-db --user=notify_owner --database=notify`.

## Deliberate limits, and what changes them

| Limit | Why | When it changes |
| --- | --- | --- |
| `backend_max_instances = 1` | Rate-limit counters are in process memory | Memorystore (Redis) + counters moved there |
| Reminders via Cloud Scheduler + HTTP | No queue yet | arq on Memorystore, or Cloud Tasks |
| `*.run.app` URLs | No domain yet | Cloud Run domain mapping or a global load balancer + managed certificate; update `FRONTEND_HOST`/`NEXT_PUBLIC_API_URL` |
| Public IP on Cloud SQL (no authorised networks) | Simplest secure path for the connector | Private IP + Serverless VPC Access when Memorystore needs a VPC anyway |
| `ZONAL` database | Cost | `db_availability_type = "REGIONAL"` |
