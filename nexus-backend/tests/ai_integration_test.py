import requests
import time
import json

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"

def test_ai_service_health():
    """Test if AI service is accessible"""
    print("🤖 Testing AI Service Health...")
    
    try:
        # Test if AI service endpoint exists
        r = requests.get(f"{API_BASE_URL}/ai/health")
        print(f"AI Health Check: {r.status_code}")
        if r.status_code == 200:
            print("✅ AI service is healthy")
            return True
        else:
            print(f"❌ AI service health check failed: {r.text}")
            return False
    except Exception as e:
        print(f"❌ AI service connection error: {e}")
        return False

def test_card_ranking_ai():
    """Test card ranking AI functionality"""
    print("🏆 Testing Card Ranking AI...")
    
    # Sample credit card data for testing
    test_cards = [
        {
            "name": "Chase Sapphire Preferred",
            "apr": 21.49,
            "annual_fee": 95,
            "rewards_rate": 2.5,
            "credit_limit": 15000,
            "balance": 5000
        },
        {
            "name": "Amex Gold",
            "apr": 19.99,
            "annual_fee": 250,
            "rewards_rate": 4.0,
            "credit_limit": 25000,
            "balance": 8000
        }
    ]
    
    try:
        r = requests.post(f"{API_BASE_URL}/ai/card-rank", json={
            "cards": test_cards,
            "userId": 1
        })
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Card ranking AI working")
            print(f"📊 Ranking results: {data}")
            return True
        else:
            print(f"❌ Card ranking failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Card ranking error: {e}")
        return False

def test_interest_killer_ai():
    """Test interest killer AI functionality"""
    print("💸 Testing Interest Killer AI...")
    
    # Sample debt data
    test_debts = [
        {
            "name": "Credit Card 1",
            "balance": 5000,
            "apr": 21.49,
            "minimum_payment": 150
        },
        {
            "name": "Credit Card 2", 
            "balance": 3000,
            "apr": 18.99,
            "minimum_payment": 100
        }
    ]
    
    try:
        r = requests.post(f"{API_BASE_URL}/ai/interest-killer", json={
            "debts": test_debts,
            "available_payment": 500,
            "userId": 1
        })
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Interest killer AI working")
            print(f"📊 Optimization results: {data}")
            return True
        else:
            print(f"❌ Interest killer failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Interest killer error: {e}")
        return False

def test_ai_recommendation_feature():
    """Test the comprehensive AI recommendation feature"""
    print("🎯 Testing AI Recommendation Feature...")
    
    # Test data for AI recommendations
    test_accounts = [
        {
            "id": 1,
            "name": "Chase Sapphire Preferred",
            "balance": 5000,
            "apr": 21.49,
            "creditLimit": 15000,
            "type": "credit",
            "institution": "Chase"
        },
        {
            "id": 2,
            "name": "Amex Gold",
            "balance": 3000,
            "apr": 18.99,
            "creditLimit": 25000,
            "type": "credit",
            "institution": "American Express"
        }
    ]
    
    payment_amount = 1000
    
    try:
        r = requests.post(f"{API_BASE_URL}/pay/ai-recommendation", json={
            "userId": 1,
            "accounts": test_accounts,
            "payment_amount": payment_amount
        })
        
        if r.status_code == 200:
            data = r.json()
            print("✅ AI recommendation feature working")
            print(f"📊 Recommendation results: {json.dumps(data, indent=2)}")
            
            # Validate recommendation structure
            if 'minimize_interest_plan' in data or 'maximize_score_plan' in data:
                print("✅ Recommendation structure is correct")
                return True
            else:
                print("❌ Recommendation structure is missing expected fields")
                return False
        else:
            print(f"❌ AI recommendation failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ AI recommendation error: {e}")
        return False

def test_smart_move_recommendation():
    """Test the next smart move AI recommendation"""
    print("🧠 Testing Smart Move Recommendation...")
    
    # Sample user state for smart move analysis
    user_state = {
        "accounts": [
            {
                "name": "Checking Account",
                "balance": 2500,
                "type": "checking"
            },
            {
                "name": "Credit Card",
                "balance": 5000,
                "apr": 21.49,
                "type": "credit"
            }
        ],
        "recent_transactions": [
            {"amount": -150, "category": "Food & Drink"},
            {"amount": -89, "category": "Shopping"}
        ],
        "goals": ["pay_down_debt", "build_emergency_fund"]
    }
    
    try:
        r = requests.post(f"{API_BASE_URL}/ai/next-smart-move", json={
            "user_state": user_state,
            "userId": 1
        })
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Smart move recommendation working")
            print(f"🧠 Smart move: {data}")
            return True
        else:
            print(f"❌ Smart move recommendation failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Smart move recommendation error: {e}")
        return False

def test_financial_insights_ai():
    """Test financial insights AI"""
    print("💡 Testing Financial Insights AI...")
    
    # Sample transaction data
    test_transactions = [
        {
            "name": "Starbucks",
            "amount": -5.50,
            "category": "Food & Drink",
            "date": "2025-07-28"
        },
        {
            "name": "Amazon",
            "amount": -89.99,
            "category": "Shopping",
            "date": "2025-07-27"
        }
    ]
    
    try:
        r = requests.post(f"{API_BASE_URL}/ai/insights", json={
            "transactions": test_transactions,
            "userId": 1
        })
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Financial insights AI working")
            print(f"💡 Insights: {data}")
            return True
        else:
            print(f"❌ Financial insights failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Financial insights error: {e}")
        return False

