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
async def interestkiller_v2(req: V2InterestKillerRequest, request: Request):
    import logging
    import traceback
    logger = logging.getLogger("nexus-ai-debug")
    try:
        raw_body = await request.body()
        logger.info(f"DEBUG: Raw request body: {raw_body.decode('utf-8')}")
    except Exception as e:
        logger.error(f"DEBUG: Could not log raw request body: {e}")
    try:
        logger.info(f"DEBUG: Parsed request: {req}")
        logger.info(f"DEBUG: payment_amount: {req.payment_amount}")
        logger.info(f"DEBUG: user_context: {req.user_context}")
        for idx, acc in enumerate(req.accounts):
            logger.info(f"DEBUG: Account {idx}: {acc}")
    except Exception as e:
        logger.error(f"DEBUG: Could not log parsed request details: {e}")
    try:
        # --- HYBRID AI-AUGMENTED SYSTEM ---
        accounts_data = [acc.model_dump() for acc in req.accounts]
        user_context_data = req.user_context.model_dump()
        precomputed_data = precompute_financial_data(accounts_data, req.payment_amount)
        persona_instruction = select_persona(user_context_data, accounts_data)
        raw_ai_result = interestkiller_ai_hybrid(
            app.state.gemini_model,
            precomputed_data,
            req.payment_amount,
            user_context_data,
            persona_instruction=persona_instruction
        )
        logger.info(f"DEBUG: AI raw result: {raw_ai_result}")
        ai_json = json.loads(raw_ai_result)
        # --- GUARDRAILS START ---
        plan_keys = ["minimize_interest_plan", "maximize_score_plan"]
        for key in plan_keys:
            if key not in ai_json:
                logger.error(f"AI response missing required plan key: '{key}'.")
                raise ValueError(f"AI response missing required plan key: '{key}'.")
        for key in plan_keys:
            plan_data = ai_json[key]
            if not isinstance(plan_data, dict):
                logger.error(f"Plan '{key}' is not a valid object.")
                raise ValueError(f"Plan '{key}' is not a valid object.")
            required_sub_keys = ['name', 'split', 'explanation', 'projected_outcome']
            if not all(sub_key in plan_data for sub_key in required_sub_keys):
                logger.error(f"Plan '{key}' is missing required sub-keys (e.g., 'projected_outcome').")
                raise ValueError(f"Plan '{key}' is missing required sub-keys (e.g., 'projected_outcome').")
            split = plan_data.get("split")
            if not isinstance(split, list):
                logger.error(f"Plan '{key}' has an invalid 'split' array.")
                raise ValueError(f"Plan '{key}' has an invalid 'split' array.")
            total_allocated = sum(item.get('amount', 0) for item in split)
            # --- Backend nudge for minor math errors ---
            diff = req.payment_amount - total_allocated
            if abs(diff) < 1.0 and len(split) > 0:
                split[-1]['amount'] += diff
                total_allocated = sum(item.get('amount', 0) for item in split)
            if not math.isclose(total_allocated, req.payment_amount, rel_tol=1e-2):
                logger.error(f"AI MATH FAILURE in plan '{key}'. Expected: {req.payment_amount}, AI allocated: {total_allocated}")
                raise ValueError(f"AI failed to correctly allocate the total payment amount for plan '{key}'.")
            for item in split:
                if not all(k in item for k in ['card_id', 'card_name', 'amount', 'type']):
                    logger.error(f"An item in the '{key}' split is missing required keys.")
                    raise ValueError(f"An item in the '{key}' split is missing required keys.")
        recommendation = ai_json.get("nexus_recommendation")
        if not recommendation or recommendation not in [ai_json[key].get("name") for key in plan_keys]:
            logger.error(f"Invalid 'nexus_recommendation' value: '{recommendation}'. It must match one of the plan names.")
            raise ValueError(f"Invalid 'nexus_recommendation' value: '{recommendation}'. It must match one of the plan names.")
        # --- GUARDRAILS END ---
        return ai_json
    except Exception as e:
        logger.error(f"UNEXPECTED ERROR: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}") 