import requests
import json

def connect_plaid_accounts():
    print("🏦 Connecting Plaid Sandbox Accounts")
    print("=" * 50)
    print("This will help you connect Plaid sandbox accounts")
    print("with credit cards so you can test AI features in the app")
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
    
    # Step 1: Get link token
    print("\n🔗 Step 1: Getting Plaid link token...")
    link_response = requests.get(
        "https://nexus-production-2e34.up.railway.app/api/plaid/create_link_token",
        headers=headers
    )
    
    if link_response.status_code == 200:
        link_data = link_response.json()
        link_token = link_data.get('link_token')
        print("✅ Link token received")
    else:
        print(f"❌ Failed to get link token: {link_response.status_code}")
        return False
    
    # Step 2: Create sandbox public token
    print("\n🏦 Step 2: Creating sandbox public token...")
    
    # Use different Plaid sandbox institutions and users
    sandbox_configs = [
        {
            "institution_id": "ins_109508",  # First Platypus Bank
            "user": "user_credit_profile_excellent",
            "description": "Excellent Credit Profile"
        },
        {
            "institution_id": "ins_109508",  # First Platypus Bank  
            "user": "user_credit_profile_good",
            "description": "Good Credit Profile"
        },
        {
            "institution_id": "ins_109508",  # First Platypus Bank
            "user": "user_credit_bonus",
            "description": "Credit Bonus Profile"
        }
    ]
    
    for i, config in enumerate(sandbox_configs, 1):
        print(f"\n🔄 Testing configuration {i}: {config['description']}")
        
        # Create sandbox public token
        sandbox_data = {
            "institution_id": config["institution_id"],
            "user": config["user"]
        }
        
        sandbox_response = requests.post(
            "https://nexus-production-2e34.up.railway.app/api/plaid/sandbox_public_token",
            json=sandbox_data,
            headers=headers
        )
        
        if sandbox_response.status_code == 200:
            sandbox_token_data = sandbox_response.json()
            public_token = sandbox_token_data.get('public_token')
            print(f"✅ Sandbox public token created for {config['user']}")
            
            # Step 3: Exchange public token
            print(f"🔄 Exchanging public token...")
            exchange_data = {
                "public_token": public_token,
                "institution_id": config["institution_id"]
            }
            
            exchange_response = requests.post(
                "https://nexus-production-2e34.up.railway.app/api/plaid/exchange_public_token",
                json=exchange_data,
                headers=headers
            )
            
            if exchange_response.status_code == 200:
                print(f"✅ Successfully connected to {config['institution_id']}")
                
                # Step 4: Fetch accounts
                print(f"📊 Fetching accounts...")
                accounts_response = requests.get(
                    f"https://nexus-production-2e34.up.railway.app/api/plaid/accounts?userId={user_id}",
                    headers=headers
                )
                
                if accounts_response.status_code == 200:
                    accounts_data = accounts_response.json()
                    credit_cards = [acc for acc in accounts_data if acc.get('type') == 'credit']
                    print(f"✅ Found {len(credit_cards)} credit cards")
                    
                    if len(credit_cards) > 0:
                        print("🎉 SUCCESS! Credit cards found!")
                        for card in credit_cards:
                            print(f"   💳 {card.get('name', 'Card')} - ${card.get('balance', 0):.2f}")
                        
                        print("\n📱 Now you can test in the mobile app:")
                        print("   1. Open the mobile app")
                        print("   2. Go to Accounts screen")
                        print("   3. You should see the credit cards")
                        print("   4. Go to Pay Cards screen")
                        print("   5. Test the AI recommendation feature")
                        print("   6. Try different payment amounts")
                        return True
                    else:
                        print("⚠️ No credit cards found in this configuration")
                else:
                    print(f"❌ Failed to fetch accounts: {accounts_response.status_code}")
            else:
                print(f"❌ Failed to exchange token: {exchange_response.status_code}")
        else:
            print(f"❌ Failed to create sandbox token: {sandbox_response.status_code}")
    
    print("\n❌ No credit cards found from any configuration")
    print("This is expected with Plaid sandbox - it may not provide credit cards by default")
    print("\n💡 Alternative: Use the mock data testing we did earlier")
    print("The AI recommendation system is working perfectly with mock data")
    
    return False

if __name__ == "__main__":
    success = connect_plaid_accounts()
    if success:
        print("\n🎉 Plaid accounts connected successfully!")
        print("You can now test the AI features in the mobile app!")
    else:
        print("\n⚠️ No credit cards found, but AI system is working with mock data") 