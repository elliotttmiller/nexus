import requests
import json

def add_mock_cards_simple():
    print("💳 Adding Mock Credit Cards (Simple Method)")
    print("=" * 50)
    print("This will add mock credit cards using a simple approach")
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
    
    # Try to call the endpoint that should exist
    print("\n🌐 Trying to add mock cards...")
    
    # First, let's test if the plaid route is working at all
    test_response = requests.get(
        f"https://nexus-production-2e34.up.railway.app/api/plaid/accounts?userId={user_id}",
        headers=headers
    )
    
    print(f"📊 Plaid accounts endpoint status: {test_response.status_code}")
    
    # Now try the add mock cards endpoint
    add_cards_response = requests.post(
        "https://nexus-production-2e34.up.railway.app/api/plaid/add-mock-cards",
        headers=headers
    )
    
    print(f"📊 Add mock cards endpoint status: {add_cards_response.status_code}")
    
    if add_cards_response.status_code == 200:
        result = add_cards_response.json()
        print("✅ Mock cards added successfully!")
        print(f"📊 {result.get('message', 'Cards added')}")
        
        if 'cards' in result:
            print("\n💳 Added cards:")
            for card in result['cards']:
                print(f"   • {card['name']} - ${card['balance']:.2f} balance, {card['apr']}% APR")
        
        print("\n📱 Now you can test in the mobile app:")
        print("   1. Open the mobile app")
        print("   2. Go to Accounts screen")
        print("   3. You should see the mock credit cards")
        print("   4. Go to Pay Cards screen")
        print("   5. Test the AI recommendation feature")
        print("   6. Try different payment amounts")
        
        return True
    else:
        print(f"❌ Failed to add mock cards: {add_cards_response.status_code}")
        print(add_cards_response.text)
        
        # Let's try a different approach - maybe the endpoint needs a body
        print("\n🔄 Trying with empty body...")
        add_cards_response2 = requests.post(
            "https://nexus-production-2e34.up.railway.app/api/plaid/add-mock-cards",
            json={},
            headers=headers
        )
        
        print(f"📊 Status with body: {add_cards_response2.status_code}")
        if add_cards_response2.status_code == 200:
            result = add_cards_response2.json()
            print("✅ Mock cards added successfully!")
            return True
        else:
            print(f"❌ Still failed: {add_cards_response2.status_code}")
            print(add_cards_response2.text)
        
        return False

if __name__ == "__main__":
    success = add_mock_cards_simple()
    if success:
        print("\n🎉 Mock cards added successfully!")
        print("You can now test the AI features in the mobile app!")
    else:
        print("\n❌ Failed to add mock cards")
        print("The deployment might still be in progress. Try again in a few minutes.") 