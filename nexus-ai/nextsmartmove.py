from services import generate_text_with_vertex_ai
import json

def dynamic_next_smart_move(user_state: dict) -> dict:
    condensed_state = {
        "credit_score": user_state.get("creditScore"),
        "total_debt": user_state.get("totalDebt"),
        "primary_goal": user_state.get("primaryGoal"),
        "accounts": [
            {
                "name": acc.get("name"),
                "balance": acc.get("balance"),
                "apr": acc.get("apr"),
                "utilization": acc.get("utilization"),
                "is_promo_active": acc.get("isPromoActive"),
            } for acc in user_state.get("accounts", [])
        ],
        "recent_insights": user_state.get("insights", []),
        "upcoming_goals": user_state.get("upcomingGoals", [])
    }
    prompt = f"""
    You are \"Nexus AI\", a sophisticated and caring financial co-pilot.
    Analyze the following user's financial state, which is provided as a JSON object.
    Your task is to identify the single most important, impactful, and actionable \"smart move\" this user should make right now.

    User's State:
    {json.dumps(condensed_state, indent=2)}

    Based on this data, determine the best next move. Consider these priorities:
    1. Critical alerts (e.g., upcoming payment due, high utilization on a card).
    2. Opportunities to save significant money (e.g., applying 'found money' to high-interest debt).
    3. Progress towards a stated goal (e.g., hitting a signup bonus spend requirement).
    4. General optimization advice.

    Your response MUST be a JSON object with the following structure and no other text:
    {{
      "title": "A short, compelling headline for the action (e.g., 'Tackle Your Highest Interest Card').",
      "description": "A one or two-sentence explanation of why this move is important and what the benefit is (e.g., 'You can save an estimated $45 in interest this month by putting your extra dining savings towards this card.').",
      "action_type": "A programmatic key for the frontend (e.g., 'MAKE_PAYMENT', 'SET_GOAL', 'VIEW_CARD_OFFERS').",
      "action_details": {{
        "target_account_id": "The ID of the account to act on, if applicable.",
        "suggested_amount": "The suggested dollar amount for the action, if applicable."
      }}
    }}
    """
    response_str = generate_text_with_vertex_ai(prompt, max_tokens=500)
    try:
        return json.loads(response_str)
    except (json.JSONDecodeError, TypeError):
        return {
            "title": "Review Your Financial Health",
            "description": "Take a moment to review your account balances and upcoming payments.",
            "action_type": "VIEW_DASHBOARD",
            "action_details": {}
        } 