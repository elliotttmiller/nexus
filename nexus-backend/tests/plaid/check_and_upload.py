import requests
import time

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"
PLAID_BASE_URL = "https://sandbox.plaid.com"
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"

TEST_USERS = [
    {"desc": "Credit profile excellent", "username": "user_credit_profile_excellent", "password": "any"},
    {"desc": "Credit profile good", "username": "user_credit_profile_good", "password": "any"},
]

def login_to_user_account():
    """Login to the user's actual account"""
    email = "eliotttmiller@hotmail.com"
    password = "elliott"
    
    try:
        r = requests.post(f"{API_BASE_URL}/auth/login", json={"email": email, "password": password})
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Logged in as: {email}")
            print(f"👤 User ID: {data.get('userId', 'Unknown')}")
            return data["token"], data.get("userId", 1), email
        else:
            print(f"❌ Login failed for {email}")
            print(f"Status code: {r.status_code}")
            print(f"Response: {r.text}")
            return None, None, None
    except Exception as e:
        print(f"❌ Error logging in: {e}")
        return None, None, None

def get_link_token(token, user_id):
    r = requests.post(f"{API_BASE_URL}/plaid/create_link_token", 
                     headers={"Authorization": f"Bearer {token}"},
                     json={"userId": user_id})
    data = r.json()
    print(f"🔗 Link token response: {data.get('link_token', 'None')}")
    return data.get("link_token")

def create_sandbox_public_token(username, password):
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "institution_id": "ins_109508",
        "initial_products": ["auth", "transactions", "identity", "liabilities"],
        "options": {
            "override_username": username,
            "override_password": password
        }
    }
    r = requests.post(f"{PLAID_BASE_URL}/sandbox/public_token/create", json=payload)
    data = r.json()
    print(f"🏦 Sandbox public_token response: {data.get('public_token', 'None')}")
    return data.get("public_token"), data.get("institution_id")

def exchange_public_token(token, public_token, user_id, institution=None):
    payload = {"public_token": public_token, "userId": user_id}
    if institution:
        payload["institution"] = institution
    r = requests.post(f"{API_BASE_URL}/plaid/exchange_public_token", 
                     headers={"Authorization": f"Bearer {token}"},
                     json=payload)
    data = r.json()
    print(f"💳 Exchange public_token response: {data.get('access_token', 'None')}")
    return data

def upload_credit_profile(test, token, user_id):
    print(f"\n{'='*60}")
    print(f"🧪 Uploading: {test['desc']}")
    print(f"👤 Username: {test['username']}")
    print(f"🔑 Password: {test['password']}")
    print(f"{'='*60}")
    link_token = get_link_token(token, user_id)
    if not link_token:
        print("❌ Failed to get link token. Skipping.")
        return False
    public_token, institution_id = create_sandbox_public_token(test['username'], test['password'])
    if not public_token:
        print("❌ Failed to create sandbox public_token. Skipping.")
        return False
    exchange_result = exchange_public_token(token, public_token, user_id, institution="First Platypus Bank")
    if 'access_token' in exchange_result:
        print("✅ Credit profile uploaded successfully.")
        return True
    else:
        print("❌ Failed to upload credit profile.")
        return False

def main():
    print("🔍 Logging into your account and uploading test data...")
    token, user_id, email = login_to_user_account()
    
    if not token:
        print("❌ Failed to login. Please check your credentials.")
        return
    
    print(f"🎯 Uploading to User ID: {user_id} (Email: {email})")
    
    for test in TEST_USERS:
        upload_credit_profile(test, token, user_id)
        time.sleep(1)
    
    print(f"\n✅ Done! Test data uploaded to your account (User ID: {user_id})")
    print("📱 Now refresh your app to see the test data.")

if __name__ == "__main__":
    main() 