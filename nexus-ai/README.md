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
- `POST /cardrank` — Card recommendation
- `POST /interestkiller` — Payment split optimization
- `POST /nextsmartmove` — Next best action

## Example Request
```sh
curl -X POST http://localhost:8000/cardrank \
  -H 'Content-Type: application/json' \
  -d '{"cards": [...], "merchant": "Amazon", "category": "shopping", "user_features": {}}'
``` 