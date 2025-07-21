import numpy as np
from datetime import datetime

def advanced_payment_split(accounts, payment_amount, optimization_goal):
    # Example: Minimize interest by paying highest APR first
    sorted_accounts = sorted(accounts, key=lambda x: -x['apr'])
    split = []
    remaining = payment_amount
    for acc in sorted_accounts:
        pay = min(acc['balance'], remaining)
        split.append({'card_id': acc['id'], 'amount': pay})
        remaining -= pay
        if remaining <= 0:
            break
    explanation = (
        f"Your payment was split to prioritize cards with the highest APR, "
        f"helping you minimize interest costs. "
        f"If you selected only one card, the full payment was applied to that card."
    )
    return {
        'split': split,
        'explanation': explanation
    } 