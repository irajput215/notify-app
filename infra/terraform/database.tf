# PostgreSQL 16 on Cloud SQL. No authorised networks: Cloud Run reaches it through the Cloud SQL
# connector (IAM-authorised, encrypted), and nothing else can.
resource "google_sql_database_instance" "notify" {
  name                = "notify-db"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = var.db_deletion_protection

  settings {
    tier              = var.db_tier
    availability_type = var.db_availability_type
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "16:00" # 02:00-03:00 Sydney
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 14
      }
    }

    maintenance_window {
      day  = 7 # Sunday
      hour = 17
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "notify" {
  name     = "notify"
  instance = google_sql_database_instance.notify.name
}

# The schema owner. Migrations run as this user; the API never does.
resource "random_password" "db_owner" {
  length  = 32
  special = false
}

resource "google_sql_user" "owner" {
  name     = "notify_owner"
  instance = google_sql_database_instance.notify.name
  password = random_password.db_owner.result
}

# The API's login. Created by the migration job (backend/scripts/ensure_app_login.py) as a member
# of `notify_app` with NOBYPASSRLS, not here: a user made through the Cloud SQL API joins
# `cloudsqlsuperuser`, and the API must hold nothing beyond `notify_app`.
resource "random_password" "db_app" {
  length  = 32
  special = false
}

locals {
  db_socket = "/cloudsql/${google_sql_database_instance.notify.connection_name}"
  # `localhost` satisfies the URL parser; libpq's `host` query parameter points it at the socket.
  db_app_url   = "postgresql://notify_api:${random_password.db_app.result}@localhost/${google_sql_database.notify.name}?host=${local.db_socket}"
  db_owner_url = "postgresql://${google_sql_user.owner.name}:${random_password.db_owner.result}@localhost/${google_sql_database.notify.name}?host=${local.db_socket}"
}
