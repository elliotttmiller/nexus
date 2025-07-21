from typing import List, Dict
# No Gemini import needed unless you want to use call_gemini_vertex from services

def advanced_card_recommendation(user_cards: List[Dict], transaction_context: Dict, user_context: Dict) -> Dict:
    # Example: If you want to use Gemini, import call_gemini_vertex from services and use it here
    primary_category = 'General'  # Placeholder, update as needed
    best_card = None
    best_score = -1e9
    for card in user_cards:
        score = card.get('rewards', {}).get(primary_category, 1.0)
        if score > best_score:
            best_score = score
            best_card = card
    return {
        "recommended_card": best_card,
        "reason": f"Use your {best_card.get('name')} for the best rewards on this purchase.",
        "reward_value_usd": 0.0,
    } 