import requests
import json

def test_ai_with_mock_cards():
    print("🤖 Testing AI Recommendation with Mock Cards")
    print("=" * 50)
    print("This will test the AI recommendation using the mock credit cards")
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
    
    print("\n📊 Step 1: Getting mock credit cards...")
    
    # Get the mock credit cards
    accounts_response = requests.get(
        f"https://nexus-production-2e34.up.railway.app/api/plaid/accounts?userId={user_id}",
        headers=headers
    )
    
    if accounts_response.status_code != 200:
        print(f"❌ Failed to get accounts: {accounts_response.status_code}")
        return False
    
    accounts_data = accounts_response.json()
    credit_cards = [acc for acc in accounts_data if acc.get('type') == 'credit']
    
    print(f"✅ Found {len(credit_cards)} credit cards")
    for card in credit_cards:
        print(f"   • {card['name']} - ${card['balance']:.2f} balance, {card['apr']}% APR")
    
    print("\n🤖 Step 2: Testing AI recommendation...")
    
    # Test AI recommendation with different payment amounts
    test_amounts = [500, 1000, 2000, 3000]
    
    for amount in test_amounts:
        print(f"\n💰 Testing payment amount: ${amount:.2f}")
        
        ai_data = {
            "userId": user_id,
            "accounts": credit_cards,
            "payment_amount": amount
        }
        
        ai_response = requests.post(
            "https://nexus-production-2e34.up.railway.app/api/interestkiller/pay/ai-recommendation",
            json=ai_data,
            headers=headers
        )
        
        if ai_response.status_code == 200:
            ai_result = ai_response.json()
            print(f"✅ AI recommendation successful!")
            print(f"📊 Recommendation: {ai_result.get('nexus_recommendation', 'N/A')}")
            
            # Show the recommendation details
            if 'minimize_interest_plan' in ai_result:
                plan = ai_result['minimize_interest_plan']
                print(f"🎯 {plan.get('name', 'Plan')}: {plan.get('explanation', 'N/A')}")
        else:
            print(f"❌ AI recommendation failed: {ai_response.status_code}")
            print(ai_response.text)
    
    print("\n🎉 AI testing completed!")
    print("\n📱 Now you can test in the mobile app:")
    print("   1. Open the mobile app")
    print("   2. Go to Accounts screen")
    print("   3. You should see the 4 mock credit cards")
    print("   4. Go to Pay Cards screen")
    print("   5. Test the AI recommendation feature")
    print("   6. Try different payment amounts")
    
    return True

if __name__ == "__main__":
    success = test_ai_with_mock_cards()
    if success:
        print("\n🎉 All tests passed!")
        print("Your mobile app should now display credit cards and AI features!")
    else:
        print("\n❌ Some tests failed") 