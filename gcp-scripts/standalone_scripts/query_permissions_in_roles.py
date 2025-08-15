import google.auth
import googleapiclient.discovery

def list_roles_with_permission(project_id, permission_to_check):
    """Lists all roles in a project that contain a specific permission."""
    try:
        # Authenticate using Google Application Default Credentials
        credentials, project_id = google.auth.default()

        # Create an IAM client
        service = googleapiclient.discovery.build('iam', 'v1', credentials=credentials)

        # Initialize a list to store roles with the specified permission
        roles_with_permission = []

        # Construct the request to list roles
        request = service.roles().list(parent=f"projects/{project_id}")  # Adjust page size as needed

        while request is not None:
            # Execute the request
            response = request.execute()

            # Iterate through the roles in the response
            if 'roles' in response:
                for role in response['roles']:
                    # Check if the role has the specified permission
                    permissions = service.projects().roles().get(name=role['name'])
                    perm_response = permissions.execute()
                    if 'includedPermissions' in perm_response and permission_to_check in perm_response['includedPermissions']:
                        roles_with_permission.append(role['name'])  # Append the full role name

            # Get the next page, if any
            request = service.roles().list_next(request, response)

        # Print the results
        if roles_with_permission:
            print(f"Roles with '{permission_to_check}' permission:")
            for role_name in roles_with_permission:
                print(role_name)
        else:
            print(f"No roles found with '{permission_to_check}' permission.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    PROJECT_ID = "PROJECT_ID"  # Replace with your GCP project ID
    #PERMISSION_TO_CHECK = "iam.serviceAccounts.getAccessToken"
    PERMISSION_TO_CHECK = "iam.serviceAccounts.getOpenIdToken"
    list_roles_with_permission(PROJECT_ID, PERMISSION_TO_CHECK)