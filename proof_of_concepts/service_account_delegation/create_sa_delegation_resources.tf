# Configure the Google Cloud Provider
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = "your-gcp-project-id"
  region  = "us-central1"
}

# Create Service Account A (Delegator)
resource "google_service_account" "service_account_a" {
  account_id   = "service-account-a"
  display_name = "Service Account A (Delegator)"
}

# Create Service Account B (Delegate)
resource "google_service_account" "service_account_b" {
  account_id   = "service-account-b"
  display_name = "Service Account B (Delegate)"
}

# Create Storage Bucket "Target_Bucket"
resource "google_storage_bucket" "target_bucket" {
  name          = "your-target-bucket" # Replace with a globally unique bucket name
  location      = "US"
  force_destroy = true  # Enable bucket deletion even if it contains objects (use with caution)
}

# Grant Service Account B list permissions over "Target_Bucket"
resource "google_storage_bucket_iam_binding" "service_account_b_bucket_access" {
  bucket = google_storage_bucket.target_bucket.name
  role   = "roles/storage.objectViewer"  # Allows listing objects in the bucket
  members = [
    "serviceAccount:${google_service_account.service_account_b.email}"
  ]
}

# Grant Service Account A delegation permissions over the Entire Project
resource "google_project_iam_member" "service_account_a_delegation" {
  project = "your-gcp-project-id"
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.service_account_a.email}"
}

# Grant Service Account A delegation permissions over Service Account B resource "google_service_account_iam_member" "service_account_a_delegation" { service_account_id = google_service_account.service_account_b.name role = "roles/iam.serviceAccountTokenCreator" member = "serviceAccount:${google_service_account.service_account_a.email}" }


# Optional: Output the Service Account emails for use in the Python script
output "service_account_a_email" {
  value = google_service_account.service_account_a.email
}

output "service_account_b_email" {
  value = google_service_account.service_account_b.email
}

output "target_bucket_name" {
  value = google_storage_bucket.target_bucket.name
}