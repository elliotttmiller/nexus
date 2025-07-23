import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import math

# --- 1. Load Environment ---
load_dotenv()

# --- 2. Lifespan Event Handler (Handles Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup logic. This is where we initialize the AI model."""
    print("INFO: FastAPI startup event triggered.")
    from services import initialize_model
    app.state.gemini_model = initialize_model()
    yield
    print("INFO: FastAPI shutdown event triggered.")

# --- 3. Create the App ---
app = FastAPI(title="Nexus Cortex AI", version="7.0.0-final", lifespan=lifespan)

# --- 4. Import Services and Define Endpoints ---
from services import (
    interestkiller_ai_hybrid, # <-- CORRECT FUNCTION IMPORTED
)

# --- Pydantic Models ---
class Transaction(BaseModel):
    id: str
    merchantName: str
    amount: float
    category: Optional[str] = None
    location: Optional[str] = None

class TransactionRequest(BaseModel):
    transactions: List[Transaction]

class SpendingInsightsRequest(BaseModel):
    transactions: List[Dict[str, Any]]

class BudgetHealthRequest(BaseModel):
    user_budget: Dict[str, Any]
    transactions: List[Dict[str, Any]]

class CashFlowPredictionRequest(BaseModel):
    accounts: List[Dict[str, Any]]
    upcoming_bills: List[Dict[str, Any]]
    transactions: List[Dict[str, Any]]

class Card(BaseModel):
    id: str
    name: str
    balance: float
    creditLimit: float
    apr: float
    utilization: float
    rewards: Dict[str, float]
    point_value_cents: float
    signup_bonus_progress: Optional[Dict[str, Any]] = None

class TransactionContext(BaseModel):
    merchantName: str
    amount: float
    category: Optional[str] = None
    location: Optional[str] = None

class UserContext(BaseModel):
    primaryGoal: str

class UserFinancialContext(BaseModel):
    primary_goal: str
    total_debt_last_month: Optional[float] = None
    last_plan_chosen: Optional[str] = None

class V2CardRankRequest(BaseModel):
    user_cards: List[Card]
    transaction_context: TransactionContext
    user_context: UserContext

class Account(BaseModel):
    id: str
    balance: float
    apr: float
    creditLimit: float

class V2InterestKillerRequest(BaseModel):
    accounts: List[Account]
    payment_amount: float
    user_context: UserFinancialContext

# --- Pre-computation and persona selection utilities ---
def precompute_financial_data(accounts: list, payment_amount: float) -> dict:
    enriched_accounts = []
    for acc in accounts:
        balance = acc.get('balance', 0)
        limit = acc.get('creditLimit', 0)
        min_payment = max(25, balance * 0.01) if balance > 25 else balance
        utilization = (balance / limit) * 100 if limit > 0 else 0
        enriched_accounts.append({
            **acc,
            "minimum_payment": round(min_payment, 2),
            "utilization_percent": round(utilization, 2)
        })
    highest_apr_card = max(enriched_accounts, key=lambda x: (x['apr'], x['balance'], x['id']))
    highest_util_card = max(enriched_accounts, key=lambda x: (x['utilization_percent'], x['balance'], x['id']))
    return {
        "enriched_accounts": enriched_accounts,
        "avalanche_target_id": highest_apr_card['id'],
        "score_booster_target_id": highest_util_card['id']
    }

def select_persona(user_context: dict, accounts: list) -> str:
    total_debt = sum(acc['balance'] for acc in accounts)
    if user_context.get('total_debt_last_month') and total_debt < user_context['total_debt_last_month']:
        return "Your top priority is to start with a strong, congratulatory message celebrating the user's progress in paying down debt. Build on this positive momentum."
    overall_utilization = sum(acc['balance'] for acc in accounts) / sum(acc['creditLimit'] for acc in accounts) if sum(acc['creditLimit'] for acc in accounts) > 0 else 0
    if overall_utilization > 0.7:
        return "The user is in a high-stress situation with high debt. Adopt a very calm, reassuring, and step-by-step tone. Focus on making the plan feel manageable and not overwhelming."
    return "The user is in a standard optimization state. Adopt a direct, confident, and encouraging 'financial coach' tone."

# --- NEW: The Pre-Computation Algorithm ---
def estimate_interest_saved(split, accounts, months=12):
    # Only consider the power payment card
    for item in split:
        if item['type'] == 'Power Payment':
            card = next((acc for acc in accounts if acc['id'] == item['card_id']), None)
            if card and card.get('apr'):
                # Simple estimate: interest saved = (power_payment_amount * apr/100) * months / 12
                return round(item['amount'] * (card['apr'] / 100) * months / 12, 2)
    return 0.0

