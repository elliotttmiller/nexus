import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

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
from services import categorize_transactions_ai, detect_anomalies_ai, spending_insights_ai, budget_health_ai, cash_flow_prediction_ai

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
    optimization_goal: str

@app.get("/", summary="Health Check")
def root():
    return {"status": "ok", "ai_model_status": "loaded" if app.state.gemini_model else "initialization_failed"}

@app.get("/health", summary="Health Check (platform)")
def health():
    return {"status": "ok"}

@app.post("/v2/categorize")
def categorize_v2(req: TransactionRequest):
    try:
        # Pass the gemini_model from the app's state, matching the new function signature
        result = categorize_transactions_ai(app.state.gemini_model, req.model_dump().get('transactions'))
        return {"result": json.loads(result)}
    except Exception as e:
        logger.error(f"Error in /v2/categorize: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/v2/anomalies")
def anomalies_v2(req: TransactionRequest):
    try:
        result = detect_anomalies_ai(app.state.gemini_model, req.model_dump().get('transactions'))
        return {"result": json.loads(result)}
    except Exception as e:
        logger.error(f"Error in /v2/anomalies: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

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
        from interestkiller import advanced_payment_split
        result = advanced_payment_split(
            [acc.model_dump() for acc in req.accounts],
            req.payment_amount,
            req.optimization_goal
        )
        return result
    except Exception as e:
        logger.error(f"Error in /v2/interestkiller: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 