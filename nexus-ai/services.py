# FINAL, ENHANCED: services.py

import os
from dotenv import load_dotenv
import google.generativeai as genai
import logging
import json
import re
import time
import random

logger = logging.getLogger("nexus-ai")
load_dotenv()

def initialize_model():
    """Initializes the model with a system instruction for reliability."""
    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.critical("services.py - GOOGLE_API_KEY not found.")
            return None
        genai.configure(api_key=api_key)
        # --- NEW: SYSTEM INSTRUCTION ---
        system_instruction = (
            "You are a helpful assistant designed to output JSON. "
            "You will receive instructions and data, and you must respond ONLY with a single, perfectly valid JSON object, "
            "without any Markdown fences, explanations, or other text."
        )
        model = genai.GenerativeModel(
            "gemini-1.5-flash-latest",
            system_instruction=system_instruction
        )
        logger.info("services.py - Google AI Gemini model initialized successfully (flash model with system instruction).")
        return model
    except Exception as e:
        logger.critical(f"services.py - Failed to initialize Gemini model: {e}", exc_info=True)
        return None

# --- NEW: JSON Mode Gemini Call ---
def call_gemini(model: 'genai.GenerativeModel', prompt: str, max_retries: int = 3) -> str:
    """
    Generates content using the model's built-in JSON mode for maximum reliability.
    The complex parser is no longer needed.
    """
    import json
    if not model:
        logger.warning("call_gemini called but model is not available.")
        return "{\"error\": \"AI model is not available. Check server startup logs.\"}"
    from google.generativeai.types import GenerationConfig
    for attempt in range(max_retries + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config=GenerationConfig(response_mime_type="application/json")
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}", exc_info=True)
            return '{"error": "AI generation failed. Please check server logs."}'
    return '{"error": "Unexpected error in retry logic."}'

# --- UNIFIED AI LOGIC CORE ---

def spending_insights_ai(model, transactions: list, previous_transactions: list = None) -> str:
    """Analyzes spending patterns with enhanced contextual awareness."""
    prompt = f"""
    You are Nexus AI, a sharp and insightful financial analyst. Your task is to analyze a user's transaction data and provide clear, actionable insights.

    **Instructions:**
    1.  **<thinking>** In a thinking block, perform your analysis.
        - Calculate the total spending for each category in the current period.
        - If previous_transactions are available, compare the totals to identify the top 2 categories with the largest spending increase.
        - Based on the data, formulate a single, non-generic, actionable insight to help the user. For example, instead of "spend less," suggest "Your 'Takeout' spending is up 50%. Could you try cooking at home one more night a week?"
    2.  **</thinking>**
    3.  **<answer>** In an answer block, provide ONLY a valid JSON object with the following structure. Do not add any other text.
        ```json
        {{
          "category_totals": {{ "CategoryName": "TotalAmount" }},
          "top_increases": [ {{ "category": "CategoryName", "increase_percentage": "Percentage" }} ],
          "insight": "Your single, actionable insight here."
        }}
        ```
    **</answer>**

    **EXAMPLE:**
    <thinking>
    - Calculated total spending for each category.
    - Compared to previous period, 'Dining Out' and 'Groceries' increased the most.
    - Actionable insight: 'Dining Out' is up 40%. Suggest cooking at home more often.
    </thinking>
    <answer>
    {{
      "category_totals": {{"Dining Out": 320.50, "Groceries": 210.00, "Utilities": 90.00}},
      "top_increases": [{{"category": "Dining Out", "increase_percentage": "40%"}}, {{"category": "Groceries", "increase_percentage": "20%"}}],
      "insight": "Your 'Dining Out' spending is up 40% from last month. Try cooking at home one more night a week to save money."
    }}
    </answer>

    **DATA:**
    - Current Transactions: {json.dumps(transactions)}
    - Previous Period Transactions: {json.dumps(previous_transactions) if previous_transactions else "null"}
    """
    return call_gemini(model, prompt)


def budget_health_ai(model, user_budget: dict, transactions: list) -> str:
    """Provides a sophisticated analysis of budget adherence."""
    prompt = f"""
    You are Nexus AI, an encouraging and helpful budget coach. Your task is to assess a user's budget health.

    **Instructions:**
    1.  **<thinking>** In a thinking block, perform your analysis.
        - For each category in the budget, sum the corresponding transactions.
        - Calculate a `health_score` (0-100) based on overall adherence. A score of 100 means on or under budget in all categories. Penalize heavily for overspending in major categories.
        - Identify all categories where spending has exceeded the budgeted amount.
        - Formulate a single, positive, and actionable tip. Instead of "You overspent," try "You're doing great in 'Groceries'! Let's see if we can apply that same focus to the 'Shopping' category next week."
    2.  **</thinking>**
    3.  **<answer>** In an answer block, provide ONLY a valid JSON object with the following structure. Do not add any other text.
        ```json
        {{
          "health_score": 0,
          "overspending_categories": ["CategoryName"],
          "tip": "Your single, encouraging, and actionable tip here."
        }}
        ```
    **</answer>**

    **EXAMPLE:**
    <thinking>
    - Summed spending for each category.
    - 'Shopping' and 'Dining Out' are over budget.
    - Health score is 72. Tip: Focus on reducing 'Shopping' next week.
    </thinking>
    <answer>
    {{
      "health_score": 72,
      "overspending_categories": ["Shopping", "Dining Out"],
      "tip": "You're doing great in 'Groceries'! Let's see if we can apply that same focus to the 'Shopping' category next week."
    }}
    </answer>

    **DATA:**
    - User's Budget: {json.dumps(user_budget)}
    - Current Transactions: {json.dumps(transactions)}
    """
    return call_gemini(model, prompt)


