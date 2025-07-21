import numpy as np
from scipy.optimize import linprog

def advanced_payment_split(accounts, payment_amount, optimization_goal):
    if not accounts:
        return {"split": [], "explanation": "No cards provided."}
    num_cards = len(accounts)
    balances = np.array([acc.get('balance', 0) for acc in accounts])
    aprs = np.array([acc.get('apr', 0) / 100.0 for acc in accounts])
    credit_limits = np.array([acc.get('creditLimit', 1) for acc in accounts])
    min_payments = np.array([max(25, 0.02 * bal) for bal in balances])  # $25 or 2% minimum

    # Objective: Minimize total interest (or utilization)
    if optimization_goal == "MAXIMIZE_CREDIT_SCORE":
        # Minimize max utilization (or bring all below 30%)
        c = (balances + 1) / credit_limits
    else:
        # Minimize interest: prioritize high APR
        c = aprs

    # Constraints: sum(payments) == payment_amount, 0 <= payment <= balance, payment >= min_payment
    A_eq = np.ones((1, num_cards))
    b_eq = np.array([payment_amount])
    bounds = [(min_pay, bal) for min_pay, bal in zip(min_payments, balances)]

    res = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method='highs')
    if res.success:
        split = [{"card_id": accounts[i]["id"], "amount": round(x, 2)} for i, x in enumerate(res.x) if x > 0.01]
        explanation = (
            "AI split your payment to "
            + ("minimize interest by focusing on high-APR cards." if optimization_goal == "MINIMIZE_INTEREST_COST"
               else "lower utilization across all cards for credit score improvement.")
        )
        return {"split": split, "explanation": explanation}
    else:
        # Fallback: pay highest APR first
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
            "AI could not optimize perfectly, so your payment was split to prioritize cards with the highest APR."
        )
        return {"split": split, "explanation": explanation} 