import os
import json
from dotenv import load_dotenv
load_dotenv()
import os
print("GOOGLE_APPLICATION_CREDENTIALS:", os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
print("GOOGLE_PROJECT_ID:", os.environ.get("GOOGLE_PROJECT_ID"))
print("GOOGLE_LOCATION:", os.environ.get("GOOGLE_LOCATION"))
print("Service account file exists:", os.path.exists(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")))

from google.cloud import aiplatform
from vertexai.preview.generative_models import GenerativeModel, Part

GOOGLE_PROJECT_ID = os.environ.get("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.environ.get("GOOGLE_LOCATION", "us-central1")

# Initialize Vertex AI and Gemini model
if GOOGLE_PROJECT_ID and os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
    aiplatform.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)
    gemini_model = GenerativeModel("gemini-1.0-pro")
else:
    gemini_model = None

def call_gemini_vertex(prompt: str) -> str:
    if not gemini_model:
        raise Exception("Gemini model not initialized. Check your service account and environment variables.")
    response = gemini_model.generate_content(prompt)
    return response.text

def categorize_transactions_ai(transactions):
    prompt = (
        "You are an expert financial AI. Categorize each transaction in the following JSON array. "
        "For each transaction, add a 'category' field (e.g., food, travel, shopping, bills, etc.). "
        "Return a JSON array with the original fields plus the new 'category' field.\n"
        f"Transactions: {json.dumps(transactions)}"
    )
    ai_response = call_gemini_vertex(prompt)
    try:
        return json.loads(ai_response)
    except Exception:
        return {"error": "AI response could not be parsed", "raw": ai_response}

def detect_anomalies_ai(transactions):
    prompt = (
        "You are an expert financial AI. Analyze the following transactions for anomalies. "
        "For each transaction, add an 'anomaly' field: null if normal, or a string describing the anomaly (e.g., 'large_transaction', 'rare_merchant', 'suspicious_pattern'). "
        "Return a JSON array with the original fields plus the new 'anomaly' field.\n"
        f"Transactions: {json.dumps(transactions)}"
    )
    ai_response = call_gemini_vertex(prompt)
    try:
        return json.loads(ai_response)
    except Exception:
        return {"error": "AI response could not be parsed", "raw": ai_response} 