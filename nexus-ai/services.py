import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging

logger = logging.getLogger("nexus-ai")
load_dotenv()

def initialize_model():
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        logger.critical("GOOGLE_API_KEY environment variable not found.")
        return None
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-pro-latest")
    logger.info("Google AI Gemini model initialized successfully.")
    return model

def call_gemini(model, prompt: str) -> str:
    if not model:
        logger.warning("call_gemini called but model is not available.")
        return "{\"error\": \"AI model is not available. Check server startup logs for initialization errors.\"}"
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}", exc_info=True)
        return f"{{\"error\": \"AI generation failed. Please check server logs.\"}}"

def categorize_transactions_ai(transactions: list) -> dict:
    prompt = f"You are an expert financial AI. Categorize these transactions: {transactions}"
    return call_gemini(prompt)

def detect_anomalies_ai(transactions: list) -> dict:
    prompt = f"You are an expert financial AI. Detect anomalies in these transactions: {transactions}"
    return call_gemini(prompt) 