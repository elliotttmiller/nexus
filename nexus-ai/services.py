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
    using a regular expression. If <answer> tags are missing, attempts to extract the first JSON object.
    """
    if not model:
        logger.warning("call_gemini called but model is not available.")
        return "{\"error\": \"AI model is not available. Check server startup logs.\"}"
    try:
        full_response = model.generate_content(prompt).text
        logger.info(f"Raw AI response: {full_response}")
        # Use a regular expression for robust parsing.
        match = re.search(r'<answer>(.*?)</answer>', full_response, re.DOTALL | re.IGNORECASE)
        if match:
            answer_text = match.group(1).strip()
            return answer_text
        else:
            logger.error(f"Could not find <answer> tags in AI response. Full response: {full_response}")
            # Fallback: try to extract the first JSON object from the response
            json_match = re.search(r'\{[\s\S]*?\}', full_response)
            if json_match:
                json_str = json_match.group(0)
                try:
                    # Validate it's valid JSON
                    json.loads(json_str)
                    return json_str
                except Exception:
                    pass
            return "{\"error\": \"AI returned a malformed response (missing tags and no valid JSON).\"}"
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
    IMPORTANT: Your answer will be rejected if it is not inside <answer>...</answer> tags. Do NOT use markdown, do NOT use triple backticks, ONLY output the JSON inside <answer>...</answer> tags, with nothing else before or after.
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
    IMPORTANT: Your answer will be rejected if it is not inside <answer>...</answer> tags. Do NOT use markdown, do NOT use triple backticks, ONLY output the JSON inside <answer>...</answer> tags, with nothing else before or after.
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
    IMPORTANT: Your answer will be rejected if it is not inside <answer>...</answer> tags. Do NOT use markdown, do NOT use triple backticks, ONLY output the JSON inside <answer>...</answer> tags, with nothing else before or after.
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

def interestkiller_ai(model, accounts: list, payment_amount: float) -> str:
    prompt = f"""
    You are an expert financial AI. Given the following credit cards (with balances, APRs, and credit limits) and a payment amount, do the following:
    1. Compute the optimal split of the payment to MINIMIZE INTEREST. For this split, calculate and explain how much interest the user will save this month and why this split is optimal.
    2. Compute the optimal split of the payment to MAXIMIZE CREDIT SCORE (minimize utilization). For this split, calculate and explain how much the user's utilization will drop (before and after, as a percentage) and why this helps their score.
    3. For each, return a user-friendly, actionable explanation (not just numbers).
    IMPORTANT: Your answer will be rejected if it is not inside <answer>...</answer> tags. Do NOT use markdown, do NOT use triple backticks, ONLY output the JSON inside <answer>...</answer> tags, with nothing else before or after.
    <thinking>
    - Analyze the accounts, balances, APRs, and credit limits.
    - Use financial best practices for both goals.
    </thinking>
    <answer>
    {{
      "minimize_interest": {{
        "split": [{{"card_id": "...", "amount": ...}}],
        "explanation": "..."
      }},
      "maximize_score": {{
        "split": [{{"card_id": "...", "amount": ...}}],
        "explanation": "..."
      }}
    }}
    </answer>
    Accounts: {json.dumps(accounts)}
    Payment amount: {payment_amount}
    """
    return call_gemini(model, prompt) 