def cash_flow_prediction_ai(model, accounts: list, upcoming_bills: list, recent_spending_velocity: float) -> str:
    """Predicts future cash flow with greater accuracy."""
    prompt = f"""
    You are Nexus AI, a forward-thinking financial forecaster. Your task is to predict the user's short-term cash flow.

    **Instructions:**
    1.  **<thinking>** In a thinking block, perform your analysis.
        - Sum the balances of all 'depository' accounts to get the current cash.
        - Estimate future spending until the end of the month based on the `recent_spending_velocity` (a daily average).
        - Subtract the estimated spending and the total of `upcoming_bills` from the current cash to get a `predicted_balance`.
        - Identify which specific bills, if any, will not be covered if the predicted balance is negative.
        - Formulate a single, high-impact suggestion. For example, "Your Netflix and Spotify bills are due before your next paycheck. Consider pausing one to ensure you cover your rent."
    2.  **</thinking>**
    3.  **<answer>** In an answer block, provide ONLY a valid JSON object with the following structure. Do not add any other text.
        ```json
        {{
          "predicted_balance": 0.0,
          "uncovered_bills": [ {{ "bill_name": "BillName", "amount": "Amount" }} ],
          "suggestion": "Your single, high-impact suggestion here."
        }}
        ```
    **</answer>**

    **EXAMPLE:**
    <thinking>
    - Summed depository account balances: $2,000.
    - Estimated spending for rest of month: $1,200.
    - Upcoming bills: Rent $1,000, Phone $100.
    - Predicted balance: -$300. Uncovered bill: Phone.
    - Suggest pausing non-essential subscriptions.
    </thinking>
    <answer>
    {{
      "predicted_balance": -300.0,
      "uncovered_bills": [{{"bill_name": "Phone", "amount": 100.0}}],
      "suggestion": "Your phone bill may not be covered. Consider pausing non-essential subscriptions to free up cash."
    }}
    </answer>

    **DATA:**
    - Accounts: {json.dumps(accounts)}
    - Upcoming Bills: {json.dumps(upcoming_bills)}
    - Recent Spending Velocity (USD/day): {recent_spending_velocity}
    """
    return call_gemini(model, prompt)


def interestkiller_ai(model, accounts: list, payment_amount: float) -> str:
    """
    Replaces the old algorithmic solver. Uses AI to compute and explain two optimal payment strategies.
    This is now the single source of truth for payment optimization.
    """
    prompt = f"""
    You are Nexus AI, an expert fiduciary financial strategist. Your task is to devise two optimal payment plans for a user's credit cards.

    **Instructions:**
    1.  **<thinking>** In a thinking block, perform your analysis for BOTH strategies.
        - **Strategy 1 (Minimize Interest Cost):** This is the "Avalanche" method. Identify the card with the highest APR. Plan to pay the minimum on all other cards and allocate the rest of the payment amount to this high-APR card. Calculate the projected interest savings for the month compared to only paying minimums.
        - **Strategy 2 (Maximize Credit Score):** This is the "Utilization" method. Identify cards with credit utilization over 30% or 50%. Plan to pay the minimum on all cards, then allocate the rest of the payment to the card whose utilization is highest, especially if the payment can bring it below a key threshold (e.g., from 35% to 29%). Explain that lower utilization is a major factor in credit scores.
        - Formulate a clear, benefit-driven explanation for each plan.
    2.  **</thinking>**
    3.  **<answer>** In an answer block, provide ONLY a valid JSON object with the following structure. Do not add any other text.
        ```json
        {{
          "minimize_interest_plan": {{
            "name": "Avalanche Method",
            "split": [{{ "card_id": "CardID", "amount": "PaymentAmount" }}],
            "explanation": "To save you the most money, this plan attacks your highest interest rate card first. This is the fastest mathematical path to becoming debt-free."
          }},
          "maximize_score_plan": {{
            "name": "Credit Score Booster",
            "split": [{{ "card_id": "CardID", "amount": "PaymentAmount" }}],
            "explanation": "To boost your credit score, this plan focuses on lowering your credit utilization on your most-used cards, a key factor in your score."
          }}
        }}
        ```
    **</answer>**

    **EXAMPLE:**
    <thinking>
    - Strategy 1: Card A has highest APR. Pay minimums on others, rest to Card A. Projected interest savings: $25.
    - Strategy 2: Card B has 55% utilization. Paying $400 brings it to 29%. This boosts credit score.
    </thinking>
    <answer>
    {{
      "minimize_interest_plan": {{
        "name": "Avalanche Method",
        "split": [{{"card_id": "A123", "amount": 600.0}}, {{"card_id": "B456", "amount": 50.0}}],
        "explanation": "By focusing your payment on Card A, which has the highest APR, you save $25 in interest this month."
      }},
      "maximize_score_plan": {{
        "name": "Credit Score Booster",
        "split": [{{"card_id": "B456", "amount": 400.0}}, {{"card_id": "A123", "amount": 250.0}}],
        "explanation": "Paying $400 to Card B drops its utilization from 55% to 29%, which can significantly boost your credit score."
      }}
    }}
    </answer>

    **DATA:**
    - Accounts: {json.dumps(accounts)}
    - Total Payment Amount: {payment_amount}
    """
    return call_gemini(model, prompt)

