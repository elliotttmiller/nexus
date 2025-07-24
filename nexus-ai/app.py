import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import math

# --- 1. Load Environment & Basic Config ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- 2. Lifespan & App Creation ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("INFO: FastAPI startup event triggered.")
    from services import initialize_model
    app.state.gemini_model = initialize_model()
    yield
    print("INFO: FastAPI shutdown event triggered.")

app = FastAPI(title="Nexus Cortex AI - Strategist Engine", version="10.0.0-final", lifespan=lifespan)

# --- 3. Import AI Communication Service ---
from services import interestkiller_ai_hybrid

# --- 4. THE MISSING ALGORITHM ---
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
        if acc['balance'] > 0 and discretionary_payment >= acc['balance']:
            payment = acc['balance']
            avalanche_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(payment, 2), "type": "Payoff"})
            # The same payoff applies to both plans as it's a priority move
            discretionary_payment -= payment
            paid_off_cards.append(acc)
            processed_card_ids.add(acc['id'])
    # Create a unified score booster split after payoffs
    score_booster_split.extend(avalanche_split)

    remaining_cards = [acc for acc in accounts if acc['id'] not in processed_card_ids]

    # 2b: Strategic Skip Opportunity (Ignore 0% APR cards)
    cards_requiring_minimums = []
    for acc in remaining_cards:
        if acc['apr'] > 0:
            cards_requiring_minimums.append(acc)
        else:
            skipped_cards.append(acc)
            avalanche_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": 0.00, "type": "Strategic Skip"})
            score_booster_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": 0.00, "type": "Strategic Skip"})

    # --- Phase 3: Core Strategic Allocation ---
    if cards_requiring_minimums and discretionary_payment > 0:
        total_remaining_minimums = sum(acc['minimum_payment'] for acc in cards_requiring_minimums)

        # Avalanche Logic
        avalanche_target = max(cards_requiring_minimums, key=lambda x: (x['apr'], x['balance'], x['id']))
        power_payment_avalanche = discretionary_payment - (total_remaining_minimums - avalanche_target['minimum_payment'])
        for acc in cards_requiring_minimums:
            amount = power_payment_avalanche if acc['id'] == avalanche_target['id'] else acc['minimum_payment']
            avalanche_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(amount, 2), "type": "Power Payment" if acc['id'] == avalanche_target['id'] else "Minimum Payment"})

        # Score Booster Logic
        score_booster_target = max(cards_requiring_minimums, key=lambda x: (x['utilization_percent'], x['balance'], x['id']))
        power_payment_score = discretionary_payment - (total_remaining_minimums - score_booster_target['minimum_payment'])
        for acc in cards_requiring_minimums:
            amount = power_payment_score if acc['id'] == score_booster_target['id'] else acc['minimum_payment']
            score_booster_split.append({"card_id": acc['id'], "card_name": acc['name'], "amount": round(amount, 2), "type": "Power Payment" if acc['id'] == score_booster_target['id'] else "Minimum Payment"})

    # --- Phase 4: Construct Final Data Dossier for AI ---
    return {
        "avalanche_plan": {"split": avalanche_split},
        "score_booster_plan": {"split": score_booster_split},
        "context": {
            "paid_off_cards": [c['name'] for c in paid_off_cards],
            "skipped_cards": [c['name'] for c in skipped_cards]
        }
    }

# --- 5. Pydantic Models ---
class Account(BaseModel):
    id: str
    name: str
    balance: float
    apr: float
    creditLimit: float
    promo_apr_expiry_date: Optional[str] = None

class UserFinancialContext(BaseModel):
    primary_goal: str
    total_debt_last_month: Optional[float] = None
    last_plan_chosen: Optional[str] = None

class V2InterestKillerRequest(BaseModel):
    accounts: List[Account]
    payment_amount: float
    user_context: UserFinancialContext

# --- 6. API Endpoints ---
@app.get("/", summary="Health Check")
def root():
    return {"status": "ok", "ai_model_status": "loaded" if hasattr(app.state, 'gemini_model') and app.state.gemini_model else "initialization_failed"}

@app.get("/health", summary="Health Check")
def health():
    return {"status": "ok"}


@app.post('/v2/interestkiller')
async def interestkiller_v2(req: V2InterestKillerRequest):
    try:
        # This call will now succeed because the function is defined above
        plan_data = precompute_payment_plans_sophisticated(
            [acc.model_dump() for acc in req.accounts], 
            req.payment_amount
        )
        
        raw_ai_result = interestkiller_ai_hybrid(
            app.state.gemini_model,
            plan_data,
            req.user_context.model_dump()
        )
        # Patch: Fix invalid \$ escape in AI response before JSON parsing
        if isinstance(raw_ai_result, str):
            raw_ai_result = raw_ai_result.replace(r'\\$', '$').replace(r'\$', '$')
        ai_json = json.loads(raw_ai_result)

        # Validate that the AI returned the text we need
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
    except Exception as e:
        logger.error(f"An unexpected error occurred in interestkiller_v2: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected internal server error occurred.") 