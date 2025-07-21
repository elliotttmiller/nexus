import os
import sys
import logging
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from cardrank import advanced_card_recommendation
from interestkiller import advanced_payment_split
from nextsmartmove import dynamic_next_smart_move
from services import categorize_transactions_ai, detect_anomalies_ai
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger("nexus-ai-debug")

logger.debug("Starting Nexus AI FastAPI app...")

# Railway/production: Write GOOGLE_CREDENTIALS_JSON to a file and set GOOGLE_APPLICATION_CREDENTIALS
if os.environ.get("GOOGLE_CREDENTIALS_JSON"):
    creds_path = "/tmp/google_creds.json"
    with open(creds_path, "w") as f:
        f.write(os.environ["GOOGLE_CREDENTIALS_JSON"])
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

app = FastAPI()

# Add CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. For production, restrict this.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"status": "ok"}

# --- Pydantic Models ---
class CardModel(BaseModel):
    id: str
    name: str
    balance: float
    creditLimit: float
    apr: float
    utilization: float
    rewards: Dict[str, float]
    point_value_cents: float
    signup_bonus_progress: Optional[Dict[str, float]] = None

class CardRankRequest(BaseModel):
    user_cards: List[CardModel]
    transaction_context: Dict
    user_context: Dict

class AccountModel(BaseModel):
    id: str
    balance: float
    apr: float
    creditLimit: float
    promoAPR: Optional[float] = None
    promoEndDate: Optional[str] = None

class InterestKillerRequest(BaseModel):
    accounts: List[AccountModel]
    payment_amount: float
    optimization_goal: str

class NextSmartMoveRequest(BaseModel):
    user_state: Dict

class TransactionModel(BaseModel):
    id: str
    amount: float
    merchant: str
    date: str
    # Add other fields as needed

# --- Endpoints ---
@app.post("/v2/cardrank")
def cardrank_v2(req: CardRankRequest):
    try:
        result = advanced_card_recommendation(
            [card.model_dump() for card in req.user_cards],
            req.transaction_context,
            req.user_context
        )
        return result
    except Exception as e:
        logger.exception("Error in /v2/cardrank")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v2/interestkiller")
def interestkiller_v2(req: InterestKillerRequest):
    try:
        split = advanced_payment_split(
            [acc.model_dump() for acc in req.accounts],
            req.payment_amount,
            req.optimization_goal
        )
        return {"split": split}
    except Exception as e:
        logger.exception("Error in /v2/interestkiller")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v2/nextsmartmove")
def nextsmartmove_v2(req: NextSmartMoveRequest):
    try:
        move = dynamic_next_smart_move(req.user_state)
        return {"move": move}
    except Exception as e:
        logger.exception("Error in /v2/nextsmartmove")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v2/categorize")
def categorize_v2(transactions: List[TransactionModel] = Body(...)):
    try:
        tx_dicts = [tx.model_dump() for tx in transactions]
        result = categorize_transactions_ai(tx_dicts)
        return result
    except Exception as e:
        logger.exception("Error in /v2/categorize")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v2/anomalies")
def anomalies_v2(transactions: List[TransactionModel] = Body(...)):
    try:
        tx_dicts = [tx.model_dump() for tx in transactions]
        result = detect_anomalies_ai(tx_dicts)
        return result
    except Exception as e:
        logger.exception("Error in /v2/anomalies")
        raise HTTPException(status_code=500, detail=str(e)) 