# --- SIMPLIFIED PROMPT FOR JSON MODE ---
def interestkiller_ai_pure(model, accounts: list, payment_amount: float, user_context: dict) -> str:
    """
    Final prompt, simplified to work with the model's native JSON mode.
    Focuses purely on the financial logic and persona.
    """
    import json
    prompt = f"""
    You are an elite Financial Counselor. Your communication style is clear, empowering, and data-driven. Your task is to generate a JSON object containing two optimal payment plans and a recommendation.

    --- KNOWLEDGE BASE & LOGIC ---
    1.  **Methods:** You must calculate plans for both the "Avalanche" (highest APR) and "Score Booster" (highest utilization) methods.
    2.  **Power Payment:** Each plan must have a single "Power Payment" card receiving the bulk of the funds after all other cards get their minimum payment (`1% of balance` or `$25`).
    3.  **Tie-Breaking:** If a tie in APR or Utilization, pick the card with the higher `balance`. If still a tie, pick the card whose `id` comes first alphabetically.
    4.  **Insufficient Funds:** If `payment_amount` is less than the total of all minimums, both plans must apply the entire `payment_amount` to the single highest-APR card.
    5.  **Projections:**
        - For Score Booster, estimate a 20-40 point increase if utilization drops below 30%.
        - For Avalanche, estimate the total interest saved over the next 12 months.

    --- FINAL JSON STRUCTURE ---
    The root object MUST contain: `nexus_recommendation`, `minimize_interest_plan`, `maximize_score_plan`.
    Each plan object MUST contain: `name`, `split`, `explanation`, `projected_outcome`.
    Each `split` item MUST contain: `card_id`, `card_name`, `amount`, `type`.
    The `nexus_recommendation` key should contain the name of the plan that best matches the `user_context.primary_goal`.

    --- DATA FOR THIS REQUEST ---
    - Accounts: {json.dumps(accounts, indent=2)}
    - Total Payment Amount: {payment_amount}
    - User Context: {json.dumps(user_context, indent=2)}
    """
    return call_gemini(model, prompt)

def interestkiller_ai_hybrid(model, plan_data: dict, user_context: dict) -> str:
    """
    Hybrid AI function. Receives pre-computed data from our sophisticated
    "Chief Strategist Algorithm" and crafts elite-level explanations.
    """
    import json
    prompt = f"""
    You are Nexus AI, an elite Chief Financial Strategist. You will be given a mathematically perfect payment plan and rich strategic context. Your job is to translate this data into an empowering, data-driven explanation for the user.

    --- STRATEGIC CONTEXT ANALYSIS (CRITICAL) ---
    - First, check `plan_data.context.paid_off_cards`. If this list is not empty, your explanation MUST start by celebrating this major victory. Frame it as "eliminating a debt account completely."
    - Next, check `plan_data.context.skipped_cards`. If this list is not empty, you MUST explain that this was a deliberate, expert-level choice to ignore low-interest (or 0% APR) cards to maximize the impact on high-interest debt.

    --- EXPLANATION & PROJECTION RULES ---
    1.  **Persona:** You are an expert providing a clear recommendation. Start with an assertive, positive statement.
    2.  **Explanation (The "What" and "Why"):** After handling the strategic context, focus on the single "Power Payment" card. State why it was chosen (highest APR or utilization) and the immediate, quantified impact.
    3.  **Projected Outcome (The "So What"):** Describe the long-term benefit (debt freedom, better loans, etc.).

    --- YOUR TASK ---
    Based on the provided `plan_data` and its `context`, generate a JSON object containing the required explanation and projection strings.

    --- DATA FOR YOUR TASK ---
    - Pre-computed Plan Data: {json.dumps(plan_data, indent=2)}
    - User Context: {json.dumps(user_context, indent=2)}
    """
    return call_gemini(model, prompt) 