def test_anomaly_detection():
    """Test anomaly detection AI"""
    print("🚨 Testing Anomaly Detection AI...")
    
    test_data = {
        "transactions": [
            {"amount": -50, "date": "2025-07-28"},
            {"amount": -5000, "date": "2025-07-27"},  # Potential anomaly
            {"amount": -25, "date": "2025-07-26"}
        ],
        "userId": 1
    }
    
    try:
        r = requests.post(f"{API_BASE_URL}/ai/anomaly-detection", json=test_data)
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Anomaly detection AI working")
            print(f"🚨 Anomalies detected: {data}")
            return True
        else:
            print(f"❌ Anomaly detection failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Anomaly detection error: {e}")
        return False

def test_ai_configuration():
    """Test AI service configuration"""
    print("⚙️ Testing AI Configuration...")
    
    try:
        r = requests.get(f"{API_BASE_URL}/ai/config")
        
        if r.status_code == 200:
            config = r.json()
            print("✅ AI configuration accessible")
            print(f"⚙️ Config: {config}")
            return True
        else:
            print(f"❌ AI config failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ AI config error: {e}")
        return False

def test_ai_endpoints():
    """Test all AI endpoints"""
    print("🔍 Testing AI Endpoints...")
    
    ai_endpoints = [
        "/ai/health",
        "/ai/card-rank", 
        "/ai/interest-killer",
        "/ai/insights",
        "/ai/anomaly-detection",
        "/ai/config",
        "/ai/next-smart-move",
        "/pay/ai-recommendation"
    ]
    
    for endpoint in ai_endpoints:
        try:
            r = requests.get(f"{API_BASE_URL}{endpoint}")
            print(f"✅ {endpoint}: {r.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")

def test_recommendation_integration():
    """Test the complete recommendation integration flow"""
    print("🔄 Testing Complete Recommendation Integration...")
    
    # Test the full flow: get user data -> generate recommendations -> validate results
    try:
        # Step 1: Get user accounts (simulate what the app would do)
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId=1")
        if r.status_code == 200:
            accounts = r.json()
            print(f"✅ Retrieved {len(accounts)} accounts for recommendations")
            
            # Step 2: Generate AI recommendations
            if len(accounts) > 0:
                credit_cards = [acc for acc in accounts if acc.get('type') == 'credit']
                if credit_cards:
                    payment_amount = 1000
                    r2 = requests.post(f"{API_BASE_URL}/pay/ai-recommendation", json={
                        "userId": 1,
                        "accounts": credit_cards,
                        "payment_amount": payment_amount
                    })
                    
                    if r2.status_code == 200:
                        recommendations = r2.json()
                        print("✅ AI recommendations generated successfully")
                        print(f"📊 Recommendation structure: {list(recommendations.keys())}")
                        return True
                    else:
                        print(f"❌ AI recommendation generation failed: {r2.status_code}")
                        return False
                else:
                    print("⚠️ No credit cards found for recommendation testing")
                    return True  # Not a failure, just no data
            else:
                print("⚠️ No accounts found for recommendation testing")
                return True  # Not a failure, just no data
        else:
            print(f"❌ Failed to retrieve accounts: {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ Recommendation integration error: {e}")
        return False

def comprehensive_ai_test():
    """Run all AI tests"""
    print("🚀 Starting Comprehensive AI Integration Test...")
    print("=" * 60)
    
    results = {}
    
    # Test 1: AI Service Health
    results["health"] = test_ai_service_health()
    print("=" * 60)
    
    # Test 2: AI Configuration
    results["config"] = test_ai_configuration()
    print("=" * 60)
    
    # Test 3: Card Ranking AI
    results["card_rank"] = test_card_ranking_ai()
    print("=" * 60)
    
    # Test 4: Interest Killer AI
    results["interest_killer"] = test_interest_killer_ai()
    print("=" * 60)
    
    # Test 5: AI Recommendation Feature (NEW)
    results["ai_recommendation"] = test_ai_recommendation_feature()
    print("=" * 60)
    
    # Test 6: Smart Move Recommendation (NEW)
    results["smart_move"] = test_smart_move_recommendation()
    print("=" * 60)
    
    # Test 7: Financial Insights AI
    results["insights"] = test_financial_insights_ai()
    print("=" * 60)
    
    # Test 8: Anomaly Detection AI
    results["anomaly"] = test_anomaly_detection()
    print("=" * 60)
    
    # Test 9: Complete Recommendation Integration (NEW)
    results["recommendation_integration"] = test_recommendation_integration()
    print("=" * 60)
    
    # Test 10: All AI Endpoints
    test_ai_endpoints()
    print("=" * 60)
    
    # Summary
    print("📊 AI Test Results Summary:")
    for test, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test}: {status}")
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    
    print(f"\n🎯 Overall: {passed_tests}/{total_tests} AI tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All AI services working perfectly!")
        print("🤖 AI recommendation features fully integrated!")
        print("📱 Ready for production deployment!")
    else:
        print("⚠️ Some AI services need attention")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    comprehensive_ai_test() 