def estimate_score_boost(split, accounts):
    # Only consider the power payment card
    for item in split:
        if item['type'] == 'Power Payment':
            card = next((acc for acc in accounts if acc['id'] == item['card_id']), None)
            if card and card.get('utilization_percent') is not None:
                before = card['utilization_percent']
                # Estimate after-payment utilization
                after = before - (item['amount'] / card['creditLimit'] * 100) if card['creditLimit'] else before
                # Heuristic: drop below 50% = 10-20 pts, below 30% = 20-40 pts
                if before > 30 and after <= 30:
                    return '20-40'
                elif before > 50 and after <= 50:
                    return '10-20'
    return '0'

# --- NEW: The "Chief Strategist" Pre-Computation Algorithm ---
def precompute_payment_plans_sophisticated(accounts: list, payment_amount: float) -> dict:
    """
    A sophisticated, multi-phase algorithm that makes strategic decisions about
    which cards to pay, including paying some off entirely and skipping others.
    """
    # --- Phase 1: Triage & Intel Gathering ---
    for acc in accounts:
        balance = acc.get('balance', 0)
        limit = acc.get('creditLimit', 0)
        acc['minimum_payment'] = max(25, balance * 0.01) if balance > 25 else balance
        acc['utilization_percent'] = (balance / limit) * 100 if limit > 0 else 0

    discretionary_payment = payment_amount
    paid_off_cards = []
    skipped_cards = []
    processed_card_ids = set()
    avalanche_split = []
    score_booster_split = []

    # --- Phase 2: Emergency & Opportunity Scan ---
    # 2a: Debt Elimination Opportunity (Pay off small balances first)
    sorted_by_balance = sorted(accounts, key=lambda x: x['balance'])
    for acc in sorted_by_balance:
        if discretionary_payment >= acc['balance'] and acc['balance'] > 0:
            payment = acc['balance']
            avalanche_split.append({"card_id": acc['id'], "card_name": acc.get('name', 'Card'), "amount": round(payment, 2), "type": "Payoff"})
            score_booster_split.append({"card_id": acc['id'], "card_name": acc.get('name', 'Card'), "amount": round(payment, 2), "type": "Payoff"})
            discretionary_payment -= payment
            paid_off_cards.append(acc)
            processed_card_ids.add(acc['id'])

    remaining_cards = [acc for acc in accounts if acc['id'] not in processed_card_ids]

    # 2b: Strategic Skip Opportunity (Ignore 0% APR cards for now)
    cards_requiring_minimums = []
    for acc in remaining_cards:
        if acc['apr'] > 0:
            cards_requiring_minimums.append(acc)
        else:
            skipped_cards.append(acc)
            avalanche_split.append({"card_id": acc['id'], "card_name": acc.get('name', 'Card'), "amount": 0.00, "type": "Strategic Skip"})
            score_booster_split.append({"card_id": acc['id'], "card_name": acc.get('name', 'Card'), "amount": 0.00, "type": "Strategic Skip"})

    # --- Phase 3: Core Strategic Allocation (On remaining cards) ---
    if cards_requiring_minimums and discretionary_payment > 0:
        total_remaining_minimums = sum(acc['minimum_payment'] for acc in cards_requiring_minimums)
        # Avalanche Logic
        avalanche_target = max(cards_requiring_minimums, key=lambda x: (x['apr'], x['balance']))
        power_payment_avalanche = discretionary_payment - (total_remaining_minimums - avalanche_target['minimum_payment'])
        for acc in cards_requiring_minimums:
            amount = power_payment_avalanche if acc['id'] == avalanche_target['id'] else acc['minimum_payment']
            avalanche_split.append({"card_id": acc['id'], "card_name": acc.get('name', 'Card'), "amount": round(amount, 2), "type": "Power Payment" if acc['id'] == avalanche_target['id'] else "Minimum Payment"})
        # Score Booster Logic
        score_booster_target = max(cards_requiring_minimums, key=lambda x: (x['utilization_percent'], x['balance']))
        power_payment_score = discretionary_payment - (total_remaining_minimums - score_booster_target['minimum_payment'])
        for acc in cards_requiring_minimums:
            amount = power_payment_score if acc['id'] == score_booster_target['id'] else acc['minimum_payment']
            score_booster_split.append({"card_id": acc['id'], "card_name": acc.get('name', 'Card'), "amount": round(amount, 2), "type": "Power Payment" if acc['id'] == score_booster_target['id'] else "Minimum Payment"})

    # --- Phase 4: Construct Final Data Dossier for AI ---
    return {
        "avalanche_plan": {"split": avalanche_split},
        "score_booster_plan": {"split": score_booster_split},
        "context": {
            "paid_off_cards": [c.get('name', 'Card') for c in paid_off_cards],
            "skipped_cards": [c.get('name', 'Card') for c in skipped_cards]
        }
    }

