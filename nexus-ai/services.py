import os
import vertexai
from vertexai.generative_models import GenerativeModel

GOOGLE_PROJECT_ID = os.environ.get("GOOGLE_PROJECT_ID")
GOOGLE_LOCATION = os.environ.get("GOOGLE_LOCATION", "us-central1")

gemini_model = None
if GOOGLE_PROJECT_ID and os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
    try:
        vertexai.init(project=GOOGLE_PROJECT_ID, location=GOOGLE_LOCATION)
        gemini_model = GenerativeModel("gemini-1.5-flash-001")
        print(f"INFO: services.py - Vertex AI initialized successfully.")
    except Exception as e:
        print(f"CRITICAL: services.py - Failed to initialize Vertex AI: {e}")
else:
    print("WARNING: services.py - Vertex AI not initialized. Check GCP env vars.")

def call_gemini_vertex(prompt: str) -> str:
    if not gemini_model:
        return "<answer>{\"error\": \"AI model is not initialized. Check server logs.\"}</answer>"
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"ERROR: Gemini content generation via Vertex AI failed: {e}")
        return f"<answer>{{\"error\": \"AI generation failed. Details: {e}\"}}</answer>"

def categorize_transactions_ai(transactions: list) -> dict:
    prompt = f"You are an expert financial AI. Categorize these transactions: {transactions}"
    return call_gemini_vertex(prompt)

def detect_anomalies_ai(transactions: list) -> dict:
    prompt = f"You are an expert financial AI. Detect anomalies in these transactions: {transactions}"
    return call_gemini_vertex(prompt) 