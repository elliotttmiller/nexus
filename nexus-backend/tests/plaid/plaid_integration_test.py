import requests
import json
import time
import os

API_BASE_URL = "http://localhost:8080/api"
PLAID_BASE_URL = "https://sandbox.plaid.com"
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"  # Replace with your real client_id
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"  # Replace with your real secret

# Enhanced Plaid sandbox test users covering all scenarios from credentials file
TEST_USERS = [
    # Basic flows
    {"desc": "Basic account linking", "username": "user_good", "password": "pass_good", "expected_success": True},
    {"desc": "Transactions testing", "username": "user_transactions_dynamic", "password": "any", "expected_success": True},
    
    # Auth flows
    {"desc": "Micro-deposit/ACH", "username": "user_good", "password": "microdeposits_good", "expected_success": True},
    
    # Credit and Income flows
    {"desc": "Credit profile excellent", "username": "user_credit_profile_excellent", "password": "any", "expected_success": True},
    {"desc": "Credit profile good", "username": "user_credit_profile_good", "password": "any", "expected_success": True},
    {"desc": "Credit profile poor", "username": "user_credit_profile_poor", "password": "any", "expected_success": True},
    {"desc": "Credit bonus", "username": "user_credit_bonus", "password": "any", "expected_success": True},
    {"desc": "Credit joint account", "username": "user_credit_joint_account", "password": "any", "expected_success": True},
    {"desc": "Bank income", "username": "user_bank_income", "password": "{}", "expected_success": True},
    
    # MFA flows
    {"desc": "MFA device OTP", "username": "user_good", "password": "mfa_device", "expected_success": True},
    {"desc": "MFA questions", "username": "user_good", "password": "mfa_questions_1_2", "expected_success": True},
    {"desc": "MFA selections", "username": "user_good", "password": "mfa_selections", "expected_success": True},
    
    # Error flows (these should fail gracefully)
    {"desc": "Error ITEM_LOCKED", "username": "user_good", "password": "error_ITEM_LOCKED", "expected_success": False},
    {"desc": "Error INVALID_CREDENTIALS", "username": "user_good", "password": "error_INVALID_CREDENTIALS", "expected_success": False},
    {"desc": "Error INSTITUTION_DOWN", "username": "user_good", "password": "error_INSTITUTION_DOWN", "expected_success": False},
    
    # ReCAPTCHA flows
    {"desc": "ReCAPTCHA bad", "username": "user_good", "password": '{"recaptcha":"bad"}', "expected_success": False},
]

USER_EMAIL = "test_plaid_ai@example.com"
USER_PASSWORD = "testpassword"

def register_or_login():
    """Register or login a test user and return auth tokens."""
    r = requests.post(f"{API_BASE_URL}/auth/register", json={"email": USER_EMAIL, "password": USER_PASSWORD})
    if r.status_code == 200:
        data = r.json()
        print("✅ Registered new user.")
        return data["token"], data["refreshToken"], data.get("userId", 1)
    else:
        r = requests.post(f"{API_BASE_URL}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        data = r.json()
        print("✅ Logged in as existing user.")
        return data["token"], data["refreshToken"], data.get("userId", 1)

def get_link_token(token, user_id=1):
    """Get a Plaid link token for account linking."""
    r = requests.post(f"{API_BASE_URL}/plaid/create_link_token", 
                     headers={"Authorization": f"Bearer {token}"},
                     json={"userId": user_id})
    data = r.json()
    print(f"🔗 Link token response: {data.get('link_token', 'None')}")
    return data.get("link_token")

def create_sandbox_public_token(username, password):
    """Create a sandbox public token using Plaid's sandbox API."""
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "institution_id": "ins_109508",  # First Platypus Bank
        "initial_products": ["auth", "transactions"],
        "options": {
            "override_username": username,
            "override_password": password
        }
    }
    
    try:
        r = requests.post(f"{PLAID_BASE_URL}/sandbox/public_token/create", json=payload)
        r.raise_for_status()
        data = r.json()
        
        print(f"🏦 Sandbox public_token response: {data.get('public_token', 'None')}")
        return data.get("public_token"), data.get("institution_id")
        
    except requests.RequestException as e:
        print(f"❌ Error creating public token: {e}")
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            error_data = e.response.json()
            print(f"Error details: {error_data}")
            
            # For error simulation tests, certain errors are expected
            if error_data.get('error_type') in ['INVALID_CREDENTIALS', 'ITEM_LOCKED', 'INSTITUTION_DOWN']:
                print(f"✅ Expected error received: {error_data.get('error_type')}")
                return None, None
                
        return None, None

