# Every credential lives in Secret Manager and reaches a container as an environment variable bound
# to `latest`. Values generated here are also in the Terraform state: keep the state bucket private.

resource "random_password" "secret_key" {
  length  = 64
  special = false
}

resource "random_bytes" "field_encryption_key" {
  length = 32
}

resource "random_password" "first_superuser" {
  length  = 32
  special = false
}

resource "random_password" "reminders_token" {
  length  = 48
  special = false
}

locals {
  # Decided from the host, not the password: a condition on a sensitive value cannot drive for_each.
  smtp_enabled = var.smtp_host != ""

  secret_ids = concat(
    [
      "notify-secret-key",
      "notify-field-encryption-key",
      "notify-first-superuser-password",
      "notify-reminders-token",
      "notify-db-app-url",
      "notify-db-app-password",
      "notify-db-owner-url",
    ],
    local.smtp_enabled ? ["notify-smtp-password"] : [],
  )

  secrets = merge(
    {
      "notify-secret-key"               = random_password.secret_key.result
      "notify-field-encryption-key"     = random_bytes.field_encryption_key.base64
      "notify-first-superuser-password" = random_password.first_superuser.result
      "notify-reminders-token"          = random_password.reminders_token.result
      "notify-db-app-url"               = local.db_app_url
      "notify-db-app-password"          = random_password.db_app.result
      "notify-db-owner-url"             = local.db_owner_url
    },
    local.smtp_enabled ? { "notify-smtp-password" = var.smtp_password } : {},
  )
}

resource "google_secret_manager_secret" "this" {
  for_each  = toset(local.secret_ids)
  secret_id = each.value
  replication {
    user_managed {
      replicas {
        location = var.region
      }
    }
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "this" {
  for_each    = google_secret_manager_secret.this
  secret      = each.value.id
  secret_data = local.secrets[each.key]
}

# Who may read which secret. The API never sees the owner URL; the migration job does.
locals {
  backend_secrets = concat(
    ["notify-secret-key", "notify-field-encryption-key", "notify-first-superuser-password", "notify-reminders-token", "notify-db-app-url"],
    local.smtp_enabled ? ["notify-smtp-password"] : [],
  )
  migrate_secrets = concat(local.backend_secrets, ["notify-db-owner-url", "notify-db-app-password"])
}

resource "google_secret_manager_secret_iam_member" "backend" {
  for_each  = toset(local.backend_secrets)
  secret_id = google_secret_manager_secret.this[each.value].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "migrate" {
  for_each  = toset(local.migrate_secrets)
  secret_id = google_secret_manager_secret.this[each.value].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.migrate.email}"
}
