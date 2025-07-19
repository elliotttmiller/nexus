import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

client = TestClient(app)

def test_cardrank_v2():
    payload = {
        "user_cards": [
            {
                "id": "card1",
                "name": "Chase Sapphire Preferred",
                "balance": 500.0,
                "creditLimit": 5000.0,
                "apr": 20.99,
                "utilization": 0.1,
                "rewards": {"Dining": 2.0, "default": 1.0},
                "point_value_cents": 1.25,
                "signup_bonus_progress": {"spend_needed": 4000, "bonus_value": 600}
            }
        ],
        "transaction_context": {
            "merchantName": "Starbucks",
            "amount": 7.50,
            "location": "New York, NY"
        },
        "user_context": {
            "primaryGoal": "MAXIMIZE_CASHBACK",
            "creditScoreInfo": {"score": 750, "utilization": 0.25}
        }
    }
    response = client.post("/v2/cardrank", json=payload)
    print(response.text)
    assert response.status_code == 200
    data = response.json()
    assert "recommended_card" in data
    assert "reason" in data

def test_interestkiller_v2():
    payload = {
        "accounts": [
            {"id": "card1", "balance": 1000.0, "apr": 24.99, "creditLimit": 5000.0, "promoAPR": 0.0, "promoEndDate": None},
            {"id": "card2", "balance": 500.0, "apr": 17.99, "creditLimit": 3000.0, "promoAPR": 17.99, "promoEndDate": None}
        ],
        "payment_amount": 300.0,
        "optimization_goal": "MINIMIZE_INTEREST_COST"
    }
    response = client.post("/v2/interestkiller", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "split" in data
    assert isinstance(data["split"], list)

def test_nextsmartmove_v2():
    payload = {
        "user_state": {
            "creditScore": 720,
            "totalDebt": 5000.0,
            "primaryGoal": "MAXIMIZE_CREDIT_SCORE",
            "accounts": [
                {"name": "Chase Sapphire Preferred", "balance": 500.0, "apr": 20.99, "utilization": 0.1, "isPromoActive": False}
            ],
            "insights": ["Spent 20% less on dining this month"],
            "upcomingGoals": ["Save for Vacation"]
        }
    }
    response = client.post("/v2/nextsmartmove", json=payload)
    print(response.text)
    assert response.status_code == 200
    data = response.json()
    assert "move" in data
    assert "title" in data["move"]
    assert "description" in data["move"] 