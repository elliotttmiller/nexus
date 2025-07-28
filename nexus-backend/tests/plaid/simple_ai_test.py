import requests

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"

def test_ai_endpoints():
    print("🔍 Testing AI Endpoints...")
    
    endpoints = [
        "/ai/health",
        "/ai/card-rank", 
        "/ai/interest-killer",
        "/ai/insights",
        "/ai/anomaly-detection",
        "/ai/config",
        "/ai/next-smart-move",
        "/pay/ai-recommendation"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"Testing {endpoint}...")
            r = requests.get(f"{API_BASE_URL}{endpoint}")
            print(f"  Status: {r.status_code}")
            if r.status_code != 200:
                print(f"  Response: {r.text[:100]}...")
        except Exception as e:
            print(f"  Error: {e}")

def test_ai_recommendation():
    print("\n🎯 Testing AI Recommendation...")
    
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
        r = requests.post(f"{API_BASE_URL}/pay/ai-recommendation", json=test_data)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print("✅ AI recommendation working")
            print(f"Response keys: {list(data.keys())}")
        else:
            print(f"❌ Failed: {r.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Simple AI Test...")
    test_ai_endpoints()
    test_ai_recommendation()
    print("\n✅ Test completed!") 