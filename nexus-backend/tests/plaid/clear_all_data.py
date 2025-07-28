import requests
import json

def clear_all_data():
    print("🧹 Clearing All Data - Fresh Start")
    print("=" * 50)
    print("This will remove all linked accounts and data")
    print("so we can start fresh with mock cards")
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
    
    print("\n🗑️ Clearing all data...")
    
    # Clear all data with one comprehensive endpoint
    print("🧹 Clearing all accounts, cards, and transactions...")
    try:
        clear_response = requests.post(
            "https://nexus-production-2e34.up.railway.app/api/plaid/clear-all-data",
            headers=headers
        )
        
        if clear_response.status_code == 200:
            result = clear_response.json()
            print("✅ All data cleared successfully!")
            print(f"📊 {result.get('message', 'Data cleared')}")
        else:
            print(f"❌ Failed to clear data: {clear_response.status_code}")
            print(clear_response.text)
            return False
            
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        return False
    
    print("\n✅ Data clearing completed!")
    print("\n📱 Now you can:")
    print("   1. Add fresh mock credit cards")
    print("   2. Test the mobile app with clean data")
    print("   3. Verify AI features work properly")
    
    return True

if __name__ == "__main__":
    success = clear_all_data()
    if success:
        print("\n🎉 Data cleared successfully!")
        print("Ready for fresh start with mock cards!")
    else:
        print("\n❌ Failed to clear data") 