from services import interestkiller_ai_hybrid

@app.get("/", summary="Health Check")
def root():
    return {"status": "ok", "ai_model_status": "loaded" if app.state.gemini_model else "initialization_failed"}

@app.get("/health", summary="Health Check (platform)")
def health():
    return {"status": "ok"}

@app.post("/v2/spending-insights")
def spending_insights_v2(req: SpendingInsightsRequest):
    try:
        result = spending_insights_ai(app.state.gemini_model, req.transactions)
        return {"result": json.loads(result)}
    except Exception as e:
        logger.error(f"Error in /v2/spending-insights: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/v2/budget-health")
def budget_health_v2(req: BudgetHealthRequest):
    try:
        result = budget_health_ai(app.state.gemini_model, req.user_budget, req.transactions)
        return {"result": json.loads(result)}
    except Exception as e:
        logger.error(f"Error in /v2/budget-health: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/v2/cash-flow-prediction")
def cash_flow_prediction_v2(req: CashFlowPredictionRequest):
    try:
        result = cash_flow_prediction_ai(app.state.gemini_model, req.accounts, req.upcoming_bills, req.transactions)
        return {"result": json.loads(result)}
    except Exception as e:
        logger.error(f"Error in /v2/cash-flow-prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post('/v2/cardrank')
def cardrank_v2(req: V2CardRankRequest):
    try:
        from cardrank import advanced_card_recommendation
        result = advanced_card_recommendation(
            app.state.gemini_model,
            [c.model_dump() for c in req.user_cards],
            req.transaction_context.model_dump(),
            req.user_context.model_dump()
        )
        return result
    except Exception as e:
        logger.error(f"Error in /v2/cardrank: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/v2/interestkiller')
async def interestkiller_v2(req: V2InterestKillerRequest):
    try:
        logger.info(f"Received /v2/interestkiller request: {req}")
        plan_data = precompute_payment_plans_sophisticated(
            [acc.model_dump() for acc in req.accounts],
            req.payment_amount
        )
        logger.info(f"Computed plan_data: {json.dumps(plan_data, indent=2)}")
        raw_ai_result = interestkiller_ai_hybrid(
            app.state.gemini_model,
            plan_data,
            req.user_context.model_dump()
        )
        logger.info(f"Raw AI result: {raw_ai_result}")
        try:
            ai_json = json.loads(raw_ai_result)
        except Exception as e:
            logger.error(f"Failed to parse AI JSON: {e}. Raw AI result: {raw_ai_result}")
            raise HTTPException(status_code=500, detail=f"AI response was not valid JSON: {e}")
        logger.info(f"Parsed AI JSON: {json.dumps(ai_json, indent=2)}")
        # Check for required keys
        required_keys = ["nexus_recommendation", "minimize_interest_explanation", "minimize_interest_projection", "maximize_score_explanation", "maximize_score_projection"]
        for key in required_keys:
            if key not in ai_json:
                logger.error(f"AI response missing required key: {key}. Full AI JSON: {json.dumps(ai_json, indent=2)}")
                raise HTTPException(status_code=500, detail=f"AI response missing required key: {key}")
        final_response = {
            "nexus_recommendation": ai_json.get("nexus_recommendation"),
            "minimize_interest_plan": {
                "name": "Avalanche Method",
                "split": plan_data['avalanche_plan']['split'],
                "explanation": ai_json['minimize_interest_explanation'],
                "projected_outcome": ai_json['minimize_interest_projection']
            },
            "maximize_score_plan": {
                "name": "Credit Score Booster",
                "split": plan_data['score_booster_plan']['split'],
                "explanation": ai_json['maximize_score_explanation'],
                "projected_outcome": ai_json['maximize_score_projection']
            }
        }
        logger.info(f"Final response: {json.dumps(final_response, indent=2)}")
        return final_response
    except Exception as e:
        logger.error(f"UNEXPECTED ERROR in /v2/interestkiller: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {e}") 