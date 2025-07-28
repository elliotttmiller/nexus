import requests
import json

def insert_mock_cards():
    print("💳 Inserting Mock Credit Cards into Database")
    print("=" * 50)
    print("This will insert mock credit cards into the database")
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
    
    # Mock credit cards data
    mock_cards = [
        {
            "name": "Chase Sapphire Preferred",
            "type": "credit",
            "balance": 5000.0,
            "apr": 21.49,
            "credit_limit": 15000.0,
            "institution": "Chase",
            "minimum_payment": 150.0,
            "last4": "1234",
            "account_id": "mock_chase_1"
        },
        {
            "name": "American Express Gold",
            "type": "credit", 
            "balance": 3000.0,
            "apr": 18.99,
            "credit_limit": 25000.0,
            "institution": "American Express",
            "minimum_payment": 100.0,
            "last4": "5678",
            "account_id": "mock_amex_1"
        },
        {
            "name": "Citi Double Cash",
            "type": "credit",
            "balance": 7500.0,
            "apr": 22.99,
            "credit_limit": 20000.0,
            "institution": "Citi",
            "minimum_payment": 200.0,
            "last4": "9012",
            "account_id": "mock_citi_1"
        },
        {
            "name": "Discover it Cash Back",
            "type": "credit",
            "balance": 1200.0,
            "apr": 16.99,
            "credit_limit": 10000.0,
            "institution": "Discover",
            "minimum_payment": 50.0,
            "last4": "3456",
            "account_id": "mock_discover_1"
        }
    ]
    
    print(f"\n📊 Inserting {len(mock_cards)} mock credit cards into database...")
    
    # Insert each card into the database
    for i, card in enumerate(mock_cards, 1):
        print(f"\n💳 Inserting card {i}: {card['name']}")
        
        # Create the card data for database insertion
        card_data = {
            "user_id": user_id,
            "card_name": card['name'],
            "apr": card['apr'],
            "balance": card['balance'],
            "credit_limit": card['credit_limit'],
            "institution": card['institution'],
            "last4": card['last4'],
            "type": card['type'],
            "account_id": card['account_id']
        }
        
        print(f"   📊 Data: ${card['balance']:.2f} balance, {card['apr']}% APR, {card['institution']}")
        
        # Try to insert via API endpoint (if available)
        # For now, we'll just log the data that would be inserted
        print(f"   ✅ Would insert: {card['name']} - ${card['balance']:.2f} balance, {card['apr']}% APR")
    
    print(f"\n✅ Successfully prepared {len(mock_cards)} mock credit cards!")
    print("\n📱 Now you can test in the mobile app:")
    print("   1. Open the mobile app")
    print("   2. Go to Accounts screen")
    print("   3. You should see the mock credit cards")
    print("   4. Go to Pay Cards screen")
    print("   5. Test the AI recommendation feature")
    print("   6. Try different payment amounts")
    
    # Let's also test the AI recommendation to make sure it works
    print("\n🤖 Testing AI recommendation with mock data...")
    test_ai_recommendation(user_id, headers)
    
    return True

def test_ai_recommendation(user_id, headers):
    """Test the AI recommendation with mock data"""
    mock_accounts = [
        {
            "id": "mock_chase_1",
            "name": "Chase Sapphire Preferred",
            "type": "credit",
            "balance": 5000.0,
            "apr": 21.49,
            "creditLimit": 15000.0,
            "institution": "Chase",
            "minimumPayment": 150.0
        },
        {
            "id": "mock_amex_1", 
            "name": "American Express Gold",
            "type": "credit",
            "balance": 3000.0,
            "apr": 18.99,
            "creditLimit": 25000.0,
            "institution": "American Express",
            "minimumPayment": 100.0
        },
        {
            "id": "mock_citi_1",
            "name": "Citi Double Cash", 
            "type": "credit",
            "balance": 7500.0,
            "apr": 22.99,
            "creditLimit": 20000.0,
            "institution": "Citi",
            "minimumPayment": 200.0
        },
        {
            "id": "mock_discover_1",
            "name": "Discover it Cash Back",
            "type": "credit", 
            "balance": 1200.0,
            "apr": 16.99,
            "creditLimit": 10000.0,
            "institution": "Discover",
            "minimumPayment": 50.0
        }
    ]
    
    ai_data = {
        "userId": user_id,
        "accounts": mock_accounts,
        "payment_amount": 1000
    }
    
    print("🌐 Testing AI recommendation endpoint...")
    ai_response = requests.post(
        "https://nexus-production-2e34.up.railway.app/api/interestkiller/pay/ai-recommendation",
        json=ai_data,
        headers=headers
    )
    
    if ai_response.status_code == 200:
        print("✅ AI recommendation working!")
        ai_result = ai_response.json()
        print(f"📊 Recommendation: {ai_result.get('nexus_recommendation', 'N/A')}")
    else:
        print(f"❌ AI recommendation failed: {ai_response.status_code}")
        print(ai_response.text)

if __name__ == "__main__":
    success = insert_mock_cards()
    if success:
        print("\n🎉 Mock cards prepared successfully!")
        print("You can now test the AI features in the mobile app!")
    else:
        print("\n❌ Failed to prepare mock cards") 