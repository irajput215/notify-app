data "google_project" "this" {}

locals {
  # Cloud Run's deterministic URLs, known before either service exists, so the backend's CORS origin
  # and the frontend's API URL need no second apply.
  backend_url  = "https://notify-backend-${data.google_project.this.number}.${var.region}.run.app"
  frontend_url = "https://notify-frontend-${data.google_project.this.number}.${var.region}.run.app"
  registry     = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.notify.repository_id}"
  # Terraform creates the services with Google's sample image; the deploy workflow replaces it.
  placeholder_image = "us-docker.pkg.dev/cloudrun/container/hello"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "sts.googleapis.com",
  ])
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "notify" {
  repository_id = "notify"
  location      = var.region
  format        = "DOCKER"
  description   = "Notify backend and frontend images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 20
    }
  }

  depends_on = [google_project_service.apis]
}
