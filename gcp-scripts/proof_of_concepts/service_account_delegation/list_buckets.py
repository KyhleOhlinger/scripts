import google.auth
from google.cloud import storage

# Replace with your values
DELEGATE_SERVICE_ACCOUNT_EMAIL = "service-account-b@your-gcp-project-id.iam.gserviceaccount.com"  # Delegate
BUCKET_NAME = "your-target-bucket"  # Target Bucket

def list_bucket_contents_with_delegation():
    """Lists the contents of a Google Cloud Storage bucket using service account delegation."""

    # Authenticate as the delegator service account using default credentials
    delegator_credentials, project = google.auth.default()

    # Delegate credentials to the delegate service account
    delegated_credentials = delegator_credentials.with_subject(DELEGATE_SERVICE_ACCOUNT_EMAIL)

    # Create a storage client using the delegated credentials
    storage_client = storage.Client(credentials=delegated_credentials, project=project)

    # Get the bucket
    bucket = storage_client.get_bucket(BUCKET_NAME)

    # List the contents of the bucket
    blobs = bucket.list_blobs()

    print(f"Contents of bucket {BUCKET_NAME}:")
    for blob in blobs:
        print(blob.name)

if __name__ == "__main__":
    list_bucket_contents_with_delegation()