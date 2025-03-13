import streamlit as st
import vertexai
from vertexai.generative_models import GenerativeModel
import time
import asyncio

# Configure Streamlit page
st.set_page_config(
    page_title="GCP Security Tutor",
    page_icon="🚀",
    layout="wide"
)

# Replace these with your LLM model and GCP project requirements
MODEL_TYPE = "LLM_MODEL_TYPE" # e.g. gemini-2.0-flash-001
PROJECT_ID = "GCP_PROJECT_ID"
REGION = "GCP_REGION" # e.g. us-central1
PATH = "Prompts/"
PROMPT_FILES = {
    "blue_team_research": PATH + "gcp_blue_team_bot.md",
    "red_team_research": PATH + "gcp_red_team_bot.md",
    "security_architect": PATH + "gcp_security_architecture_bot.md",
    "cheatsheet": PATH + "security_summarization_bot.md",
}

def evaluate_prompt_vertexai(model, llm_prompt):
    """
    Function to call the vertexai solution hosted in GCP 

    Parameters:
    - PROJECT_ID (str): ID for the GCP Project with VertexAI enabled
    - model_type (str): LLM Model that should be used
    - llm_prompt (str): Prompt sent to the LLM model

    Returns:
    - str: The response from the LLM model 
    """
    
    # Look into Models, Temperature, and Output Token Limit
    response = model.generate_content(llm_prompt) 
    return response.text

def modify_prompts(user_input, prompt_string):
    """
    Function to modify the prompt template with new content which will be used as a prompt to the LLM model. 
    """
    prompt_string = prompt_string + "\n\n## USER INPUT\n" + user_input
    return prompt_string

def modify_cheatsheet_prompt(results, prompt_string):
    """
    Function to modify the prompt template with new content which will be used as a prompt to the LLM model. 
    """
    prompt_string = prompt_string + "\n\n## USER INPUT\n"
    for result in results:
        prompt_string = prompt_string+ "<" + result + ">\n" + results[result] + "\n</" + result + ">\n"
    return prompt_string

def get_input(file_path):
    """
    Function to modify the prompt template with new content which will be used as a prompt to the LLM model. 

    Parameters:
    - file_path (str): The path to the template prompt file
    - new_content (str): The new content that you want to append to the file

    Returns:
    - str: The modified prompt. 
    """

    file_content = ""
    with open(file_path, 'r') as file:
        input_prompt = file.readlines()
        file_content = ''.join(input_prompt)
    return file_content


async def generate_content(model, prompt, selected_formats):
    """Generate content based on selected formats"""
    results = {}
    
    try:
        # Create status containers for each phase
        status_container = st.empty()
        progress_bar = st.progress(0)
        agent_status = st.empty()
        
        # Process each format sequentially
        for format_type in selected_formats:
            start_time = time.time()
            status_container.write(f"Starting generation of {format_type.replace('_', ' ')}...")
            
            # Show research phase
            agent_status.write("🔍 Researching: Gathering information from primary sources...")
            progress_bar.progress(10)
            time.sleep(2)  # Small delay for UI update

            if format_type != "cheatsheet":
                modified_prompt = modify_prompts(prompt, get_input(PROMPT_FILES[format_type]))
            else:
                modified_prompt = modify_cheatsheet_prompt(results, get_input(PROMPT_FILES[format_type]))
            
            agent_status.write("📊 Researching: Cross-referencing information...")
            progress_bar.progress(20)
            time.sleep(2)
            
            # Show analysis phase
            agent_status.write("🔎 Analyzing: Reviewing technical accuracy...")
            progress_bar.progress(30)
            time.sleep(2)

            # Evaluate the prompt using the VertexAI solution
            result = evaluate_prompt_vertexai(model, modified_prompt)
            
            agent_status.write("🧪 Analyzing: Enhancing technical details...")
            progress_bar.progress(40)
            time.sleep(2)
            
            # Show writing phase
            agent_status.write("✍️ Generating: Crafting content...")
            progress_bar.progress(60)
            time.sleep(2)
            
             # Show SEO phase
            agent_status.write("🎯 Optimizing: Optimizing content...")
            progress_bar.progress(80)
            # Store the result
            results[format_type] = result
            
            # Show final review phase
            agent_status.write("📝 Reviewing: Performing final review...")
            progress_bar.progress(90)
            
            # Ensure minimum processing time (30 seconds)
            elapsed_time = time.time() - start_time
            if elapsed_time < 18:
                agent_status.write("⚡ All Agents: Gathering additional technical details...")
                time.sleep(18 - elapsed_time)
            
            # Store the result
            if isinstance(result, str):
                results[format_type] = result
            else:
                results[format_type] = str(result)
            
            # Show completion
            progress_bar.progress(100)
            agent_status.write("✅ Generation complete!")
            status_container.write(f"Completed {format_type.replace('_', ' ')}!")
            
            # Reset progress for next format
            if format_type != selected_formats[-1]:
                time.sleep(2)
                progress_bar.progress(0)
            
    except Exception as e:
        st.error(f"Error during content generation: {str(e)}")
        for format_type in selected_formats:
            results[format_type] = f"Error generating content: {str(e)}"

    return results


async def main(model):
    st.title("🚀 GCP Security Tutor 🚀")
    st.write("Generate content using AI agents to help you learn about GCP Security!")

    # User input section
    prompt = st.text_area(
        "Enter your research topic (e.g., GCP Service Account Delegation):",
        height=75,
        placeholder="Example: Research GCP Service Account Delegation"
    )

    # Output format selection
    st.subheader("Select Output Formats:")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        security_architect = st.checkbox("Security Architect Overview", help="Overview of the topic from a security architect perspective")
    
    with col2:
        red_team_research = st.checkbox("Red Team Research", help="Detailed red team analysis into the topic including attack vectors, exploitation methods, and mitigation strategies")

    with col3:
        blue_team_research = st.checkbox("Blue Team Research", help="Detailed blue team analysis into the topic including detection methods, mitigation strategies, and best practices")

    # Collect selected formats
    selected_formats = []
    if red_team_research: selected_formats.append("red_team_research")
    if blue_team_research: selected_formats.append("blue_team_research")
    if security_architect: selected_formats.append("security_architect")

    if st.button("Generate Content", type="primary"):
        if not prompt:
            st.error("Please enter a research topic")
            return
        
        if not selected_formats:
            st.error("Please select at least one output format")
            return
        
        if len(selected_formats) == 3: 
            selected_formats.append("cheatsheet")

        with st.spinner("AI agents are analyzing and generating content..."):
            try:
                results = await generate_content(model, prompt, selected_formats)

                # Display results in tabs
                st.success("Content generation complete!")
                tabs = st.tabs([format_type.replace('_', ' ').title() for format_type in selected_formats])
                
                for tab, format_type in zip(tabs, selected_formats):
                    with tab:
                        st.markdown(results[format_type])
                        st.download_button(
                            f"Download {format_type.replace('_', ' ').title()}",
                            results[format_type],
                            file_name=f"{format_type}.txt",
                            mime="text/plain"
                        )

            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                

if __name__ == "__main__":
    # Send the prompt to the LLM model and retrieve the data
    try:    
         # Requires ADC https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment
        vertexai.init(project=PROJECT_ID, location=REGION)
        model = GenerativeModel(MODEL_TYPE)
        asyncio.run(main(model))
    except ValueError as e:
        print(f"Error: {e}")