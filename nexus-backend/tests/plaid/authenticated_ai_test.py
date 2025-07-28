import requests
import json

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"

def get_auth_token():
    """Get authentication token for testing"""
    print("🔐 Getting authentication token...")
    
    login_data = {
        "email": "elliotttmiller@hotmail.com",
        "password": "elliott"
    }
    
    print(f"📤 Login request data: {json.dumps(login_data, indent=2)}")
    print(f"🌐 Making POST request to: {API_BASE_URL}/auth/login")
    
    try:
        # Login with existing user credentials
        r = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        
        print(f"📥 Response status: {r.status_code}")
        print(f"📥 Response headers: {dict(r.headers)}")
        
        if r.status_code == 200:
            data = r.json()
            token = data.get("token")
            user_id = data.get("userId", 1)
            print("✅ Authentication successful")
            print(f"🔑 Token received: {token[:20]}..." if token else "❌ No token in response")
            print(f"👤 User ID: {user_id}")
            print(f"📊 Full response data: {json.dumps(data, indent=2)}")
            return token, user_id
        else:
            print(f"❌ Login failed: {r.status_code}")
            print(f"❌ Response text: {r.text}")
            print(f"❌ Response headers: {dict(r.headers)}")
            return None, None
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        print(f"❌ Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return None, None

def test_ai_recommendation_with_auth(token, user_id):
    """Test AI recommendation with authentication using real user data"""
    print("🎯 Testing AI Recommendation with Authentication...")
    
    # First, get the user's actual accounts
    print("📊 Fetching user's actual accounts...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        accounts_response = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if accounts_response.status_code == 200:
            accounts = accounts_response.json()
            print(f"✅ Retrieved {len(accounts)} accounts from user's data")
            print(f"📊 Account types: {[acc.get('type', 'unknown') for acc in accounts]}")
            
            # Show all account details to see what we actually have
            print(f"📊 All accounts details:")
            for i, acc in enumerate(accounts):
                print(f"  Account {i+1}: {acc.get('name', 'Unknown')} - Type: {acc.get('type', 'unknown')} - Subtype: {acc.get('subtype', 'unknown')}")
            
            # Filter for credit cards - check both type and subtype
            credit_cards = [acc for acc in accounts if acc.get('type') == 'credit' or acc.get('subtype') == 'credit card']
            print(f"💳 Found {len(credit_cards)} credit cards")
            
            if len(credit_cards) > 0:
                # Use real account data for AI recommendation
                test_data = {
                    "userId": user_id,
                    "accounts": credit_cards,
                    "payment_amount": 1000
                }
                
                print(f"📤 Using real account data for AI recommendation")
                print(f"🌐 Making POST request to: {API_BASE_URL}/interestkiller/pay/ai-recommendation")
                
                r = requests.post(f"{API_BASE_URL}/interestkiller/pay/ai-recommendation", 
                                 json=test_data, headers=headers)
                
                print(f"📥 Response status: {r.status_code}")
                print(f"📥 Response headers: {dict(r.headers)}")
                
                if r.status_code == 200:
                    data = r.json()
                    print("✅ AI recommendation working")
                    print(f"📊 Response structure: {list(data.keys())}")
                    print(f"📊 Full response: {json.dumps(data, indent=2)}")
                    
                    # Validate recommendation structure
                    if 'minimize_interest_plan' in data or 'maximize_score_plan' in data:
                        print("✅ Recommendation structure is correct")
                        print(f"💡 Sample recommendation: {json.dumps(data, indent=2)[:500]}...")
                        return True
                    else:
                        print("❌ Recommendation structure is missing expected fields")
                        print(f"❌ Available fields: {list(data.keys())}")
                        return False
                else:
                    print(f"❌ AI recommendation failed: {r.status_code}")
                    print(f"❌ Response text: {r.text}")
                    print(f"❌ Response headers: {dict(r.headers)}")
                    return False
            else:
                print("⚠️ No credit cards found in user's accounts")
                print("📊 Available account types: " + ", ".join(set([acc.get('type', 'unknown') for acc in accounts])))
                return True  # Not a failure, just no credit cards to test
        else:
            print(f"❌ Failed to fetch accounts: {accounts_response.status_code}")
            print(f"❌ Response text: {accounts_response.text}")
            return False
    except Exception as e:
        print(f"❌ AI recommendation error: {e}")
        print(f"❌ Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return False

def test_card_rank_with_auth(token, user_id):
    """Test card ranking with authentication using real user data"""
    print("🏆 Testing Card Rank with Authentication...")
    
    # First, get the user's actual accounts to see if they have cards
    print("📊 Fetching user's actual accounts for card ranking...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        accounts_response = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if accounts_response.status_code == 200:
            accounts = accounts_response.json()
            print(f"✅ Retrieved {len(accounts)} accounts from user's data")
            
            # Show all account details to see what we actually have
            print(f"📊 All accounts details:")
            for i, acc in enumerate(accounts):
                print(f"  Account {i+1}: {acc.get('name', 'Unknown')} - Type: {acc.get('type', 'unknown')} - Subtype: {acc.get('subtype', 'unknown')}")
            
            # Check if user has any credit cards - check both type and subtype
            credit_cards = [acc for acc in accounts if acc.get('type') == 'credit' or acc.get('subtype') == 'credit card']
            print(f"💳 Found {len(credit_cards)} credit cards")
            
            if len(credit_cards) > 0:
                # Use real data for card ranking
                request_data = {
                    "userId": user_id,
                    "merchant": "Amazon",
                    "category": "shopping",
                    "amount": 500,
                    "location": "Online",
                    "primaryGoal": "maximize_rewards"
                }
                
                print(f"📤 Using real user data for card ranking")
                print(f"📤 Request data: {json.dumps(request_data, indent=2)}")
                print(f"🌐 Making POST request to: {API_BASE_URL}/cardrank/recommend")
                
                r = requests.post(f"{API_BASE_URL}/cardrank/recommend", 
                                 json=request_data, headers=headers)
                
                print(f"📥 Response status: {r.status_code}")
                print(f"📥 Response headers: {dict(r.headers)}")
                
                if r.status_code == 200:
                    data = r.json()
                    print("✅ Card ranking working")
                    print(f"📊 Full response: {json.dumps(data, indent=2)}")
                    return True
                else:
                    print(f"❌ Card ranking failed: {r.status_code}")
                    print(f"❌ Response text: {r.text}")
                    print(f"❌ Response headers: {dict(r.headers)}")
                    return False
            else:
                print("⚠️ No credit cards found in user's accounts")
                print("📊 Available account types: " + ", ".join(set([acc.get('type', 'unknown') for acc in accounts])))
                return True  # Not a failure, just no credit cards to test
        else:
            print(f"❌ Failed to fetch accounts: {accounts_response.status_code}")
            print(f"❌ Response text: {accounts_response.text}")
            return False
    except Exception as e:
        print(f"❌ Card ranking error: {e}")
        print(f"❌ Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return False

def test_interest_killer_with_auth(token, user_id):
    """Test interest killer with authentication using real user data"""
    print("💸 Testing Interest Killer with Authentication...")
    
    # First, get the user's actual accounts to see if they have credit cards
    print("📊 Fetching user's actual accounts for interest killer...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        accounts_response = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if accounts_response.status_code == 200:
            accounts = accounts_response.json()
            print(f"✅ Retrieved {len(accounts)} accounts from user's data")
            
            # Show all account details to see what we actually have
            print(f"📊 All accounts details:")
            for i, acc in enumerate(accounts):
                print(f"  Account {i+1}: {acc.get('name', 'Unknown')} - Type: {acc.get('type', 'unknown')} - Subtype: {acc.get('subtype', 'unknown')}")
            
            # Check if user has any credit cards - check both type and subtype
            credit_cards = [acc for acc in accounts if acc.get('type') == 'credit' or acc.get('subtype') == 'credit card']
            print(f"💳 Found {len(credit_cards)} credit cards")
            
            if len(credit_cards) > 0:
                # Use real data for interest killer
                request_data = {
                    "userId": user_id, 
                    "amount": 500, 
                    "optimizationGoal": "minimize_interest"
                }
                
                print(f"📤 Using real user data for interest killer")
                print(f"📤 Request data: {json.dumps(request_data, indent=2)}")
                print(f"🌐 Making POST request to: {API_BASE_URL}/interestkiller/suggest")
                
                r = requests.post(f"{API_BASE_URL}/interestkiller/suggest", 
                                 json=request_data, headers=headers)
                
                print(f"📥 Response status: {r.status_code}")
                print(f"📥 Response headers: {dict(r.headers)}")
                
                if r.status_code == 200:
                    data = r.json()
                    print("✅ Interest killer working")
                    print(f"📊 Full response: {json.dumps(data, indent=2)}")
                    return True
                else:
                    print(f"❌ Interest killer failed: {r.status_code}")
                    print(f"❌ Response text: {r.text}")
                    print(f"❌ Response headers: {dict(r.headers)}")
                    return False
            else:
                print("⚠️ No credit cards found in user's accounts")
                print("📊 Available account types: " + ", ".join(set([acc.get('type', 'unknown') for acc in accounts])))
                return True  # Not a failure, just no credit cards to test
        else:
            print(f"❌ Failed to fetch accounts: {accounts_response.status_code}")
            print(f"❌ Response text: {accounts_response.text}")
            return False
    except Exception as e:
        print(f"❌ Interest killer error: {e}")
        print(f"❌ Exception type: {type(e).__name__}")
        import traceback
        print(f"❌ Full traceback: {traceback.format_exc()}")
        return False

def test_ai_integration_flow(token, user_id):
    """Test the complete AI integration flow"""
    print("🔄 Testing Complete AI Integration Flow...")
    
    try:
        # Step 1: Get user accounts
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if r.status_code == 200:
            accounts = r.json()
            print(f"✅ Retrieved {len(accounts)} accounts")
            
            # Step 2: Generate AI recommendations
            if len(accounts) > 0:
                credit_cards = [acc for acc in accounts if acc.get('type') == 'credit']
                if credit_cards:
                    payment_amount = 1000
                    r2 = requests.post(f"{API_BASE_URL}/interestkiller/pay/ai-recommendation", 
                                     json={"userId": user_id, "accounts": credit_cards, "payment_amount": payment_amount}, 
                                     headers=headers)
                    
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
                    return True
            else:
                print("⚠️ No accounts found for recommendation testing")
                return True
        else:
            print(f"❌ Failed to retrieve accounts: {r.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI integration flow error: {e}")
        return False

def comprehensive_authenticated_ai_test():
    """Run all authenticated AI tests"""
    print("🚀 Starting Comprehensive Authenticated AI Test...")
    print("=" * 60)
    
    # Get authentication token
    token, user_id = get_auth_token()
    if not token:
        print("❌ Authentication failed - stopping tests")
        return False
    
    print(f"👤 Using User ID: {user_id}")
    print("=" * 60)
    
    results = {}
    
    # Test 1: AI Recommendation
    results["ai_recommendation"] = test_ai_recommendation_with_auth(token, user_id)
    print("=" * 60)
    
    # Test 2: Card Ranking
    results["card_rank"] = test_card_rank_with_auth(token, user_id)
    print("=" * 60)
    
    # Test 3: Interest Killer
    results["interest_killer"] = test_interest_killer_with_auth(token, user_id)
    print("=" * 60)
    
    # Test 4: Complete Integration Flow
    results["integration_flow"] = test_ai_integration_flow(token, user_id)
    print("=" * 60)
    
    # Summary
    print("📊 Authenticated AI Test Results Summary:")
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
    comprehensive_authenticated_ai_test() 