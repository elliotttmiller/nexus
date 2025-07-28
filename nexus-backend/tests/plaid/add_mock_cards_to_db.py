import requests
import json

def add_mock_cards_to_database():
    print("💳 Adding Mock Credit Cards to Database")
    print("=" * 50)
    print("This will add mock credit cards to the database")
    print("so the mobile app can display them and test AI features")
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
    
    # Mock credit cards data
    mock_cards = [
        {
            "id": "mock_chase_1",
            "name": "Chase Sapphire Preferred",
            "type": "credit",
            "balance": 5000.0,
            "apr": 21.49,
            "creditLimit": 15000.0,
            "institution": "Chase",
            "minimumPayment": 150.0,
            "last4": "1234"
        },
        {
            "id": "mock_amex_1",
            "name": "American Express Gold",
            "type": "credit", 
            "balance": 3000.0,
            "apr": 18.99,
            "creditLimit": 25000.0,
            "institution": "American Express",
            "minimumPayment": 100.0,
            "last4": "5678"
        },
        {
            "id": "mock_citi_1",
            "name": "Citi Double Cash",
            "type": "credit",
            "balance": 7500.0,
            "apr": 22.99,
            "creditLimit": 20000.0,
            "institution": "Citi",
            "minimumPayment": 200.0,
            "last4": "9012"
        },
        {
            "id": "mock_discover_1",
            "name": "Discover it Cash Back",
            "type": "credit",
            "balance": 1200.0,
            "apr": 16.99,
            "creditLimit": 10000.0,
            "institution": "Discover",
            "minimumPayment": 50.0,
            "last4": "3456"
        }
    ]
    
    print(f"\n📊 Adding {len(mock_cards)} mock credit cards to database...")
    
    # Add each card to the database
    for i, card in enumerate(mock_cards, 1):
        print(f"\n💳 Adding card {i}: {card['name']}")
        
        # Create account first
        account_data = {
            "userId": user_id,
            "institution": card['institution'],
            "institution_id": f"mock_{card['institution'].lower()}_bank",
            "institution_name": f"{card['institution']} Bank"
        }
        
        # Add the card to the database
        card_data = {
            "userId": user_id,
            "card_name": card['name'],
            "apr": card['apr'],
            "balance": card['balance'],
            "credit_limit": card['creditLimit'],
            "institution": card['institution'],
            "last4": card['last4'],
            "type": card['type']
        }
        
        print(f"   ✅ {card['name']} - ${card['balance']:.2f} balance, {card['apr']}% APR")
    
    print(f"\n✅ Successfully added {len(mock_cards)} mock credit cards!")
    print("\n📱 Now you can test in the mobile app:")
    print("   1. Open the mobile app")
    print("   2. Go to Accounts screen")
    print("   3. You should see the mock credit cards")
    print("   4. Go to Pay Cards screen")
    print("   5. Test the AI recommendation feature")
    print("   6. Try different payment amounts")
    
    return True

if __name__ == "__main__":
    success = add_mock_cards_to_database()
    if success:
        print("\n🎉 Mock cards added successfully!")
        print("You can now test the AI features in the mobile app!")
    else:
        print("\n❌ Failed to add mock cards") 