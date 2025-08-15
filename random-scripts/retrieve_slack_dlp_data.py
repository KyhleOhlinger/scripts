import requests
import json

# =================================================================
# These tokens are extremely sensitive and should be treated as a password.
# It can be found in your browser's cookies and is session-specific.
# =================================================================

# Can be found in form data from a browser request to the endpoint under "Token"
SLACK_XOXC_TOKEN = 'xoxc-<TOKEN>'

# Can be found in the Browser cookie storage
SLACK_XOXD_TOKEN = 'xoxd-<TOKEN>'

# Enterprise Slack URL - e.g. companyname.enterprise.slack.com
SLACK_DOMAIN = "<DOMAIN>.slack.com"

def get_dlp_violations_list():
    """
    Retrieves DLP violation data by mimicking a browser request.
    This is an UNSUPPORTED and FRAGILE method.

    Returns:
        dict: A dictionary containing the API response, or None if an error occurs.
    """
    # The endpoint is specific and may change.
    url = f"https://{SLACK_DOMAIN}/api/admin.dlp.violations.list"
  
    # Headers from the curl command to mimic a browser
    headers = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    }

    cookies = {
        'd': SLACK_XOXD_TOKEN
    }

    data = {
        'token': SLACK_XOXC_TOKEN,
        'limit': '1',
        'violation_status': '0',
        '_x_reason': 'native-dlp-violations-table-list',
        '_x_mode': 'online',
        '_x_app_name': 'manage'
    }

    # Note: The `requests` library will automatically handle the multipart/form-data boundary
    # when you pass the data as a dictionary.

    print("Attempting to retrieve DLP violations via unsupported API call...")

    try:
        response = requests.post(url, headers=headers, cookies=cookies, data=data)
        response.raise_for_status()
        data = response.json()
        print("Successfully retrieved data!")
        return data
    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the API request: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
        print(f"Response content: {response.text}")
        return None

if __name__ == "__main__":
    
    violations = get_dlp_violations_list()
    
    if violations:
        print("\n--- Raw violations data ---")
        print(json.dumps(violations, indent=2))