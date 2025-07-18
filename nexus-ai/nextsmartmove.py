def get_next_smart_move(user_state):
    # Example: recommend highest impact action
    if user_state.get("missed_payment"):
        return "Make a payment now to avoid late fees."
    if user_state.get("close_to_bonus"):
        return "Spend $50 more on your Amex Gold to unlock a $200 bonus."
    return "Pay $250 extra to your Citi card before Friday to save $22 in interest." 