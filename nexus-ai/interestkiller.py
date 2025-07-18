from scipy.optimize import linprog

def optimize_payment_split(balances, aprs, payment_amount):
    # Minimize total interest: sum(payment_to_card * apr)
    c = aprs
    A_eq = [[1]*len(balances)]
    b_eq = [payment_amount]
    bounds = [(0, bal) for bal in balances]
    result = linprog(c, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method='highs')
    if result.success:
        return [{"amount": round(x, 2), "card_index": i} for i, x in enumerate(result.x)]
    else:
        # Fallback: pay as much as possible to highest APR
        idx = aprs.index(max(aprs))
        split = [{"amount": payment_amount, "card_index": idx}]
        return split 