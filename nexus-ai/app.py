import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("INFO: FastAPI startup event triggered.")
    from services import initialize_model
    app.state.gemini_model = initialize_model()
    yield
    print("INFO: FastAPI shutdown event triggered.")

app = FastAPI(title="Nexus Cortex AI", version="7.0.0-final", lifespan=lifespan)

from services import call_gemini

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
        return {"status": "ok", "ai_model_status": "initialization_failed"}

@app.get("/health", summary="Health Check (platform)")
def health():
    if app.state.gemini_model:
        return {"status": "ok", "ai_model_status": "loaded"}
    else:
        return {"status": "ok", "ai_model_status": "initialization_failed"}

@app.post("/v2/categorize")
def categorize_v2(req: TransactionRequest):
    result = call_gemini(app.state.gemini_model, f"Categorize: {req.model_dump()}")
    return {"result": result}

@app.post("/v2/anomalies")
def anomalies_v2(req: TransactionRequest):
    result = call_gemini(app.state.gemini_model, f"Anomalies: {req.model_dump()}")
    return {"result": result} 