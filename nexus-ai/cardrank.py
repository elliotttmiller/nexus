from services import enrich_transaction_with_vertex_ai, generate_text_with_gemini
from typing import List, Dict

def advanced_card_recommendation(user_cards: List[Dict], transaction_context: Dict, user_context: Dict) -> Dict:
    enriched_data = enrich_transaction_with_vertex_ai(
        transaction_context.get('merchantName'),
        transaction_context.get('location')
    )
    primary_category = enriched_data.get('category', 'General')
    best_card = None
    best_score = -1e9
    scored_cards = []
    for card in user_cards:
        score = 0
        goal = user_context.get('primaryGoal', 'MINIMIZE_INTEREST_COST')
        rewards_map = card.get('rewards', {})
        reward_multiplier = rewards_map.get(primary_category, rewards_map.get('default', 1.0))
        point_value = card.get('point_value_cents', 1.0) / 100
        reward_score = transaction_context.get('amount', 0) * reward_multiplier * point_value
        if goal == "MAXIMIZE_CASHBACK" or goal == "EARN_TRAVEL_POINTS":
            score += 10 * reward_score
        elif goal == "PAY_DOWN_DEBT":
            score += reward_score
            score -= card.get('apr', 0) * 0.1
            score -= card.get('utilization', 0) * 0.5
        elif goal == "MAXIMIZE_CREDIT_SCORE":
            score += reward_score
            util = card.get('utilization', 0)
            if util > 0.3:
                score -= util * 2
            elif util < 0.01:
                score -= 0.1
            else:
                score += 0.5
        bonus = card.get('signup_bonus_progress', {})
        if bonus and bonus.get('spend_needed', 0) > 0:
            if transaction_context.get('amount', 0) >= bonus.get('spend_needed', float('inf')):
                score += bonus.get('bonus_value', 0) * 100
        scored_cards.append({"card": card, "score": score, "base_reward_value": reward_score})
    if not scored_cards:
        raise ValueError("No cards provided for ranking.")
    best_scored_card = max(scored_cards, key=lambda x: x['score'])
    best_card = best_scored_card['card']
    prompt = f"""
    A user is about to make a ${transaction_context.get('amount')} purchase at {transaction_context.get('merchantName')}.
    Their primary financial goal is '{user_context.get('primaryGoal')}'.
    We are recommending they use their '{best_card.get('name')}' card.
    The raw reward value for this purchase is ${best_scored_card['base_reward_value']:.2f}.
    Briefly and clearly explain why this is the best card for them in one or two sentences, tailored to their goal.
    """
    explanation = generate_text_with_gemini(prompt)
    return {
        "recommended_card": best_card,
        "reason": explanation,
        "reward_value_usd": round(best_scored_card['base_reward_value'], 2),
        "debug_scores": sorted(scored_cards, key=lambda x: x['score'], reverse=True)
    } 