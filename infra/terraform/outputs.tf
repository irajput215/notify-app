output "backend_url" {
  value = local.backend_url
}

output "frontend_url" {
  value = local.frontend_url
}

output "registry" {
  description = "Push images here: <registry>/backend:<sha>, <registry>/frontend:<sha>."
  value       = local.registry
}

output "workload_identity_provider" {
  description = "GitHub variable GCP_WIF_PROVIDER."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account" {
  description = "GitHub variable GCP_DEPLOYER_SA."
  value       = google_service_account.deployer.email
}

output "db_connection_name" {
  value = google_sql_database_instance.notify.connection_name
}

output "first_superuser_password_secret" {
  description = "Read it with: gcloud secrets versions access latest --secret=<this>"
  value       = google_secret_manager_secret.this["notify-first-superuser-password"].secret_id
}
