# 🚀 Railway Deployment Configuration Guide

## Root Cause Analysis

The Nexus app failures are caused by missing environment variable configuration in Railway deployments:

### Issue 1: "Failed to load financial data"
- **Symptom**: Mobile app shows 'Failed to load financial data' error
- **Root Cause**: Backend environment variables not properly configured on Railway
- **API Call**: Mobile app → `${API_BASE_URL}/api/plaid/accounts`
- **Status**: ✅ Endpoint exists with mock data fallback

### Issue 2: "Failed to get AI recommendations"  
- **Symptom**: Mobile app shows 'Failed to get AI recommendations' error
- **Root Cause**: Backend cannot connect to AI service - `AI_BASE_URL` not configured
- **API Call**: Mobile app → `${API_BASE_URL}/api/interestkiller/pay/ai-recommendation` → Backend → AI Service
- **Backend Code**: `aiService.js` line 10: `AI_BASE_URL || API_BASE_URL || 'http://localhost:8000'`
- **Current Behavior**: Defaults to localhost instead of Railway AI service URL

## Required Railway Environment Variables

### For nexus-backend service:
```
NODE_ENV=production
PORT=8080
DATABASE_URL=[Railway PostgreSQL URL - auto-generated]
JWT_SECRET=e19d51762a935f5e3bf94c670a535f466f12f6fa06fc1f4b3dc52ddaf733efc6
JWT_EXPIRES_IN=24h
PLAID_CLIENT_ID=6878c62f8325000026a8eb6f
PLAID_SECRET=7bf17d0cab6c264862db25dbb58516
PLAID_ENV=sandbox
AI_BASE_URL=https://nexus-ai-production.up.railway.app
SENTRY_DSN=https://6870589f945b88361cbb65079060a3ce@o4509683080822784.ingest.us.sentry.io/4509683186204672
CORS_ORIGIN=https://nexus-production-2e34.up.railway.app,http://localhost:3000
LOG_LEVEL=info
```

### For nexus-ai service:
```
GOOGLE_API_KEY=[Required for AI functionality]
SENTRY_DSN=[Optional]
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
```

## Deployment Steps

1. **Deploy nexus-ai service first**:
   - Root directory: `nexus-ai/`
   - Note the generated Railway URL (e.g., `https://nexus-ai-production.up.railway.app`)

2. **Deploy nexus-backend service**:
   - Root directory: `nexus-backend/`
   - Set `AI_BASE_URL` to the nexus-ai Railway URL from step 1
   - Add PostgreSQL database to project
   - Configure all environment variables

3. **Update mobile app**:
   - Verify `eas.json` has correct backend URL: `https://nexus-production-2e34.up.railway.app`

## Configuration Files Created

- `nexus-backend/.env` - Local development environment
- `nexus-ai/.env` - Local development environment  
- This deployment guide

## Testing Verification

Once deployed with proper environment variables:

1. **Test Backend Health**: `GET https://nexus-production-2e34.up.railway.app/`
2. **Test AI Service Health**: `GET https://nexus-ai-production.up.railway.app/health`
3. **Test Accounts API**: `GET https://nexus-production-2e34.up.railway.app/api/plaid/accounts?userId=1`
4. **Test AI Recommendations**: `POST https://nexus-production-2e34.up.railway.app/api/interestkiller/pay/ai-recommendation`

## Plaid Sandbox Configuration

The Plaid configuration is correct for sandbox testing:
- `PLAID_ENV=sandbox`
- Sandbox credentials configured
- Backend uses `PlaidEnvironments.sandbox`

Users can test with standard Plaid sandbox credentials:
- Username: `user_good`
- Password: `pass_good`