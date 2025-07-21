# FINAL, CORRECTED: list_models.py

import os
import json
import vertexai
from dotenv import load_dotenv
from google.oauth2 import service_account
from google.cloud import aiplatform # Import the correct module

print("--- Starting Google Cloud Model Discovery Script ---")

# --- 1. Load Environment & Credentials (This part is working perfectly) ---
load_dotenv(dotenv_path='.env.debug' if os.path.exists('.env.debug') else '.env')
print("INFO: .env file loaded.")

credentials = None
project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
gcp_creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

if gcp_creds_path and os.path.exists(gcp_creds_path):
    print(f"INFO: Found credentials path: {gcp_creds_path}")
    try:
        credentials = service_account.Credentials.from_service_account_file(gcp_creds_path)
    except Exception as e:
        print(f"CRITICAL: Failed to load credentials from file: {e}")
        exit()
else:
    print("FATAL: GOOGLE_APPLICATION_CREDENTIALS path not found in .env. Exiting.")
    exit()

# --- 2. Initialize Vertex AI (This part is working perfectly) ---
if project_id and credentials:
    try:
        vertexai.init(project=project_id, location="us-central1", credentials=credentials)
        print("INFO: Vertex AI initialized successfully.")
    except Exception as e:
        print(f"CRITICAL: Failed to initialize Vertex AI: {e}")
        exit()
else:
    print("FATAL: Could not initialize Vertex AI. Check project ID and credentials.")
    exit()

# --- 3. List Available Models (THE DEFINITIVELY CORRECT METHOD) ---
print("\n--- Querying for available Gemini models in your project ---")
try:
    # THE FIX IS HERE: Use the aiplatform.Model.list() method.
    models = aiplatform.Model.list()
    
    found_models = []
    # The new model objects have slightly different properties. We need to adapt.
    # The full model name is in `model.resource_name`.
    for model in models:
        # We look for the model resource name and check its supported methods via its display name.
        if 'gemini' in model.display_name:
             found_models.append(model.resource_name)


    if found_models:
        print("\n--- SUCCESS: Found the following usable Gemini models for your project ---")
        # Let's filter for just the ones we care about
        gemini_models = [m for m in found_models if 'publishers/google/models/gemini' in m]
        for name in gemini_models:
            print(f"  - {name}")

        print("\nACTION: Copy the most appropriate model IDENTIFIER from the list above.")
        print("Example: 'gemini-1.5-flash-001' or 'gemini-1.0-pro'")
        print("and paste it into the GenerativeModel() call in your services.py file.")
    else:
        print("\nWARNING: No usable Gemini models were found for your project.")
        print("This may indicate a permissions or project setup issue.")

except Exception as e:
    print(f"\nERROR: An error occurred while listing models: {e}")