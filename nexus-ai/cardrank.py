from typing import List, Dict
import json

def advanced_card_recommendation(gemini_model, user_cards: List[Dict], transaction_context: Dict, user_context: Dict) -> Dict:
    primary_category = transaction_context.get('category', 'General')
    merchant = transaction_context.get('merchantName', '')
    amount = transaction_context.get('amount', 0)
    location = transaction_context.get('location', '')
    goal = user_context.get('primaryGoal', 'MINIMIZE_INTEREST_COST')

    best_score = -1e9
    scored_cards = []
    for card in user_cards:
        score = 0
        rewards_map = card.get('rewards', {})
        # Support multiple reward categories per card
        reward_multiplier = 1.0
        if isinstance(rewards_map, dict):
            # Try direct match, then category list, then default
            if primary_category in rewards_map:
                reward_multiplier = rewards_map[primary_category]
            elif 'categories' in card and isinstance(card['categories'], list) and primary_category in card['categories']:
                reward_multiplier = rewards_map.get('category_bonus', 1.0)
            else:
                reward_multiplier = rewards_map.get('default', 1.0)
        point_value = card.get('point_value_cents', 1.0) / 100.0
        reward_score = amount * reward_multiplier * point_value

        # Nuanced goal handling
        if goal == "MAXIMIZE_CASHBACK":
            score += 10 * reward_score
        elif goal == "PAY_DOWN_DEBT":
            score += reward_score - (card.get('apr', 0) * 0.2) - (card.get('utilization', 0) * 1.0)
        elif goal == "EARN_TRAVEL_POINTS":
            # Prefer cards with travel rewards or categories
            travel_bonus = 2.0 if 'travel' in card.get('categories', []) or primary_category == 'travel' else 1.0
            score += 8 * reward_score * travel_bonus
        else:
            # Default: balance reward, apr, and utilization
            score += reward_score - (card.get('apr', 0) * 0.1) - (card.get('utilization', 0) * 0.5)

        # Bonus for 0% promo APR
        promo_apr_expiry = card.get('promo_apr_expiry_date')
        if promo_apr_expiry:
            score += 5

        # Signup bonus logic
        bonus = card.get('signup_bonus_progress', {})
        if bonus and bonus.get('spend_needed', 0) > 0 and amount >= bonus.get('spend_needed', float('inf')):
            score += bonus.get('bonus_value', 0) * 100

        # Penalty for high utilization
        if card.get('utilization', 0) > 0.8:
            score -= 5

        scored_cards.append({"card": card, "score": score, "base_reward_value": reward_score})

    if not scored_cards:
        raise ValueError("No cards provided.")
    best_scored_card = max(scored_cards, key=lambda x: x['score'])
    best_card = best_scored_card['card']

    # --- Enhanced AI-Powered Explanation ---
    from services import call_gemini
    prompt = f"""
    You are Nexus AI, a financial assistant. Explain to the user why the recommended card is the best choice for this transaction.
    - User's goal: {goal}
    - Transaction: {merchant} for ${amount:.2f} in {location} (category: {primary_category})
    - Card: {best_card.get('name')} (APR: {best_card.get('apr')}, Utilization: {best_card.get('utilization', 0):.2f})
    - Reward value: ${best_scored_card['base_reward_value']:.2f}
    In <thinking>, analyze the match between the user's goal, the card's rewards, and the transaction.
    In <answer>, give a clear, friendly, one-sentence explanation for the user.
    """
    explanation = call_gemini(gemini_model, prompt)

    return {
        "recommended_card": best_card,
        "reason": explanation,
        "reward_value_usd": round(best_scored_card['base_reward_value'], 2),
    }