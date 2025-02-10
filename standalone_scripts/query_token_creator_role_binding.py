import google.auth
import google.cloud.resourcemanager 
import googleapiclient.discovery

def list_service_accounts_with_token_creator(project_id):
    """Lists service accounts in a project with the Service Account Token Creator role."""

    try:
        # Authenticate using Google Application Default Credentials
        credentials, project = google.auth.default()

        # Create a Resource Manager client
        service = googleapiclient.discovery.build('cloudresourcemanager', 'v1', credentials=credentials)

        # Initialize a list to store service accounts with the Token Creator role
        sa_with_token_creator = []

        # List projects with the getIamPolicy() to determine SA with Token Creator Role
        request = service.projects().getIamPolicy(resource=project_id, body={
            "options": {
                "requestedPolicyVersion": 3
            }})
        response = request.execute()

        if 'bindings' in response:
            for binding in response['bindings']:
                if binding['role'] == 'roles/iam.serviceAccountTokenCreator':
                    for member in binding['members']:
                        if member.startswith('serviceAccount:'):
                            sa_email = member.split(':')[1]
                            sa_with_token_creator.append(sa_email)

        if sa_with_token_creator:
            print("Service Accounts with Service Account Token Creator Role:")
            for sa in sa_with_token_creator:
                print(sa)
        else:
            print("No Service Accounts found with Service Account Token Creator Role.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    PROJECT_ID = "PROJECT_ID"   # Replace with your GCP project ID
    list_service_accounts_with_token_creator(PROJECT_ID)