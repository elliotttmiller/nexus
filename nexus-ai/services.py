import os
import json
import tempfile
import vertexai
from google.oauth2 import service_account
from vertexai.generative_models import GenerativeModel
from typing import Dict, Any
import logging

logger = logging.getLogger("nexus-ai")

def initialize_model():
    """Called once at startup by app.py to create the model object."""
    try:
        return GenerativeModel("gemini-1.0-pro-002")
    except Exception as e:
        logger.critical(f"services.py - Failed to create Gemini model object: {e}")
        return None

def call_gemini_vertex(model: GenerativeModel, prompt: str) -> str:
    """
    Generates content using the provided, pre-initialized Gemini model.
    """
    if not model:
        logger.warning("call_gemini_vertex called but model is not available.")
        return "{\"error\": \"AI model is not available. Check server startup logs for initialization errors.\"}"
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}", exc_info=True)
        return f"{{\"error\": \"AI generation failed. Please check server logs.\"}}"

def categorize_transactions_ai(transactions: list) -> dict:
    prompt = f"You are an expert financial AI. Categorize these transactions: {transactions}"
    return call_gemini_vertex(prompt)

def detect_anomalies_ai(transactions: list) -> dict:
    prompt = f"You are an expert financial AI. Detect anomalies in these transactions: {transactions}"
    return call_gemini_vertex(prompt) 