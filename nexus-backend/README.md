# Nexus Backend

## Overview
Node.js/Express backend for the Nexus AI-powered credit optimization platform.

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Set up environment variables in `.env`:
   ```
   PORT=5000
   DATABASE_URL=postgres://user:password@localhost:5432/nexusdb
   JWT_SECRET=your_jwt_secret
   AI_BASE_URL=http://localhost:8000
   ```
3. Run database migrations:
   ```sh
   psql -d nexusdb -f schema.sql
   ```
4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user
- `POST /api/auth/2fa/setup` — Setup 2FA
- `POST /api/auth/2fa/verify` — Verify 2FA
- `POST /api/cardrank/recommend` — Get card recommendation (AI-driven)
- `POST /api/interestkiller/suggest` — Get payment split suggestion (AI-driven)
- `GET /api/plaid/accounts` — Get linked accounts
- `GET /api/plaid/transactions` — Get transactions
- `GET /api/users/profile` — Get user profile
- `PUT /api/users/profile` — Update user profile
- `GET /api/users/data-access` — List linked accounts
- `DELETE /api/users/data-access/:accountId` — Revoke account access

## Example Request
```sh
curl -X POST http://localhost:5000/api/cardrank/recommend \
  -H 'Content-Type: application/json' \
  -d '{"userId":1, "merchant":"Amazon", "category":"shopping"}'
``` 