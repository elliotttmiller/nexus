import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
import json
import re

logger = logging.getLogger("nexus-ai")
load_dotenv()

def initialize_model():
    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.critical("services.py - GOOGLE_API_KEY not found.")
            return None
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-pro-latest")
        logger.info("services.py - Google AI Gemini model initialized successfully.")
        return model
    except Exception as e:
        logger.critical(f"services.py - Failed to initialize Gemini model: {e}", exc_info=True)
        return None

def call_gemini(model: genai.GenerativeModel, prompt: str) -> str:
    """
    Generates content and robustly extracts the final answer from the <answer> tag
    using a regular expression.
    """
    if not model:
        logger.warning("call_gemini called but model is not available.")
        return "{\"error\": \"AI model is not available. Check server startup logs.\"}"
    try:
        full_response = model.generate_content(prompt).text
        logger.info(f"Raw AI response: {full_response}")
        # Use a regular expression for robust parsing.
        match = re.search(r'<answer>(.*?)</answer>', full_response, re.DOTALL)
        if match:
            answer_text = match.group(1).strip()
            return answer_text
        else:
            logger.error(f"Could not find <answer> tags in AI response. Full response: {full_response}")
            return "{\"error\": \"AI returned a malformed response (missing tags).\"}"
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}", exc_info=True)
        return '{"error": "AI generation failed. Please check server logs."}'

def categorize_transactions_ai(model, transactions: list) -> str:
    prompt = f"""
    You are an expert financial AI. Your task is to categorize a list of transactions.
    1. In a <thinking> block, reason about the category for each merchant.
    2. In an <answer> block, provide ONLY a valid JSON array.
    Transactions: {json.dumps(transactions)}
    """
    return call_gemini(model, prompt)

def detect_anomalies_ai(model, transactions: list) -> str:
    prompt = f"""
    You are an expert fraud detection AI. Your task is to find anomalies in a list of transactions.
    1. In a <thinking> block, reason about anomalies.
    2. In an <answer> block, provide ONLY a valid JSON array.
    Transactions: {json.dumps(transactions)}
    """
    return call_gemini(model, prompt)

def spending_insights_ai(model, transactions: list) -> str:
    prompt = f"""
    You are a financial AI assistant. Analyze the user's recent transactions and provide:
    1. A summary of total spending by category.
    2. The top 2 categories with the largest increase compared to the previous period.
    3. One actionable insight to help the user save money.
    <thinking>
    - Review the transaction list, group by category, compare to previous period if possible.
    </thinking>
    <answer>
    {{
      "category_totals": {{}},
      "top_increases": [],
      "insight": ""
    }}
    </answer>
    Transactions: {json.dumps(transactions)}
    """
    return call_gemini(model, prompt)

def budget_health_ai(model, user_budget: dict, transactions: list) -> str:
    prompt = f"""
    You are a financial AI. Analyze the user's budget and recent transactions.
    1. Provide a health score (0-100) based on how well they're sticking to their budget.
    2. List any categories where they're overspending.
    3. Give one actionable tip to improve their budget health.
    <thinking>
    - Compare actual spending to budgeted amounts.
    </thinking>
    <answer>
    {{
      "health_score": 0,
      "overspending_categories": [],
      "tip": ""
    }}
    </answer>
    Budget: {json.dumps(user_budget)}
    Transactions: {json.dumps(transactions)}
    """
    return call_gemini(model, prompt)

def cash_flow_prediction_ai(model, accounts: list, upcoming_bills: list, transactions: list) -> str:
    prompt = f"""
    You are a financial AI. Predict if the user will have enough cash to cover upcoming bills.
    1. Estimate end-of-month cash balance.
    2. List any bills that may not be covered.
    3. Suggest one action to avoid a shortfall.
    <thinking>
    - Analyze account balances, recurring bills, and recent spending.
    </thinking>
    <answer>
    {{
      "predicted_balance": 0.0,
      "uncovered_bills": [],
      "suggestion": ""
    }}
    </answer>
    Accounts: {json.dumps(accounts)}
    Upcoming bills: {json.dumps(upcoming_bills)}
    Transactions: {json.dumps(transactions)}
    """
    return call_gemini(model, prompt) 