def recommend_card(cards, merchant, category, user_features):
    # Example: choose card with highest reward for category, factoring in utilization and statement dates
    best_card = None
    best_score = float('-inf')
    for card in cards:
        rewards = card.get('rewards', {})
        reward = rewards.get(category, rewards.get('default', 1))
        utilization = card.get('utilization', 0.0)
        statement_days = card.get('days_until_statement', 30)
        # Example scoring: prioritize high reward, low utilization, statement not too close
        score = reward - 0.01 * utilization - (1 if statement_days < 5 else 0)
        if score > best_score:
            best_score = score
            best_card = card
    return best_card 