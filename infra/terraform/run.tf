locals {
  common_env = {
    PROJECT_NAME            = "Notify"
    FIRST_SUPERUSER         = var.first_superuser_email
    FRONTEND_HOST           = local.frontend_url
    EMAILS_FROM_EMAIL       = var.emails_from
    SMTP_HOST               = var.smtp_host
    SMTP_PORT               = tostring(var.smtp_port)
    SMTP_USER               = var.smtp_user
    SMTP_TLS                = "true"
    USERS_OPEN_REGISTRATION = tostring(var.users_open_registration)
    RATE_LIMIT_ENABLED      = "true"
    # Cloud Run's front end is the one proxy in front of the container (app/core/proxy.py).
    TRUSTED_PROXY_HOPS = "1"
  }
  # env var name -> secret id
  common_secret_env = merge(
    {
      SECRET_KEY                      = "notify-secret-key"
      FIELD_ENCRYPTION_KEY            = "notify-field-encryption-key"
      FIRST_SUPERUSER_PASSWORD        = "notify-first-superuser-password"
      BOOKING_NOTIFICATIONS_RUN_TOKEN = "notify-reminders-token"
      DATABASE_URL                    = "notify-db-app-url"
    },
    local.smtp_enabled ? { SMTP_PASSWORD = "notify-smtp-password" } : {},
  )
}

# -- The API ----------------------------------------------------------------------------------------

resource "google_cloud_run_v2_service" "backend" {
  name                = "notify-backend"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.backend.email

    scaling {
      min_instance_count = var.backend_min_instances
      max_instance_count = var.backend_max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.notify.connection_name]
      }
    }

    containers {
      image = local.placeholder_image

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }

      dynamic "env" {
        for_each = local.common_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.common_secret_env
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.this[env.value].secret_id
              version = "latest"
            }
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  # The deploy workflow owns the image; Terraform owns everything else.
  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_secret_manager_secret_version.this,
    google_secret_manager_secret_iam_member.backend,
    google_project_iam_member.cloudsql_client,
  ]
}

# -- The web app ------------------------------------------------------------------------------------

resource "google_cloud_run_v2_service" "frontend" {
  name                = "notify-frontend"
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = false

  template {
    service_account = google_service_account.frontend.email

    scaling {
      min_instance_count = var.frontend_min_instances
      max_instance_count = var.frontend_max_instances
    }

    containers {
      image = local.placeholder_image
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

# Both are public web endpoints; the API authenticates every request itself.
resource "google_cloud_run_v2_service_iam_member" "public" {
  for_each = {
    backend  = google_cloud_run_v2_service.backend.name
    frontend = google_cloud_run_v2_service.frontend.name
  }
  name     = each.value
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# -- Migrations -------------------------------------------------------------------------------------

resource "google_cloud_run_v2_job" "migrate" {
  name                = "notify-migrate"
  location            = var.region
  deletion_protection = false

  template {
    task_count = 1
    template {
      service_account = google_service_account.migrate.email
      max_retries     = 0
      timeout         = "600s"

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.notify.connection_name]
        }
      }

      containers {
        image   = local.placeholder_image
        command = ["bash", "scripts/deploy_migrate.sh"]

        dynamic "env" {
          for_each = local.common_env
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = merge(local.common_secret_env, {
            MIGRATION_DATABASE_URL = "notify-db-owner-url"
            APP_DB_PASSWORD        = "notify-db-app-password"
          })
          content {
            name = env.key
            value_source {
              secret_key_ref {
                secret  = google_secret_manager_secret.this[env.value].secret_id
                version = "latest"
              }
            }
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].template[0].containers[0].image,
      client,
      client_version,
    ]
  }

  depends_on = [
    google_secret_manager_secret_version.this,
    google_secret_manager_secret_iam_member.migrate,
    google_project_iam_member.cloudsql_client,
  ]
}

# -- Booking reminders ------------------------------------------------------------------------------

# Interim: replaced by a scheduled arq job once Redis (Memorystore) is in.
resource "google_cloud_scheduler_job" "reminders" {
  name      = "notify-booking-reminders"
  region    = var.region
  schedule  = var.reminders_schedule
  time_zone = "Australia/Sydney"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "POST"
    uri         = "${local.backend_url}/api/v1/internal/booking-notifications/run"
    headers = {
      Authorization = "Bearer ${random_password.reminders_token.result}"
    }
  }

  depends_on = [google_project_service.apis]
}
