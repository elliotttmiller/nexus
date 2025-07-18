import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from cardrank import recommend_card
from interestkiller import optimize_payment_split
from nextsmartmove import get_next_smart_move
import sentry_setup

app = FastAPI(title="Nexus AI Microservice", version="1.0")

class CardRankRequest(BaseModel):
    cards: list
    merchant: str
    category: str
    user_features: dict = {}

class InterestKillerRequest(BaseModel):
    balances: list
    aprs: list
    payment_amount: float

class NextSmartMoveRequest(BaseModel):
    user_state: dict

@app.post('/cardrank')
def cardrank(req: CardRankRequest):
    try:
        result = recommend_card(req.cards, req.merchant, req.category, req.user_features)
        return {"recommendation": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/interestkiller')
def interestkiller(req: InterestKillerRequest):
    try:
        split = optimize_payment_split(req.balances, req.aprs, req.payment_amount)
        return {"split": split}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/nextsmartmove')
def nextsmartmove(req: NextSmartMoveRequest):
    try:
        move = get_next_smart_move(req.user_state)
        return {"move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 