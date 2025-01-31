# Requirements
## pip install google-cloud-monitoring
## pip install google-cloud-resource-manager

#Project details
from google.cloud import monitoring_v3
from google.cloud import resourcemanager_v3
from google.protobuf.duration_pb2 import Duration
import time
import more_itertools

client = monitoring_v3.MetricServiceClient()
resource_manager_client = resourcemanager_v3.ProjectsClient()
query_model = "gemini"

# Initialize an empty list to hold the table rows
table_rows = []

def get_all_projects():
    # Initialize request argument(s)
    request = resourcemanager_v3.SearchProjectsRequest(
        query = "lifecycleState:ACTIVE"
    )
    projects = resource_manager_client.search_projects(request=request)
    return projects


# Function to fetch AI Platform metrics for a given project
def get_ai_platform_metrics(project_name):
    project_name = project_name
    # Define the metric type and filter
    filter_str = 'metric.type="aiplatform.googleapis.com/publisher/online_serving/model_invocation_count" resource.type="aiplatform.googleapis.com/PublisherModel"'

    # Define aggregation settings
    aggregation = monitoring_v3.Aggregation(
        alignment_period=Duration(seconds=60),
        per_series_aligner=monitoring_v3.Aggregation.Aligner.ALIGN_RATE,
        cross_series_reducer=monitoring_v3.Aggregation.Reducer.REDUCE_SUM,
        group_by_fields=["resource.labels.model_user_id", "resource.labels.location"]
    )

    now = time.time()
    seconds = int(now)
    nanos = int((now - seconds) * 10**9)
    interval = monitoring_v3.TimeInterval(
        {
            "end_time": {"seconds": seconds, "nanos": nanos},
            "start_time": {"seconds": (seconds - 86400), "nanos": nanos},
        }
    )

    results = client.list_time_series(
        request={
            "name": project_name,
            "filter": filter_str,
            "interval": interval,
            "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.HEADERS,
            "aggregation": aggregation,
        }
    )
    return results

def project_loop(project_id):
    try:
        print(f"Querying project: {project_id}")
        project_id = f"projects/{project_id}"
        # Query the Monitoring API for each project
        results = get_ai_platform_metrics(project_id)
        
        # Process the results and create table rows
        for result in results:
            model_user_id = result.resource.labels.get('model_user_id', 'N/A')
            
            # Add a row to the table if the model_user_id matches the query_model
            if query_model in model_user_id:
                table_rows.append(f"| {project_id} | {model_user_id} |")
    except Exception as e:
        print(f"Error querying project {project_id}: {e}")

def main():
    projects = get_all_projects()
    print("[INFO] Total number of identified projects: ", more_itertools.ilen(projects))
    print("\n\n")
    for project in projects:
        project_loop(project.project_id)

    # Create the Markdown table header
    markdown_table = """
    | project_id | model_user_id |
    |------------|---------------|
    """

    # Add rows to the table
    markdown_table += "\n".join(table_rows)

    # Print the final Markdown table
    print(markdown_table)

if __name__ == "__main__":
    main()