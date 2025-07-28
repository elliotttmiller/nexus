#!/usr/bin/env python3
"""
Add Credit Cards via Plaid Sandbox - Version 2
==============================================

This script tries different approaches to get credit cards from Plaid sandbox:
1. Different institutions known to have credit cards
2. Different test users with credit profiles
3. Explicit credit card data requests
"""

import requests
import json
import time

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"
PLAID_BASE_URL = "https://sandbox.plaid.com"
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"

# Different Plaid sandbox institutions that might have credit cards
INSTITUTIONS = [
    {
        "name": "First Platypus Bank",
        "id": "ins_109508"
    },
    {
        "name": "Chase",
        "id": "ins_109508"  # Using same ID but different name
    },
    {
        "name": "American Express",
        "id": "ins_109508"
    }
]

# Credit card test users with different approaches
CREDIT_CARD_USERS = [
    {
        "desc": "Excellent Credit Profile",
        "username": "user_credit_profile_excellent",
        "password": "any"
    },
    {
        "desc": "Good Credit Profile", 
        "username": "user_credit_profile_good",
        "password": "any"
    },
    {
        "desc": "Credit Bonus Profile",
        "username": "user_credit_bonus", 
        "password": "any"
    },
    {
        "desc": "Joint Account Profile",
        "username": "user_credit_joint_account",
        "password": "any"
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
            return data
        else:
            print(f"❌ Failed to exchange public token: {r.status_code}")
            print(f"❌ Response: {r.text}")
            return None
    except Exception as e:
        print(f"❌ Exchange error: {e}")
        return None

def fetch_and_analyze_accounts(token, user_id):
    """Fetch accounts and analyze for credit cards"""
    print("📊 Fetching and analyzing accounts...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers=headers)
        
        if r.status_code == 200:
            accounts = r.json()
            print(f"✅ Retrieved {len(accounts)} accounts")
            
            # Analyze account types
            type_counts = {}
            credit_cards = []
            
            for acc in accounts:
                acc_type = acc.get('type', 'unknown')
                type_counts[acc_type] = type_counts.get(acc_type, 0) + 1
                
                # Check for credit cards
                name_lower = acc.get('name', '').lower()
                if (acc_type == 'credit' or 
                    'credit' in name_lower or 
                    'card' in name_lower or
                    acc.get('apr') is not None or
                    acc.get('creditLimit') is not None):
                    credit_cards.append(acc)
            
            print(f"\n📊 Account Type Summary:")
            for acc_type, count in type_counts.items():
                print(f"  {acc_type}: {count} accounts")
            
            print(f"\n💳 Credit Cards Found: {len(credit_cards)}")
            for i, card in enumerate(credit_cards):
                print(f"  {i+1}. {card.get('name')} - Type: {card.get('type')} - APR: {card.get('apr')}%")
            
            return accounts, credit_cards
        else:
            print(f"❌ Failed to fetch accounts: {r.status_code}")
            return [], []
    except Exception as e:
        print(f"❌ Fetch accounts error: {e}")
        return [], []

def test_ai_features_with_credit_cards(token, user_id, credit_cards):
    """Test AI features with credit cards"""
    if len(credit_cards) == 0:
        print("⚠️ No credit cards found for AI testing")
        return False
    
    print(f"🤖 Testing AI features with {len(credit_cards)} credit cards...")
    
    # Test AI Recommendation
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
    
    return True

def add_credit_cards_v2():
    """Main function to add credit cards using different approaches"""
    print("🚀 Adding Credit Cards via Plaid Sandbox - Version 2")
    print("=" * 60)
    
    # Step 1: Login
    token, user_id = login_user()
    if not token:
        print("❌ Login failed - stopping")
        return False
    
    print("=" * 60)
    
    # Step 2: Get link token
    link_token = get_link_token(token, user_id)
    if not link_token:
        print("❌ Failed to get link token - stopping")
        return False
    
    print("=" * 60)
    
    # Step 3: Try different institutions and users
    best_credit_cards = []
    
    for institution in INSTITUTIONS:
        print(f"\n🏦 Trying institution: {institution['name']}")
        print("=" * 40)
        
        for test_user in CREDIT_CARD_USERS:
            print(f"\n🔄 Testing: {test_user['desc']}")
            print(f"👤 Username: {test_user['username']}")
            
            # Create sandbox public token
            public_token, institution_id = create_sandbox_public_token(
                test_user['username'], 
                test_user['password'],
                institution['id']
            )
            
            if not public_token:
                print(f"❌ Failed to create public token")
                continue
            
            # Exchange public token
            exchange_result = exchange_public_token(
                token, 
                public_token, 
                user_id, 
                institution['name']
            )
            
            if exchange_result:
                print(f"✅ Successfully connected to {institution['name']}")
                
                # Fetch and analyze accounts
                accounts, credit_cards = fetch_and_analyze_accounts(token, user_id)
                
                if len(credit_cards) > len(best_credit_cards):
                    best_credit_cards = credit_cards
                    print(f"🎉 Found {len(credit_cards)} credit cards!")
                
                # If we found credit cards, test AI features
                if len(credit_cards) > 0:
                    print(f"\n🤖 Testing AI features...")
                    test_ai_features_with_credit_cards(token, user_id, credit_cards)
                    break  # Found credit cards, no need to try more
            else:
                print(f"❌ Failed to connect to {institution['name']}")
            
            # Wait between attempts
            time.sleep(1)
        
        # If we found credit cards, we can stop trying more institutions
        if len(best_credit_cards) > 0:
            break
    
    print("\n" + "=" * 60)
    print("🎯 FINAL RESULTS:")
    print("=" * 60)
    
    if len(best_credit_cards) > 0:
        print(f"✅ Successfully found {len(best_credit_cards)} credit cards!")
        print("💳 Credit Cards:")
        for i, card in enumerate(best_credit_cards):
            print(f"  {i+1}. {card.get('name')} - APR: {card.get('apr')}% - Limit: ${card.get('creditLimit', 0):,.2f}")
        
        print("\n🤖 AI features are ready to test with real credit card data!")
        return True
    else:
        print("❌ No credit cards found from any institution")
        print("💡 This might indicate that the Plaid sandbox doesn't provide credit cards by default")
        print("💡 We may need to use a different approach or add mock credit card data")
        return False

if __name__ == "__main__":
    add_credit_cards_v2() 