variable "project_id" {
  description = "The GCP project to deploy into."
  type        = string
}

variable "region" {
  description = "Where everything runs. Sydney keeps Australian personal data in Australia."
  type        = string
  default     = "australia-southeast1"
}

variable "github_repository" {
  description = "owner/name of the repository allowed to deploy through Workload Identity Federation."
  type        = string
  default     = "irajput215/notify-app"
}

# -- Cloud SQL --------------------------------------------------------------------------------------

variable "db_tier" {
  description = "Cloud SQL machine type. db-custom-1-3840 (1 vCPU, 3.75 GB) to start; db-g1-small is cheaper but shared-core with no SLA."
  type        = string
  default     = "db-custom-1-3840"
}

variable "db_availability_type" {
  description = "ZONAL, or REGIONAL for a standby in a second zone (roughly doubles the database cost)."
  type        = string
  default     = "ZONAL"
}

variable "db_deletion_protection" {
  description = "Refuse to destroy the database instance. Keep true in production."
  type        = bool
  default     = true
}

# -- Cloud Run --------------------------------------------------------------------------------------

variable "backend_min_instances" {
  description = "1 keeps the API warm (no cold start for Meta webhooks); 0 scales to zero."
  type        = number
  default     = 1
}

variable "backend_max_instances" {
  description = "Keep at 1 until rate limits move to Redis: the limiter's counters live in process memory."
  type        = number
  default     = 1
}

variable "frontend_min_instances" {
  type    = number
  default = 0
}

variable "frontend_max_instances" {
  type    = number
  default = 3
}

# -- App settings -----------------------------------------------------------------------------------

variable "first_superuser_email" {
  description = "The platform superuser created by the migration job."
  type        = string
}

variable "emails_from" {
  description = "From address for signup, invitation and password-reset email."
  type        = string
}

variable "smtp_host" {
  description = "SMTP relay (Google Cloud has none of its own: e.g. SendGrid, Postmark, Mailgun). Empty disables email, which disables signup and invitations."
  type        = string
  default     = ""
}

variable "smtp_port" {
  type    = number
  default = 587
}

variable "smtp_user" {
  type    = string
  default = ""
}

variable "smtp_password" {
  description = "Stored in Secret Manager when smtp_host is set."
  type        = string
  default     = ""
  sensitive   = true
}

variable "users_open_registration" {
  type    = bool
  default = true
}

variable "reminders_schedule" {
  description = "Cron (Australia/Sydney) for the booking-reminder job."
  type        = string
  default     = "*/15 * * * *"
}
