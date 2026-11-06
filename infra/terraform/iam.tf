# One identity per workload, each with only what it needs.

resource "google_service_account" "backend" {
  account_id   = "notify-backend"
  display_name = "Notify API (Cloud Run)"
}

resource "google_service_account" "frontend" {
  account_id   = "notify-frontend"
  display_name = "Notify web app (Cloud Run)"
}

resource "google_service_account" "migrate" {
  account_id   = "notify-migrate"
  display_name = "Notify migration job (Cloud Run Job)"
}

resource "google_service_account" "deployer" {
  account_id   = "notify-deployer"
  display_name = "GitHub Actions deploys (Workload Identity Federation)"
}

resource "google_project_iam_member" "cloudsql_client" {
  for_each = toset([google_service_account.backend.email, google_service_account.migrate.email])
  project  = var.project_id
  role     = "roles/cloudsql.client"
  member   = "serviceAccount:${each.value}"
}

# -- GitHub Actions: keyless deploys ----------------------------------------------------------------

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"
  depends_on                = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  # Only this repository's main branch can exchange a token.
  attribute_condition = "assertion.repository == '${var.github_repository}' && assertion.ref == 'refs/heads/main'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

resource "google_artifact_registry_repository_iam_member" "deployer_push" {
  repository = google_artifact_registry_repository.notify.name
  location   = var.region
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_project_iam_member" "deployer_run" {
  project = var.project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Deploying a revision that runs as a service account needs actAs on that account.
resource "google_service_account_iam_member" "deployer_act_as" {
  for_each = {
    backend  = google_service_account.backend.name
    frontend = google_service_account.frontend.name
    migrate  = google_service_account.migrate.name
  }
  service_account_id = each.value
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}
