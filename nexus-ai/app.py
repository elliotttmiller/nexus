import os
import sys
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from cardrank import advanced_card_recommendation
from interestkiller import advanced_payment_split
from nextsmartmove import dynamic_next_smart_move

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger("nexus-ai-debug")

logger.debug("Starting Nexus AI FastAPI app...")

# Railway/production: Write GOOGLE_CREDENTIALS_JSON to a file and set GOOGLE_APPLICATION_CREDENTIALS
if os.environ.get("GOOGLE_CREDENTIALS_JSON"):
    creds_path = "/tmp/google_creds.json"
    with open(creds_path, "w") as f:
        f.write(os.environ["GOOGLE_CREDENTIALS_JSON"])
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

app = FastAPI(
    title="Nexus AI Service",
    description="AI-powered financial optimization endpoints.",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    logger.debug("FastAPI app startup complete. ENV: %s", os.environ)

# --- CardRank Endpoint ---
class Card(BaseModel):
    id: int
    name: str
    balance: float
    creditLimit: float
    apr: float
    utilization: float
    rewards: Dict[str, float] = {}
    point_value_cents: float = 1.0
    signup_bonus_progress: Any = None

class TransactionContext(BaseModel):
    merchantName: str
    amount: float
    location: str = None

class UserContext(BaseModel):
    primaryGoal: str
    creditScoreInfo: Dict[str, Any] = None

class CardRankRequest(BaseModel):
    user_cards: List[Card]
    transaction_context: TransactionContext
    user_context: UserContext

@app.post("/v2/cardrank")
def cardrank_v2(req: CardRankRequest):
    try:
        result = advanced_card_recommendation(
            [c.dict() for c in req.user_cards],
            req.transaction_context.dict(),
            req.user_context.dict()
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CardRank error: {e}")

# --- InterestKiller Endpoint ---
class Account(BaseModel):
    id: int
    balance: float
    apr: float
    creditLimit: float
    promoAPR: float = None
    promoEndDate: str = None

class InterestKillerRequest(BaseModel):
    accounts: List[Account]
    payment_amount: float
    optimization_goal: str

@app.post("/v2/interestkiller")
def interestkiller_v2(req: InterestKillerRequest):
    try:
        split = advanced_payment_split(
            [acc.dict() for acc in req.accounts],
            req.payment_amount,
            req.optimization_goal
        )
        return {"split": split}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"InterestKiller error: {e}")

# --- NextSmartMove Endpoint ---
class NextSmartMoveRequest(BaseModel):
    user_state: Dict[str, Any]

@app.post("/v2/nextsmartmove")
def nextsmartmove_v2(req: NextSmartMoveRequest):
    try:
        move = dynamic_next_smart_move(req.user_state)
        return {"move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NextSmartMove error: {e}") 