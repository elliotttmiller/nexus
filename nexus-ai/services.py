import os
from google.cloud import aiplatform
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value

# --- Configuration ---
GOOGLE_PROJECT_ID = os.environ.get("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.environ.get("GOOGLE_LOCATION") # e.g., "us-central1"
VERTEX_AI_ENDPOINT_ID = os.environ.get("VERTEX_AI_ENDPOINT_ID") # For credit score prediction

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

# Example enrichment and text generation using Vertex AI (to be used in other modules)
def enrich_transaction_with_vertex_ai(merchant_name: str, location: str) -> dict:
    # This is a placeholder for a Vertex AI endpoint that does enrichment
    # You should deploy a custom model or use a prebuilt one for enrichment
    instance = {"merchant_name": merchant_name, "location": location}
    return predict_with_vertex_ai(VERTEX_AI_ENDPOINT_ID, instance)

def generate_text_with_vertex_ai(prompt: str, max_tokens: int = 150) -> str:
    # This is a placeholder for a Vertex AI text generation endpoint
    instance = {"prompt": prompt, "max_tokens": max_tokens}
    result = predict_with_vertex_ai(VERTEX_AI_ENDPOINT_ID, instance)
    return result.get("generated_text", "AI-generated text is unavailable.") 