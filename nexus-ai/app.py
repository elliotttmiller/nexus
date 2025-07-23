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
    interestkiller_ai_pure,
    spending_insights_ai,
    budget_health_ai,
    cash_flow_prediction_ai,
    interestkiller_ai
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
def precompute_payment_plans(accounts: list, payment_amount: float) -> dict:
    """
    Deterministic algorithm for payment splits. Returns a data structure for the AI to explain.
    """
    for acc in accounts:
        balance = acc.get('balance', 0)
        limit = acc.get('creditLimit', 0)
        acc['minimum_payment'] = max(25, balance * 0.01) if balance > 25 else balance
        acc['utilization_percent'] = (balance / limit) * 100 if limit > 0 else 0
    total_minimums = sum(acc['minimum_payment'] for acc in accounts)
    # Avalanche Plan
    avalanche_target = max(accounts, key=lambda x: (x['apr'], x['balance'], x['id']))
    avalanche_split = []
    power_payment_amount_avalanche = payment_amount - (total_minimums - avalanche_target['minimum_payment'])
    for acc in accounts:
        if acc['id'] == avalanche_target['id']:
            avalanche_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(power_payment_amount_avalanche, 2), "type": "Power Payment"})
        else:
            avalanche_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(acc['minimum_payment'], 2), "type": "Minimum Payment"})
    # Score Booster Plan
    score_booster_target = max(accounts, key=lambda x: (x['utilization_percent'], x['balance'], x['id']))
    score_booster_split = []
    power_payment_amount_score = payment_amount - (total_minimums - score_booster_target['minimum_payment'])
    for acc in accounts:
        if acc['id'] == score_booster_target['id']:
            score_booster_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(power_payment_amount_score, 2), "type": "Power Payment"})
        else:
            score_booster_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(acc['minimum_payment'], 2), "type": "Minimum Payment"})
    # Insufficient Funds Protocol
    if payment_amount < total_minimums:
        highest_apr_card = max(accounts, key=lambda x: (x['apr'], x['balance'], x['id']))
        insufficient_split = [{"card_id": highest_apr_card['id'], "card_name": highest_apr_card['name'], "amount": round(payment_amount, 2), "type": "Power Payment"}]
        avalanche_split = insufficient_split
        score_booster_split = insufficient_split
    return {
        "avalanche_plan": {"split": avalanche_split, "target_card": avalanche_target},
        "score_booster_plan": {"split": score_booster_split, "target_card": score_booster_target},
        "is_insufficient": payment_amount < total_minimums
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
def interestkiller_v2(req: V2InterestKillerRequest):
    try:
        # 1. RUN THE ALGORITHM to get perfect math and targets
        plan_data = precompute_payment_plans(
            [acc.model_dump() for acc in req.accounts],
            req.payment_amount
        )
        # 2. CALL THE AI, giving it the pre-computed data. Its job is now just to write text.
        raw_ai_result = interestkiller_ai_hybrid(
            app.state.gemini_model,
            plan_data,
            req.user_context.model_dump()
        )
        ai_json = json.loads(raw_ai_result)
        # 3. COMBINE & VALIDATE: Merge the perfect math from the algorithm with the text from the AI.
        # This also acts as our final guardrail.
        if 'minimize_interest_explanation' not in ai_json or 'maximize_score_explanation' not in ai_json:
            raise ValueError("AI response is missing required explanation fields.")
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
        return final_response
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"AI response failed validation: {e}. Raw response: {raw_ai_result}")
        raise HTTPException(status_code=500, detail=f"AI response failed validation: {e}") 