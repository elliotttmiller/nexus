
from typing import List, Dict
import json

def enrich_merchant_category(transaction_context: Dict) -> str:
    # Stub for merchant/category enrichment (future: Google Places API)
    # For now, just return the provided category or guess from merchant name
    merchant = transaction_context.get('merchantName', '').lower()
    if 'airlines' in merchant or 'delta' in merchant:
        return 'travel'
    if 'grocery' in merchant or 'market' in merchant:
        return 'groceries'
    if 'amazon' in merchant:
        return 'shopping'
    return transaction_context.get('category', 'General')

def advanced_card_recommendation(gemini_model, user_cards: List[Dict], transaction_context: Dict, user_context: Dict) -> Dict:
    # Enrich category
    primary_category = enrich_merchant_category(transaction_context)
    merchant = transaction_context.get('merchantName', '')
    amount = transaction_context.get('amount', 0)
    location = transaction_context.get('location', '')
    goal = user_context.get('primaryGoal', 'MINIMIZE_INTEREST_COST')
    season = transaction_context.get('season', None)  # For future: holiday/seasonal bonuses

    scored_cards = []
    why_not_cards = []
    for card in user_cards:
        score = 0
        details = []
        rewards_map = card.get('rewards', {})
        # Multi-category and merchant bonus support
        reward_multiplier = 1.0
        if isinstance(rewards_map, dict):
            if primary_category in rewards_map:
                reward_multiplier = rewards_map[primary_category]
                details.append(f"Category match: {primary_category} x{reward_multiplier}")
            elif 'categories' in card and isinstance(card['categories'], list) and primary_category in card['categories']:
                reward_multiplier = rewards_map.get('category_bonus', 1.0)
                details.append(f"Category bonus: {primary_category} x{reward_multiplier}")
            else:
                reward_multiplier = rewards_map.get('default', 1.0)
                details.append(f"Default reward x{reward_multiplier}")
        point_value = card.get('point_value_cents', 1.0) / 100.0
        reward_score = amount * reward_multiplier * point_value
        details.append(f"Reward value: ${reward_score:.2f}")

        # Multi-objective scoring
        annual_fee = card.get('annual_fee', 0)
        apr = card.get('apr', 0)
        utilization = card.get('utilization', 0)
        promo_apr_expiry = card.get('promo_apr_expiry_date')
        bonus = card.get('signup_bonus_progress', {})

        # Weighted scoring by goal
        if goal == "MAXIMIZE_CASHBACK":
            score += 10 * reward_score
            details.append("Goal: Maximize cashback")
        elif goal == "PAY_DOWN_DEBT":
            score += reward_score - (apr * 0.3) - (utilization * 2.0)
            details.append("Goal: Pay down debt (APR/utilization penalty)")
        elif goal == "EARN_TRAVEL_POINTS":
            travel_bonus = 2.0 if 'travel' in card.get('categories', []) or primary_category == 'travel' else 1.0
            score += 8 * reward_score * travel_bonus
            details.append("Goal: Earn travel points")
        else:
            score += reward_score - (apr * 0.1) - (utilization * 0.5)
            details.append("Goal: Balanced")

        # Penalty for annual fee (unless offset by rewards)
        if annual_fee > 0:
            score -= annual_fee * 0.5
            details.append(f"Annual fee penalty: -${annual_fee * 0.5:.2f}")

        # Bonus for 0% promo APR
        if promo_apr_expiry:
            score += 5
            details.append("Promo APR bonus")

        # Signup bonus logic
        if bonus and bonus.get('spend_needed', 0) > 0 and amount >= bonus.get('spend_needed', float('inf')):
            score += bonus.get('bonus_value', 0) * 100
            details.append("Signup bonus achieved!")

        # Penalty for high utilization
        if utilization > 0.8:
            score -= 5
            details.append("High utilization penalty")

        # Scenario simulation: what if this card is used?
        projected_utilization = (card.get('balance', 0) + amount) / card.get('creditLimit', 1)
        if projected_utilization > 0.9:
            score -= 10
            details.append("Projected utilization >90% penalty")

        # Real-time offers/affiliate stub
        if card.get('has_real_time_offer'):
            score += 3
            details.append("Real-time offer bonus")

        scored_cards.append({"card": card, "score": score, "base_reward_value": reward_score, "details": details})

    if not scored_cards:
        raise ValueError("No cards provided.")
    best_scored_card = max(scored_cards, key=lambda x: x['score'])
    best_card = best_scored_card['card']

    # Why not explanations for other cards
    for c in scored_cards:
        if c['card']['id'] != best_card['id']:
            why_not_cards.append({
                "card": c['card'],
                "score": c['score'],
                "reason": f"Not chosen because: {', '.join(c['details'])}"
            })

    # --- Enhanced AI-Powered Explanation ---
    from services import call_gemini
    prompt = f"""
    You are Nexus AI, a world-class financial assistant. Explain to the user why the recommended card is the best choice for this transaction, in a friendly, human, and transparent way.
    - User's goal: {goal}
    - Transaction: {merchant} for ${amount:.2f} in {location} (category: {primary_category})
    - Card: {best_card.get('name')} (APR: {best_card.get('apr')}, Utilization: {best_card.get('utilization', 0):.2f}, Annual Fee: {best_card.get('annual_fee', 0)})
    - Reward value: ${best_scored_card['base_reward_value']:.2f}
    - Key factors: {', '.join(best_scored_card['details'])}
    In <thinking>, analyze the match between the user's goal, the card's rewards, and the transaction, referencing any trade-offs or bonuses.
    In <answer>, give a clear, friendly, one-sentence explanation for the user.
    """
    explanation = call_gemini(gemini_model, prompt)

    return {
        "recommended_card": best_card,
        "reason": explanation,
        "reward_value_usd": round(best_scored_card['base_reward_value'], 2),
        "why_not": why_not_cards
    }