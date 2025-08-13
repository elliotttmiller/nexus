# Nexus AI Microservice

## Overview
FastAPI-based microservice for AI-driven credit optimization logic (CardRank, Interest Killer, Next Smart Move).

## Setup
1. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Run the service:
   ```sh
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

## Endpoints
- `POST /v2/cardrank` — Card recommendation
- `POST /v2/interestkiller` — Payment split optimization
- `POST /v2/interestkiller/re-explain` — Re-explain payment split
- `POST /v2/spending-insights` — Spending insights
- `POST /v2/budget-health` — Budget health analysis
- `POST /v2/cash-flow-prediction` — Cash flow prediction

## Example Request
```sh
curl -X POST http://localhost:8000/cardrank \
  -H 'Content-Type: application/json' \
  -d '{"cards": [...], "merchant": "Amazon", "category": "shopping", "user_features": {}}'
```