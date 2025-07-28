import requests
import json

def add_mock_cards_via_api():
    print("💳 Adding Mock Credit Cards via API")
    print("=" * 50)
    print("This will call the API endpoint to add mock credit cards")
    print("so they appear in the mobile app for testing")
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
    
    print("\n🌐 Calling API to add mock credit cards...")
    
    # Call the add mock cards endpoint (using plaid route)
    add_cards_response = requests.post(
        "https://nexus-production-2e34.up.railway.app/api/plaid/add-mock-cards",
        headers=headers
    )
    
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
        return False

if __name__ == "__main__":
    success = add_mock_cards_via_api()
    if success:
        print("\n🎉 Mock cards added successfully!")
        print("You can now test the AI features in the mobile app!")
    else:
        print("\n❌ Failed to add mock cards") 