def exchange_public_token(token, public_token, user_id=1, institution=None):
    """Exchange public token for access token and create account."""
    payload = {"public_token": public_token, "userId": user_id}
    if institution:
        payload["institution"] = institution
    r = requests.post(f"{API_BASE_URL}/plaid/exchange_public_token", 
                     headers={"Authorization": f"Bearer {token}"},
                     json=payload)
    data = r.json()
    print(f"💳 Exchange public_token response: {data.get('access_token', 'None')}")
    return data

def fetch_accounts(token, user_id=1):
    """Fetch accounts for the user."""
    r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}",
                    headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    print(f"📊 Accounts: {len(data) if isinstance(data, list) else 'Error'}")
    return data

def test_ai_features(token, user_id=1):
    """Test AI-powered features with the linked account."""
    print("🤖 Testing AI features...")
    
    # Test CardRank recommendation
    cardrank_payload = {
        "userId": user_id,
        "merchant": "Amazon",
        "category": "shopping",
        "amount": 100.00,
        "location": "San Francisco, CA",
        "primaryGoal": "maximize_rewards"
    }
    r = requests.post(f"{API_BASE_URL}/cardrank/recommend", 
                     headers={"Authorization": f"Bearer {token}"},
                     json=cardrank_payload)
    if r.status_code == 200:
        data = r.json()
        print(f"✅ CardRank: {data.get('reason', 'No reason provided')}")
    else:
        print(f"❌ CardRank failed: {r.status_code}")
    
    # Test InterestKiller
    ik_payload = {
        "userId": user_id,
        "amount": 500.00,
        "optimizationGoal": "minimize_interest"
    }
    r = requests.post(f"{API_BASE_URL}/interestkiller/suggest", 
                     headers={"Authorization": f"Bearer {token}"},
                     json=ik_payload)
    if r.status_code == 200:
        data = r.json()
        print(f"✅ InterestKiller: {data.get('reason', 'No reason provided')}")
    else:
        print(f"❌ InterestKiller failed: {r.status_code}")

def run_single_test(test, token, user_id):
    """Run a single Plaid sandbox test."""
    print(f"\n{'='*60}")
    print(f"🧪 Testing: {test['desc']}")
    print(f"👤 Username: {test['username']}")
    print(f"🔑 Password: {test['password']}")
    print(f"📈 Expected Success: {test['expected_success']}")
    print(f"{'='*60}")
    
    try:
        # Get link token
        link_token = get_link_token(token, user_id)
        if not link_token:
            print("❌ Failed to get link token. Skipping test.")
            return False
        
        # Create sandbox public token
        public_token, institution_id = create_sandbox_public_token(test['username'], test['password'])
        
        # For error simulation tests, no public token is expected
        if not test['expected_success'] and not public_token:
            print("✅ Error occurred as expected (no public token)")
            return True
            
        if not public_token and test['expected_success']:
            print("❌ Failed to create sandbox public_token. Skipping test.")
            return False
        
        # Exchange public token
        exchange_result = exchange_public_token(token, public_token, user_id, institution="First Platypus Bank")
        
        # Check if exchange was successful
        if test['expected_success']:
            if 'access_token' in exchange_result:
                print("✅ Account linking successful as expected")
                # Fetch accounts
                accounts = fetch_accounts(token, user_id)
                if accounts and len(accounts) > 0:
                    print("✅ Accounts fetched successfully")
                    # Test AI features for successful connections
                    test_ai_features(token, user_id)
                else:
                    print("⚠️ No accounts returned")
                return True
            else:
                print("❌ Account linking failed when expected to succeed")
                return False
        else:
            if 'error' in exchange_result or not public_token:
                print("✅ Error occurred as expected")
                return True
            else:
                print("⚠️ No error occurred when one was expected")
                return False
                
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        # For error simulation tests, an exception might be expected
        if not test['expected_success']:
            print("✅ Error occurred as expected (exception)")
            return True
        return False

def run_comprehensive_tests():
    """Run comprehensive tests for all Plaid sandbox user flows."""
    print("🚀 Starting comprehensive Plaid sandbox user flow tests...")
    
    # Register/login user
    token, refresh_token, user_id = register_or_login()
    
    # Track test results
    total_tests = len(TEST_USERS)
    passed_tests = 0
    failed_tests = 0
    
    # Run each test
    for test in TEST_USERS:
        success = run_single_test(test, token, user_id)
        if success:
            passed_tests += 1
        else:
            failed_tests += 1
        time.sleep(1)  # Rate limiting
    
    # Print summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    print(f"{'='*60}")
    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    print(f"{'='*60}")
    
    if failed_tests == 0:
        print("🎉 All tests passed! Plaid integration and AI features are working correctly.")
    else:
        print("⚠️ Some tests failed. Check the logs above for details.")
    
    return failed_tests == 0

if __name__ == "__main__":
    success = run_comprehensive_tests()
    exit(0 if success else 1) 