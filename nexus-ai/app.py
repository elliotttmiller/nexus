import os
import json
import vertexai
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from google.oauth2 import service_account

# --- 1. Load Environment ---
load_dotenv()

# --- 2. Lifespan Event Handler ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("INFO: FastAPI startup event triggered.")
    credentials = None
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GOOGLE_PROJECT_ID")
    # THE FIX: Force region to us-central1 for Gemini model availability
    location = "us-central1"
    print(f"INFO: Forcing Vertex AI initialization in region: {location}")
    gcp_creds_json_str = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if gcp_creds_json_str:
        print("INFO: Found GOOGLE_APPLICATION_CREDENTIALS_JSON.")
        try:
            credentials_info = json.loads(gcp_creds_json_str)
            credentials = service_account.Credentials.from_service_account_info(credentials_info)
        except Exception as e:
            print(f"CRITICAL: Failed to parse credentials from JSON string: {e}")
    else:
        gcp_creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if gcp_creds_path and os.path.exists(gcp_creds_path):
            print(f"INFO: Found GOOGLE_APPLICATION_CREDENTIALS path: {gcp_creds_path}")
            try:
                credentials = service_account.Credentials.from_service_account_file(gcp_creds_path)
            except Exception as e:
                print(f"CRITICAL: Failed to load credentials from file path: {e}")
    if project_id and credentials:
        try:
            vertexai.init(project=project_id, location=location, credentials=credentials)
            from services import initialize_model
            app.state.gemini_model = initialize_model()
            print(f"INFO: Vertex AI and Gemini model initialized successfully in region {location} and attached to app state.")
        except Exception as e:
            print(f"CRITICAL: Failed to initialize Vertex AI during startup: {e}")
            app.state.gemini_model = None
    else:
        print("WARNING: Vertex AI could not be initialized. AI features will be disabled.")
        app.state.gemini_model = None
    yield
    print("INFO: FastAPI shutdown event triggered.")

app = FastAPI(title="Nexus Cortex AI", version="6.0.0-lifespan", lifespan=lifespan)

from services import call_gemini_vertex

class Transaction(BaseModel):
    id: str
    amount: float
    merchant: str
    date: str

class TransactionRequest(BaseModel):
    transactions: List[Transaction]

@app.get("/", summary="Health Check")
def root():
    if app.state.gemini_model:
        return {"status": "ok", "ai_model_status": "loaded"}
    else:
        return {"status": "ok", "ai_model_status": "not_loaded"}

@app.get("/health", summary="Health Check (platform)")
def health():
    if app.state.gemini_model:
        return {"status": "ok", "ai_model_status": "loaded"}
    else:
        return {"status": "ok", "ai_model_status": "not_loaded"}

@app.post("/v2/categorize")
def categorize_v2(req: TransactionRequest):
    result = call_gemini_vertex(app.state.gemini_model, f"Categorize: {req.model_dump()}")
    return {"result": result}

@app.post("/v2/anomalies")
def anomalies_v2(req: TransactionRequest):
    result = call_gemini_vertex(app.state.gemini_model, f"Anomalies: {req.model_dump()}")
    return {"result": result} 