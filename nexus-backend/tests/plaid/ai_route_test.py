import requests

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"

def test_available_routes():
    print("🔍 Testing Available Routes...")
    
    # Test the routes that are actually configured in app.js
    routes = [
        "/auth/login",
        "/plaid/accounts",
        "/cardrank",
        "/interestkiller",
        "/insights",
        "/test"
    ]
    
    for route in routes:
        try:
            print(f"Testing {route}...")
            r = requests.get(f"{API_BASE_URL}{route}")
            print(f"  Status: {r.status_code}")
            if r.status_code == 401:
                print("  ✅ Route exists (requires auth)")
            elif r.status_code == 200:
                print("  ✅ Route accessible")
            else:
                print(f"  Response: {r.text[:100]}...")
        except Exception as e:
            print(f"  Error: {e}")

def test_ai_recommendation_route():
    print("\n🎯 Testing AI Recommendation Route...")
    
    # Test the actual route that exists
    test_data = {
        "userId": 1,
        "accounts": [
            {
                "id": 1,
                "name": "Test Card",
                "balance": 5000,
                "apr": 21.49,
                "creditLimit": 15000,
                "type": "credit"
            }
        ],
        "payment_amount": 1000
    }
    
    try:
        # This is the actual route that exists in interestkiller.js
        r = requests.post(f"{API_BASE_URL}/interestkiller/pay/ai-recommendation", json=test_data)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print("✅ AI recommendation working")
            print(f"Response keys: {list(data.keys())}")
            return True
        elif r.status_code == 401:
            print("✅ Route exists but requires authentication")
            return True
        else:
            print(f"❌ Failed: {r.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_card_rank_route():
    print("\n🏆 Testing Card Rank Route...")
    
    try:
        r = requests.get(f"{API_BASE_URL}/cardrank")
        print(f"Status: {r.status_code}")
        if r.status_code == 401:
            print("✅ Card rank route exists (requires auth)")
            return True
        elif r.status_code == 200:
            print("✅ Card rank route accessible")
            return True
        else:
            print(f"❌ Failed: {r.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_interest_killer_route():
    print("\n💸 Testing Interest Killer Route...")
    
    try:
        r = requests.get(f"{API_BASE_URL}/interestkiller")
        print(f"Status: {r.status_code}")
        if r.status_code == 401:
            print("✅ Interest killer route exists (requires auth)")
            return True
        elif r.status_code == 200:
            print("✅ Interest killer route accessible")
            return True
        else:
            print(f"❌ Failed: {r.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting AI Route Test...")
    test_available_routes()
    test_ai_recommendation_route()
    test_card_rank_route()
    test_interest_killer_route()
    print("\n✅ AI Route Test completed!") 