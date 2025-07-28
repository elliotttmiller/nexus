#!/usr/bin/env python3
"""
Add Credit Cards via Plaid Sandbox
==================================

This script adds real credit cards to your account using Plaid sandbox
credit card test users. It will connect to institutions that have credit cards
and then test the AI features with the real credit card data.
"""

import requests
import json
import time

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"
PLAID_BASE_URL = "https://sandbox.plaid.com"
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"

# Credit card test users from Plaid sandbox
CREDIT_CARD_USERS = [
    {
        "desc": "Excellent Credit Profile",
        "username": "user_credit_profile_excellent",
        "password": "any",
        "institution": "ins_109508"  # First Platypus Bank
    },
    {
        "desc": "Good Credit Profile", 
        "username": "user_credit_profile_good",
        "password": "any",
        "institution": "ins_109508"
    },
    {
        "desc": "Credit Bonus Profile",
        "username": "user_credit_bonus", 
        "password": "any",
        "institution": "ins_109508"
    }
]

def login_user():
    """Login with existing user credentials"""
    print("🔐 Logging in with existing credentials...")
    
    login_data = {
        "email": "elliotttmiller@hotmail.com",
        "password": "elliott"
    }
    
    try:
        r = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        
        if r.status_code == 200:
            data = r.json()
            token = data.get("token")
            user_id = data.get("userId", 1)
            print("✅ Login successful")
            print(f"👤 User ID: {user_id}")
            return token, user_id
        else:
            print(f"❌ Login failed: {r.status_code}")
            print(f"❌ Response: {r.text}")
            return None, None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None, None

def get_link_token(token, user_id):
    """Get a Plaid link token for connecting accounts"""
    print("🔗 Getting Plaid link token...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{API_BASE_URL}/plaid/create_link_token", 
                         json={"userId": user_id}, headers=headers)
        
        if r.status_code == 200:
            data = r.json()
            link_token = data.get("link_token")
            print("✅ Link token received")
            return link_token
        else:
            print(f"❌ Failed to get link token: {r.status_code}")
            print(f"❌ Response: {r.text}")
            return None
    except Exception as e:
        print(f"❌ Link token error: {e}")
        return None

def create_sandbox_public_token(username, password, institution_id="ins_109508"):
    """Create a sandbox public token for credit card testing"""
    print(f"🏦 Creating sandbox token for {username}...")
    
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "institution_id": institution_id,
        "initial_products": ["auth", "transactions", "identity", "liabilities"],
        "options": {
            "override_username": username,
            "override_password": password
        }
    }
    
    try:
        r = requests.post(f"{PLAID_BASE_URL}/sandbox/public_token/create", json=payload)
        r.raise_for_status()
        data = r.json()
        
        public_token = data.get("public_token")
        print(f"✅ Sandbox public token created")
        return public_token, institution_id
        
    except requests.RequestException as e:
        print(f"❌ Error creating public token: {e}")
        if hasattr(e, 'response') and hasattr(e.response, 'json'):
            error_data = e.response.json()
            print(f"Error details: {error_data}")
        return None, None

