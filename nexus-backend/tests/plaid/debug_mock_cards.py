import requests
import json

def debug_mock_cards():
    print("🔍 Debugging Mock Cards Endpoint")
    print("=" * 50)
    print("This will debug what's happening with the mock cards endpoint")
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
    
    print("\n🌐 Calling mock cards endpoint...")
    
    # Call the add mock cards endpoint
    add_cards_response = requests.post(
        "https://nexus-production-2e34.up.railway.app/api/plaid/add-mock-cards",
        headers=headers
    )
    
    print(f"📊 Response status: {add_cards_response.status_code}")
    print(f"📊 Response headers: {dict(add_cards_response.headers)}")
    print(f"📊 Response text: {add_cards_response.text}")
    
    if add_cards_response.status_code == 200:
        try:
            result = add_cards_response.json()
            print(f"📊 Parsed JSON: {json.dumps(result, indent=2)}")
        except Exception as e:
            print(f"❌ Could not parse JSON: {e}")
    else:
        print(f"❌ Request failed: {add_cards_response.status_code}")
    
    return True

if __name__ == "__main__":
    success = debug_mock_cards()
    if success:
        print("\n✅ Debug completed!")
    else:
        print("\n❌ Debug failed") 