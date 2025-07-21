from typing import List, Dict
import json

def advanced_card_recommendation(gemini_model, user_cards: List[Dict], transaction_context: Dict, user_context: Dict) -> Dict:
    # We will use a placeholder enrichment for now.
    # In the future, you can add a call to the Google Places API here.
    primary_category = transaction_context.get('category', 'General')
    
    # --- Algorithmic Scoring ---
    # This deterministic scoring logic is fast and effective.
    best_score = -1e9
    scored_cards = []
    for card in user_cards:
        # (This is the full, robust scoring logic from our previous designs)
        score = 0; goal = user_context.get('primaryGoal', 'MINIMIZE_INTEREST_COST')
        rewards_map = card.get('rewards', {}); reward_multiplier = rewards_map.get(primary_category, rewards_map.get('default', 1.0))
        point_value = card.get('point_value_cents', 1.0) / 100.0; reward_score = transaction_context.get('amount', 0) * reward_multiplier * point_value
        if goal == "MAXIMIZE_CASHBACK": score += 10 * reward_score
        elif goal == "PAY_DOWN_DEBT": score += reward_score - (card.get('apr', 0) * 0.1) - (card.get('utilization', 0) * 0.5)
        bonus = card.get('signup_bonus_progress', {}); 
        if bonus and bonus.get('spend_needed', 0) > 0 and transaction_context.get('amount', 0) >= bonus.get('spend_needed', float('inf')): score += bonus.get('bonus_value', 0) * 100
        scored_cards.append({"card": card, "score": score, "base_reward_value": reward_score})

    if not scored_cards: raise ValueError("No cards provided.")
    best_scored_card = max(scored_cards, key=lambda x: x['score'])
    best_card = best_scored_card['card']
    
    # --- AI-Powered Explanation ---
    from services import call_gemini # Import locally to avoid circular dependencies
    prompt = f"""
    You are Nexus AI. Your goal is to explain a credit card recommendation.
    1. In a <thinking> block, analyze the user's goal and the chosen card's strengths.
    2. In an <answer> block, provide a single, compelling, user-friendly sentence explaining the choice.
    DATA: User's Goal='{user_context.get('primaryGoal')}'; Recommended Card='{best_card.get('name')}'; Reward Value=${best_scored_card['base_reward_value']:.2f}
    """
    explanation = call_gemini(gemini_model, prompt)
    
    return {
        "recommended_card": best_card,
        "reason": explanation,
        "reward_value_usd": round(best_scored_card['base_reward_value'], 2),
    } 