def exchange_public_token(token, public_token, user_id, institution_name):
    """Exchange public token for access token and create account"""
    print(f"🔄 Exchanging public token for {institution_name}...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.post(f"{API_BASE_URL}/plaid/exchange_public_token", 
                         json={
                             "public_token": public_token,
                             "userId": user_id,
                             "institution": institution_name
                         }, 
                         headers=headers)
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Public token exchanged successfully")
            print(f"📊 Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print(f"❌ Failed to exchange public token: {r.status_code}")
            print(f"❌ Response: {r.text}")
            return None
    except Exception as e:
        print(f"❌ Exchange error: {e}")
        return None

def fetch_accounts(token, user_id):
    """Fetch accounts to verify credit cards were added"""
    print("📊 Fetching accounts to verify credit cards...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if r.status_code == 200:
            accounts = r.json()
            print(f"✅ Retrieved {len(accounts)} accounts")
            
            # Show detailed account information
            print("📊 Account Details:")
            for i, acc in enumerate(accounts):
                print(f"  Account {i+1}: {acc.get('name', 'Unknown')}")
                print(f"    Type: {acc.get('type', 'unknown')}")
                print(f"    Subtype: {acc.get('subtype', 'unknown')}")
                print(f"    Balance: ${acc.get('balance', 0):,.2f}")
                if acc.get('type') == 'credit':
                    print(f"    APR: {acc.get('apr', 'N/A')}%")
                    print(f"    Credit Limit: ${acc.get('creditLimit', 0):,.2f}")
                print()
            
            # Count credit cards
            credit_cards = [acc for acc in accounts if acc.get('type') == 'credit']
            print(f"💳 Found {len(credit_cards)} credit cards")
            
            return accounts
        else:
            print(f"❌ Failed to fetch accounts: {r.status_code}")
            print(f"❌ Response: {r.text}")
            return []
    except Exception as e:
        print(f"❌ Fetch accounts error: {e}")
        return []

def test_ai_features_with_credit_cards(token, user_id, accounts):
    """Test AI features with the newly added credit cards"""
    print("🤖 Testing AI features with credit cards...")
    
    credit_cards = [acc for acc in accounts if acc.get('type') == 'credit']
    
    if len(credit_cards) == 0:
        print("⚠️ No credit cards found for AI testing")
        return False
    
    print(f"💳 Testing with {len(credit_cards)} credit cards")
    
    # Test 1: AI Recommendation
    print("\n🎯 Testing AI Recommendation...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        test_data = {
            "userId": user_id,
            "accounts": credit_cards,
            "payment_amount": 1000
        }
        
        r = requests.post(f"{API_BASE_URL}/interestkiller/pay/ai-recommendation", 
                         json=test_data, headers=headers)
        
        if r.status_code == 200:
            data = r.json()
            print("✅ AI recommendation working")
            print(f"📊 Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ AI recommendation failed: {r.status_code}")
            print(f"❌ Response: {r.text}")
    except Exception as e:
        print(f"❌ AI recommendation error: {e}")
    
    # Test 2: Card Ranking
    print("\n🏆 Testing Card Ranking...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        request_data = {
            "userId": user_id,
            "merchant": "Amazon",
            "category": "shopping",
            "amount": 500,
            "location": "Online",
            "primaryGoal": "maximize_rewards"
        }
        
        r = requests.post(f"{API_BASE_URL}/cardrank/recommend", 
                         json=request_data, headers=headers)
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Card ranking working")
            print(f"📊 Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Card ranking failed: {r.status_code}")
            print(f"❌ Response: {r.text}")
    except Exception as e:
        print(f"❌ Card ranking error: {e}")
    
    # Test 3: Interest Killer
    print("\n💸 Testing Interest Killer...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        request_data = {
            "userId": user_id,
            "amount": 500,
            "optimizationGoal": "minimize_interest"
        }
        
        r = requests.post(f"{API_BASE_URL}/interestkiller/suggest", 
                         json=request_data, headers=headers)
        
        if r.status_code == 200:
            data = r.json()
            print("✅ Interest killer working")
            print(f"📊 Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Interest killer failed: {r.status_code}")
            print(f"❌ Response: {r.text}")
    except Exception as e:
        print(f"❌ Interest killer error: {e}")
    
    return True

def add_credit_cards():
    """Main function to add credit cards and test AI features"""
    print("🚀 Adding Credit Cards via Plaid Sandbox")
    print("=" * 60)
    
    # Step 1: Login
    token, user_id = login_user()
    if not token:
        print("❌ Login failed - stopping")
        return False
    
    print(f"👤 Using User ID: {user_id}")
    print("=" * 60)
    
    # Step 2: Get link token
    link_token = get_link_token(token, user_id)
    if not link_token:
        print("❌ Failed to get link token - stopping")
        return False
    
    print("=" * 60)
    
    # Step 3: Add credit cards from different test users
    added_credit_cards = False
    
    for i, test_user in enumerate(CREDIT_CARD_USERS):
        print(f"\n🔄 Adding credit cards from test user {i+1}: {test_user['desc']}")
        print(f"👤 Username: {test_user['username']}")
        print(f"🏦 Institution: {test_user['institution']}")
        
        # Create sandbox public token
        public_token, institution_id = create_sandbox_public_token(
            test_user['username'], 
            test_user['password'],
            test_user['institution']
        )
        
        if not public_token:
            print(f"❌ Failed to create public token for {test_user['desc']}")
            continue
        
        # Exchange public token
        exchange_result = exchange_public_token(
            token, 
            public_token, 
            user_id, 
            "First Platypus Bank"
        )
        
        if exchange_result:
            print(f"✅ Successfully added credit cards from {test_user['desc']}")
            added_credit_cards = True
        else:
            print(f"❌ Failed to add credit cards from {test_user['desc']}")
        
        # Wait a bit between requests
        time.sleep(2)
    
    print("=" * 60)
    
    # Step 4: Fetch and verify accounts
    if added_credit_cards:
        print("\n📊 Verifying added credit cards...")
        accounts = fetch_accounts(token, user_id)
        
        # Step 5: Test AI features
        if accounts:
            print("\n🤖 Testing AI features with new credit cards...")
            test_ai_features_with_credit_cards(token, user_id, accounts)
        
        print("\n🎉 Credit card addition and AI testing completed!")
        return True
    else:
        print("\n❌ No credit cards were successfully added")
        return False

if __name__ == "__main__":
    add_credit_cards() 