import requests
import json

def check_existing_cards():
    print("🔍 Checking Existing Cards in Database")
    print("=" * 50)
    print("This will check what cards are currently in the database")
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
    
    # Check what cards exist in the database
    print("\n📊 Checking existing cards...")
    
    # Try to get cards from the plaid accounts endpoint
    accounts_response = requests.get(
        f"https://nexus-production-2e34.up.railway.app/api/plaid/accounts?userId={user_id}",
        headers=headers
    )
    
    if accounts_response.status_code == 200:
        accounts_data = accounts_response.json()
        credit_cards = [acc for acc in accounts_data if acc.get('type') == 'credit']
        
        print(f"📊 Found {len(credit_cards)} credit cards in accounts:")
        for card in credit_cards:
            print(f"   • {card.get('name', 'Unknown')} - ${card.get('balance', 0):.2f} balance")
    else:
        print(f"❌ Failed to get accounts: {accounts_response.status_code}")
    
    # Also check if there are any cards in the database directly
    print("\n🔍 Checking database for cards...")
    
    # Try to get cards from a different endpoint or check the response
    print("📊 Accounts response status:", accounts_response.status_code)
    print("📊 Accounts response length:", len(accounts_response.text))
    
    if len(accounts_response.text) < 100:
        print("📊 Accounts response content:", accounts_response.text)
    
    return True

if __name__ == "__main__":
    success = check_existing_cards()
    if success:
        print("\n✅ Card check completed!")
    else:
        print("\n❌ Failed to check cards") 