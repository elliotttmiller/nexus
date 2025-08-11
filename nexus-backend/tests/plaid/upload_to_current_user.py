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

# Use the real app account
USER_EMAIL = "elliotttmiller@hotmail.com"
USER_PASSWORD = "elliott"

def register_or_login():
    r = requests.post(f"{API_BASE_URL}/auth/register", json={"email": USER_EMAIL, "password": USER_PASSWORD})
    if r.status_code == 200:
        data = r.json()
        print("✅ Registered new user.")
        return data["token"], data["refreshToken"], data.get("userId", 1)
    else:
        r = requests.post(f"{API_BASE_URL}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        data = r.json()
        print("✅ Logged in as existing user.")
        return data["token"], data["refreshToken"], data.get("userId", 1)

def get_link_token(token, user_id=1):
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

def exchange_public_token(token, public_token, user_id=1, institution=None):
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
    print("🚀 Uploading test credit profiles to user ID 8 (elliotttmiller@hotmail.com)...")
    token, refresh_token, _ = register_or_login()
    user_id = 8
    print(f"👤 Using user ID: {user_id}")
    
    for test in TEST_USERS:
        upload_credit_profile(test, token, user_id)
        time.sleep(1)
    
    print("\n✅ Done! Now refresh your app to see the test data.")

if __name__ == "__main__":
    main() 