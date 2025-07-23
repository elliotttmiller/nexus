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
    """Initializes and returns the Gemini model object."""
    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            logger.critical("services.py - GOOGLE_API_KEY not found.")
            return None
        genai.configure(api_key=api_key)
        # Use the faster, lower-latency model
        model = genai.GenerativeModel("gemini-1.5-flash-latest")
        logger.info("services.py - Google AI Gemini model initialized successfully (flash model).")
        return model
    except Exception as e:
        logger.critical(f"services.py - Failed to initialize Gemini model: {e}", exc_info=True)
        return None

def call_gemini(model: 'genai.GenerativeModel', prompt: str, max_retries: int = 3) -> str:
    """
    Generates content with retry logic and robustly extracts the final answer
    from either <answer> tags OR ```json Markdown fences.
    """
    import random
    import time
    import re
    if not model:
        logger.warning("call_gemini called but model is not available.")
        return "{\"error\": \"AI model is not available. Check server startup logs.\"}"
    
    for attempt in range(max_retries + 1):
        try:
            full_response = model.generate_content(prompt).text
            # --- UPGRADED PARSER LOGIC ---
            # This regex looks for either <answer> or ```json and captures what's inside.
            # (?:...) is a non-capturing group, | means OR.
            match = re.search(r'(?:<answer>|```json\n)(.*?)(?:</answer>|```)', full_response, re.DOTALL | re.IGNORECASE)
            # --- END OF UPGRADED LOGIC ---

            if match:
                # The captured content is in group(1). Strip any whitespace.
                return match.group(1).strip()
            else:
                logger.error(f"Could not find <answer> tags OR ```json fences in AI response. Full response: {full_response}")
                return "{\"error\": \"AI returned a malformed response (no valid tags or fences).\"}"
        except Exception as e:
            error_str = str(e).lower()
            if 'rate limit' in error_str or 'quota' in error_str or 'resource_exhausted' in error_str:
                if attempt < max_retries:
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Rate limit hit, retrying in {wait_time:.2f} seconds (attempt {attempt + 1}/{max_retries + 1})")
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"Rate limit exceeded after {max_retries + 1} attempts")
                    return '{"error": "Rate limit exceeded. Please try again later or upgrade your API plan."}'
            else:
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

# --- UNIFIED PURE AI LOGIC CORE ---
def interestkiller_ai_pure(model, accounts: list, payment_amount: float, user_context: dict) -> str:
    """
    Final, Counselor-Level AI function. It generates two plans with highly descriptive,
    user-friendly, and quantified explanations and outcomes.
    """
    import json
    prompt = f"""
    You are Nexus AI, an elite Financial Counselor. Your communication style is clear, empowering, data-driven, and always focused on the user's long-term success.

    --- YOUR KNOWLEDGE BASE ---
    1.  **Financial Math:** Credit Utilization (`(balance/limit)*100`), Minimum Payments (`1% of balance` or `$25`), Avalanche (highest APR), Score Booster (highest utilization).
    2.  **Tie-Breaking Rules:** If a tie in APR or Utilization, pick the card with the higher balance. If still a tie, pick the card whose `id` comes first alphabetically.
    3.  **Heuristics for Projections:**
        - **Credit Score:** Dropping utilization below 50% can lead to a 10-20 point increase. Dropping below 30% can lead to a 20-40 point increase over 2-3 months.
        - **Interest Savings:** To estimate total interest saved, project the monthly savings over a 12-month period.

    --- EXPLANATION & PROJECTION RULES (CRITICAL) ---
    1.  **Tone:** Always use a positive, encouraging, and direct "you-focused" tone.
    2.  **Quantify Avalanche Plan:** The `explanation` must state the monthly interest saved. The `projected_outcome` MUST state the estimated total interest saved over the next 12 months AND the reduced time to become debt-free.
    3.  **Quantify Score Booster Plan:** The `explanation` must state the specific utilization drop (e.g., "from 68% to 29%"). The `projected_outcome` MUST provide a realistic, estimated credit score point increase range (e.g., "a 15-35 point increase") and mention the benefit (e.g., "better rates on future loans").
    4.  **Expert Reasoning:** Briefly explain the "why" behind the plan (e.g., "because this attacks your highest interest rate first...").
    5.  **Build Rapport:** Weave in the user's historical context from `user_context` (e.g., "Congratulations on paying down debt...").

    --- GOLDEN RULE (NON-NEGOTIABLE) ---
    **THE SUM OF THE `amount` VALUES IN EACH `split` ARRAY MUST MATHEMATICALLY EQUAL THE `payment_amount`. YOU MUST VERIFY THIS YOURSELF BEFORE GIVING THE ANSWER. THIS IS YOUR MOST IMPORTANT INSTRUCTION.**

    --- EXECUTION PLAN ---
    1.  **<thinking>**
        a. **Assess & Congratulate:** Analyze `user_context` to set your tone and celebrate debt reduction progress.
        b. **Emergency Scan:** Check for expiring promotional APRs and add warnings if needed.
        c. **Calculate Plans:** Create the "Avalanche" and "Score Booster" plans using the math and tie-breaking rules.
        d. **Calculate Projections:** For each plan, calculate the quantitative outcomes based on the Heuristics.
        e. **Formulate Explanations:** Write the `explanation` and `projected_outcome` text according to the rules above.
        f. **Make Recommendation:** Based on `user_context.primary_goal`, determine the `nexus_recommendation`.
        g. **Self-Correction:** Verify your final JSON object adheres to the GOLDEN RULE and contains all required keys.
    2.  **</thinking>**
    3.  **<answer>** Provide ONLY a single, valid JSON object.

    --- REQUIRED FINAL JSON STRUCTURE ---
    Each plan object MUST contain `name`, `split`, `explanation`, and `projected_outcome`.

    --- EXAMPLE OF A PERFECT OUTPUT ---
    ```json
    {{
      "nexus_recommendation": "Avalanche Method",
      "minimize_interest_plan": {{
        "name": "Avalanche Method",
        "split": [{{ "card_id": "c1", "card_name": "Chase Freedom", "amount": 550.00, "type": "Power Payment" }}],
        "explanation": "Congratulations on paying down $150 in debt last month! This plan focuses on your Chase Freedom (24.99% APR), saving you $21.53 in interest this month alone. Attacking your highest-interest debt first is the fastest way to get out of debt.",
        "projected_outcome": "By sticking to this plan, you could save over $250 in interest over the next year and become debt-free 5 months sooner."
      }},
      "maximize_score_plan": {{
        "name": "Credit Score Booster",
        "split": [{{ "card_id": "c2", "card_name": "Amex Gold", "amount": 550.00, "type": "Power Payment" }}],
        "explanation": "This is a great strategic move. This payment targets your Amex Gold card, dropping its credit utilization from a high 65% all the way down to 28%. Your credit score is heavily influenced by this utilization number.",
        "projected_outcome": "Dropping below the 30% threshold like this could boost your credit score by 20-40 points over the next few months, helping you qualify for much better rates on future loans."
      }}
    }}
    ```
    **</answer>**

    --- DATA FOR THIS REQUEST ---
    - Accounts: {json.dumps(accounts, indent=2)}
    - Total Payment Amount: {payment_amount}
    - User Context: {json.dumps(user_context, indent=2)}
    """
    return call_gemini(model, prompt) 