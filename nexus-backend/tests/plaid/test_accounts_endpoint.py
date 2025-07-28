import requests
import json

def test_accounts_endpoint():
    print("🔍 Testing Accounts Endpoint")
    print("=" * 50)
    print("This will test what the accounts endpoint returns")
    print()
    
    # Login to get token
    login_data = {
        "email": "elliotttmiller@hotmail.com",
        "password": "elliott"
    }
    
    print("🔐 Logging in...")
    login_response = requests.post(
        "https://nexus-production-2e34.up.railway.app/api/auth/login",
        json=login_data
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return False
    
    token = login_response.json().get('token')
    user_id = login_response.json().get('user', {}).get('id') or 1
    print(f"✅ Login successful - User ID: {user_id}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n🌐 Testing accounts endpoint...")
    
    # Call the accounts endpoint
    accounts_response = requests.get(
        f"https://nexus-production-2e34.up.railway.app/api/plaid/accounts?userId={user_id}",
        headers=headers
    )
    
    print(f"📊 Response status: {accounts_response.status_code}")
    print(f"📊 Response length: {len(accounts_response.text)}")
    
    if accounts_response.status_code == 200:
        try:
            accounts_data = accounts_response.json()
            print(f"📊 Parsed JSON: {json.dumps(accounts_data, indent=2)}")
            
            if isinstance(accounts_data, list):
                print(f"📊 Found {len(accounts_data)} accounts")
                credit_cards = [acc for acc in accounts_data if acc.get('type') == 'credit']
                print(f"📊 Found {len(credit_cards)} credit cards")
                
                for i, card in enumerate(credit_cards, 1):
                    print(f"   {i}. {card.get('name', 'Unknown')} - ${card.get('balance', 0):.2f}")
            else:
                print("📊 Response is not a list")
                
        except Exception as e:
            print(f"❌ Could not parse JSON: {e}")
            print(f"📊 Raw response: {accounts_response.text[:500]}...")
    else:
        print(f"❌ Request failed: {accounts_response.status_code}")
        print(accounts_response.text)
    
    return True

if __name__ == "__main__":
    success = test_accounts_endpoint()
    if success:
        print("\n✅ Test completed!")
    else:
        print("\n❌ Test failed") 