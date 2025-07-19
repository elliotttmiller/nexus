import numpy as np
from datetime import datetime

def advanced_payment_split(accounts: list, payment_amount: float, optimization_goal: str) -> list:
    if not accounts:
        return []
    num_cards = len(accounts)
    balances = np.array([acc.get('balance', 0) for acc in accounts])
    aprs = np.array([acc.get('apr', 0) / 100.0 for acc in accounts])
    credit_limits = np.array([acc.get('creditLimit', 1) for acc in accounts])
    if optimization_goal == "MAXIMIZE_CREDIT_SCORE":
        current_utilizations = balances / credit_limits
        c = (1 - current_utilizations) + (aprs * 0.01)
    else:
        c = -aprs
    A_eq = np.ones((1, num_cards))
    b_eq = np.array([payment_amount])
    bounds = [(0, bal) for bal in balances]
    today = datetime.now()
    for i, acc in enumerate(accounts):
        promo_end_str = acc.get('promoEndDate')
        if promo_end_str:
            promo_end_date = datetime.fromisoformat(promo_end_str)
            if acc.get('promoAPR', 100) == 0 and promo_end_date > today:
                if optimization_goal == "MINIMIZE_INTEREST_COST":
                    c[i] = 1e6
    from scipy.optimize import linprog
    res = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method='highs')
    if res.success:
        return [{"card_id": accounts[i].get("id"), "payment_amount": round(x, 2)} for i, x in enumerate(res.x) if x > 0.01]
    else:
        sorted_indices = np.argsort(-aprs)
        split = []
        remaining_payment = payment_amount
        for i in sorted_indices:
            if remaining_payment <= 0: break
            payment = min(remaining_payment, balances[i])
            split.append({"card_id": accounts[i].get("id"), "payment_amount": round(payment, 2)})
            remaining_payment -= payment
        return split 