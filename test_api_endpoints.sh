#!/bin/bash

# Nexus API Test Script
# Tests the critical endpoints that were failing in the mobile app

echo "🚀 Testing Nexus API Endpoints"
echo "================================"

# Configuration
BACKEND_URL="https://nexus-production-2e34.up.railway.app"
AI_URL="https://nexus-ai-production.up.railway.app"
LOCAL_BACKEND="http://localhost:8080"
LOCAL_AI="http://localhost:8000"

# Test function
test_endpoint() {
    local url=$1
    local name=$2
    local method=${3:-GET}
    local data=$4
    
    echo "Testing: $name"
    echo "URL: $url"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$url" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ SUCCESS ($http_code)"
    else
        echo "❌ FAILED ($http_code)"
    fi
    
    echo "Response: $(echo "$body" | head -c 200)..."
    echo ""
}

echo "Testing Railway Deployment URLs:"
echo "================================="

# Test 1: Backend Health Check
test_endpoint "$BACKEND_URL/" "Backend Health Check"

# Test 2: AI Service Health Check  
test_endpoint "$AI_URL/health" "AI Service Health Check"

# Test 3: Accounts API (the failing endpoint)
test_endpoint "$BACKEND_URL/api/plaid/accounts?userId=1" "Plaid Accounts API"

# Test 4: AI Recommendations (the other failing endpoint)
ai_test_data='{
  "userId": 1,
  "accounts": [
    {
      "id": "mock_chase_1",
      "name": "Chase Sapphire Preferred", 
      "balance": 5000,
      "apr": 21.49,
      "creditLimit": 15000,
      "type": "credit"
    },
    {
      "id": "mock_amex_1",
      "name": "American Express Gold",
      "balance": 3000, 
      "apr": 18.99,
      "creditLimit": 25000,
      "type": "credit"
    }
  ],
  "payment_amount": 1000
}'

test_endpoint "$BACKEND_URL/api/interestkiller/pay/ai-recommendation" "AI Recommendations API" "POST" "$ai_test_data"

echo "🔍 Testing Local Development URLs (if running):"
echo "==============================================="

# Test local endpoints if they exist
test_endpoint "$LOCAL_BACKEND/" "Local Backend Health"
test_endpoint "$LOCAL_AI/health" "Local AI Service Health"

echo "📋 Summary:"
echo "==========="
echo "If Railway deployments show ✅ SUCCESS, the configuration fix worked!"
echo "If they show ❌ FAILED, check Railway environment variables."
echo ""
echo "Required Railway Environment Variables:"
echo "nexus-backend: AI_BASE_URL=$AI_URL"
echo "nexus-ai: GOOGLE_API_KEY=[required]"