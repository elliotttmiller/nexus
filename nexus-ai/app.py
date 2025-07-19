import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from cardrank import advanced_card_recommendation
from interestkiller import advanced_payment_split
from nextsmartmove import dynamic_next_smart_move

# Railway/production: Write GOOGLE_CREDENTIALS_JSON to a file and set GOOGLE_APPLICATION_CREDENTIALS
if os.environ.get("GOOGLE_CREDENTIALS_JSON"):
    creds_path = "/tmp/google_creds.json"
    with open(creds_path, "w") as f:
        f.write(os.environ["GOOGLE_CREDENTIALS_JSON"])
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

app = FastAPI(
    title="Nexus Cortex AI v2",
    description="Advanced, API-driven financial optimization microservice.",
    version="2.0.0"
)

class Card(BaseModel):
    id: str
    name: str
    balance: float
    creditLimit: float
    apr: float
    utilization: float = Field(..., description="Calculated as balance / creditLimit")
    rewards: Dict[str, float] = Field(default_factory=dict, description="e.g., {'Dining': 4.0, 'default': 1.0}")
    point_value_cents: float = Field(default=1.0, description="Value of one point in cents")
    signup_bonus_progress: Optional[Dict[str, Any]] = None

class TransactionContext(BaseModel):
    merchantName: str
    amount: float
    location: Optional[str] = None

class UserContext(BaseModel):
    primaryGoal: str = Field(..., description="e.g., MAXIMIZE_CREDIT_SCORE")
    creditScoreInfo: Optional[Dict[str, Any]] = None

class V2CardRankRequest(BaseModel):
    user_cards: List[Card]
    transaction_context: TransactionContext
    user_context: UserContext

class Account(BaseModel):
    id: str
    balance: float
    apr: float
    creditLimit: float
    promoAPR: Optional[float] = None
    promoEndDate: Optional[str] = None

class V2InterestKillerRequest(BaseModel):
    accounts: List[Account]
    payment_amount: float
    optimization_goal: str

class V2NextSmartMoveRequest(BaseModel):
    user_state: Dict[str, Any]

@app.post('/v2/cardrank', summary="Advanced Card Recommendation")
def cardrank_v2(req: V2CardRankRequest):
    try:
        result = advanced_card_recommendation(
            [c.dict() for c in req.user_cards],
            req.transaction_context.dict(),
            req.user_context.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

@app.post('/v2/interestkiller', summary="Goal-Oriented Payment Optimization")
def interestkiller_v2(req: V2InterestKillerRequest):
    try:
        split = advanced_payment_split(
            [acc.dict() for acc in req.accounts],
            req.payment_amount,
            req.optimization_goal
        )
        return {"split": split}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

@app.post('/v2/nextsmartmove', summary="Dynamic, AI-Generated User Guidance")
def nextsmartmove_v2(req: V2NextSmartMoveRequest):
    try:
        move = dynamic_next_smart_move(req.user_state)
        return {"move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {e}")

@app.get("/", summary="Health Check")
def read_root():
    return {"status": "Nexus Cortex AI v2 is operational"}

@app.get("/health")
def health():
    return {"status": "ok"} 