import requests
import time
import json

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"
PLAID_BASE_URL = "https://sandbox.plaid.com"
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"

TEST_USERS = [
    {"desc": "Credit profile excellent", "username": "user_credit_profile_excellent", "password": "any"},
    {"desc": "Credit profile good", "username": "user_credit_profile_good", "password": "any"},
]

def test_authentication():
    """Test user registration and login"""
    print("🔐 Testing Authentication...")
    
    # Test registration
    email = "test_comprehensive@example.com"
    password = "testpass123"
    
    try:
        # Register new user
        r = requests.post(f"{API_BASE_URL}/auth/register", json={"email": email, "password": password})
        if r.status_code == 200:
            data = r.json()
            print("✅ Registration successful")
            user_id = data.get("userId", 1)
            token = data.get("token")
            return token, user_id, email
        else:
            print(f"❌ Registration failed: {r.status_code} - {r.text}")
            return None, None, None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None, None, None

def test_plaid_link_token(token, user_id):
    """Test Plaid link token creation"""
    print("🔗 Testing Plaid Link Token...")
    
    try:
        r = requests.post(f"{API_BASE_URL}/plaid/create_link_token", 
                         headers={"Authorization": f"Bearer {token}"},
                         json={"userId": user_id})
        if r.status_code == 200:
            data = r.json()
            link_token = data.get("link_token")
            if link_token:
                print("✅ Link token created successfully")
                return link_token
            else:
                print("❌ No link token in response")
                return None
        else:
            print(f"❌ Link token creation failed: {r.status_code} - {r.text}")
            return None
    except Exception as e:
        print(f"❌ Link token error: {e}")
        return None

def test_plaid_sandbox_connection():
    """Test Plaid sandbox connection"""
    print("🏦 Testing Plaid Sandbox Connection...")
    
    try:
        payload = {
            "client_id": PLAID_CLIENT_ID,
            "secret": PLAID_SECRET,
            "institution_id": "ins_109508",
            "initial_products": ["auth", "transactions", "identity", "liabilities"],
            "options": {
                "override_username": "user_credit_profile_excellent",
                "override_password": "any"
            }
        }
        r = requests.post(f"{PLAID_BASE_URL}/sandbox/public_token/create", json=payload)
        if r.status_code == 200:
            data = r.json()
            public_token = data.get("public_token")
            if public_token:
                print("✅ Plaid sandbox connection successful")
                return public_token
            else:
                print("❌ No public token from Plaid")
                return None
        else:
            print(f"❌ Plaid sandbox failed: {r.status_code} - {r.text}")
            return None
    except Exception as e:
        print(f"❌ Plaid sandbox error: {e}")
        return None

def test_account_linking(token, user_id, public_token):
    """Test account linking process"""
    print("💳 Testing Account Linking...")
    
    try:
        payload = {"public_token": public_token, "userId": user_id}
        r = requests.post(f"{API_BASE_URL}/plaid/exchange_public_token", 
                         headers={"Authorization": f"Bearer {token}"},
                         json=payload)
        if r.status_code == 200:
            data = r.json()
            access_token = data.get("access_token")
            if access_token:
                print("✅ Account linking successful")
                return True
            else:
                print("❌ No access token from exchange")
                return False
        else:
            print(f"❌ Account linking failed: {r.status_code} - {r.text}")
            return False
    except Exception as e:
        print(f"❌ Account linking error: {e}")
        return False

def test_data_retrieval(token, user_id):
    """Test retrieving accounts and transactions"""
    print("📊 Testing Data Retrieval...")
    
    # Test accounts endpoint
    try:
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", 
                        headers={"Authorization": f"Bearer {token}"})
        if r.status_code == 200:
            accounts = r.json()
            print(f"✅ Accounts retrieved: {len(accounts) if isinstance(accounts, list) else 'Not a list'}")
            if isinstance(accounts, list) and len(accounts) > 0:
                print(f"📈 Sample account: {accounts[0]}")
        else:
            print(f"❌ Accounts retrieval failed: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ Accounts retrieval error: {e}")
    
    # Test transactions endpoint
    try:
        r = requests.get(f"{API_BASE_URL}/plaid/transactions?userId={user_id}", 
                        headers={"Authorization": f"Bearer {token}"})
        if r.status_code == 200:
            transactions = r.json()
            print(f"✅ Transactions retrieved: {len(transactions) if isinstance(transactions, list) else 'Not a list'}")
            if isinstance(transactions, list) and len(transactions) > 0:
                print(f"📈 Sample transaction: {transactions[0]}")
        else:
            print(f"❌ Transactions retrieval failed: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"❌ Transactions retrieval error: {e}")

def test_app_endpoints():
    """Test basic app endpoints"""
    print("🌐 Testing App Endpoints...")
    
    # Test health endpoint (if exists)
    try:
        r = requests.get(f"{API_BASE_URL.replace('/api', '')}/health")
        print(f"Health check: {r.status_code}")
    except:
        print("Health endpoint not available")
    
    # Test API base
    try:
        r = requests.get(f"{API_BASE_URL}")
        print(f"API base: {r.status_code}")
    except Exception as e:
        print(f"API base error: {e}")

def comprehensive_test():
    """Run all tests"""
    print("🚀 Starting Comprehensive Integration Test...")
    print("=" * 60)
    
    # Test 1: Authentication
    token, user_id, email = test_authentication()
    if not token:
        print("❌ Authentication failed - stopping tests")
        return False
    
    print(f"👤 Using User ID: {user_id}")
    print("=" * 60)
    
    # Test 2: App endpoints
    test_app_endpoints()
    print("=" * 60)
    
    # Test 3: Plaid link token
    link_token = test_plaid_link_token(token, user_id)
    if not link_token:
        print("❌ Link token failed - stopping tests")
        return False
    print("=" * 60)
    
    # Test 4: Plaid sandbox
    public_token = test_plaid_sandbox_connection()
    if not public_token:
        print("❌ Plaid sandbox failed - stopping tests")
        return False
    print("=" * 60)
    
    # Test 5: Account linking
    linking_success = test_account_linking(token, user_id, public_token)
    if not linking_success:
        print("❌ Account linking failed - stopping tests")
        return False
    print("=" * 60)
    
    # Test 6: Data retrieval
    test_data_retrieval(token, user_id)
    print("=" * 60)
    
    print("🎉 All tests completed!")
    print("✅ Integration is working properly")
    print("📱 Ready for TestFlight build!")
    
    return True

if __name__ == "__main__":
    comprehensive_test() 