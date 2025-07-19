import os
from google.cloud import aiplatform
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value
import requests

# --- Configuration ---
GOOGLE_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")
GOOGLE_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION") # e.g., "us-central1"
VERTEX_AI_ENDPOINT_ID = os.environ.get("VERTEX_AI_ENDPOINT_ID") # For credit score prediction

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")  # Set this in Railway env vars

# Debug print for environment values
print("GOOGLE_CLOUD_PROJECT:", GOOGLE_PROJECT_ID)
print("GOOGLE_CLOUD_LOCATION:", GOOGLE_LOCATION)
print("VERTEX_AI_ENDPOINT_ID:", VERTEX_AI_ENDPOINT_ID)

aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)

def predict_with_vertex_ai(endpoint_id: str, instance_dict: dict) -> dict:
    endpoint = aiplatform.Endpoint(endpoint_name=f"projects/{GOOGLE_PROJECT_ID}/locations/{GOOGLE_LOCATION}/endpoints/{endpoint_id}")
    instance_value = json_format.ParseDict(instance_dict, Value())
    try:
        response = endpoint.predict(instances=[instance_value])
        return dict(response.predictions[0])
    except Exception as e:
        print(f"Vertex AI Prediction Error: {e}")
        return {}

def generate_text_with_gemini(prompt: str) -> str:
    url = "https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-1.0-pro-002:streamGenerateContent"
    headers = {
        "Content-Type": "application/json; charset=utf-8"
    }
    data = {
        "contents": {
            "role": "user",
            "parts": {
                "text": prompt
            }
        }
    }
    params = {"key": GEMINI_API_KEY}
    response = requests.post(url, headers=headers, params=params, json=data)
    if response.ok:
        # Gemini API returns a streaming response; parse the first candidate
        result = response.json()
        # Adjust parsing as needed based on actual API response structure
        try:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            return str(result)
    else:
        return f"Error: {response.status_code} {response.text}"

# Example enrichment and text generation using Vertex AI (to be used in other modules)
def enrich_transaction_with_vertex_ai(merchant_name: str, location: str) -> dict:
    # This is a placeholder for a Vertex AI endpoint that does enrichment
    # You should deploy a custom model or use a prebuilt one for enrichment
    instance = {"merchant_name": merchant_name, "location": location}
    return predict_with_vertex_ai(VERTEX_AI_ENDPOINT_ID, instance) 