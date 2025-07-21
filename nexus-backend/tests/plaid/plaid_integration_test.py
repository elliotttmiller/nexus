import requests
import json
import time

API_BASE_URL = "http://localhost:8080/api"
PLAID_BASE_URL = "https://sandbox.plaid.com"
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"  # Replace with your real client_id
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"  # Replace with your real secret

# Plaid sandbox test users and scenarios
TEST_USERS = [
    {"desc": "Basic account linking", "username": "user_good", "password": "pass_good"},
    {"desc": "Transactions testing", "username": "user_transactions_dynamic", "password": "any"},
    {"desc": "Micro-deposit/ACH", "username": "user_good", "password": "microdeposits_good"},
    {"desc": "Credit profile excellent", "username": "user_credit_profile_excellent", "password": "any"},
    {"desc": "MFA device", "username": "user_good", "password": "mfa_device"},
    {"desc": "Error ITEM_LOCKED", "username": "user_good", "password": "error_ITEM_LOCKED"},
]

USER_EMAIL = "test_plaid_ai@example.com"
USER_PASSWORD = "testpassword"


def register_or_login():
    r = requests.post(f"{API_BASE_URL}/auth/register", json={"email": USER_EMAIL, "password": USER_PASSWORD})
    if r.status_code == 200:
        data = r.json()
        print("Registered new user.")
        return data["token"], data["refreshToken"], data.get("userId", 1)
    else:
        r = requests.post(f"{API_BASE_URL}/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
        data = r.json()
        print("Logged in as existing user.")
        return data["token"], data["refreshToken"], data.get("userId", 1)

def get_link_token(token, user_id=1):
    r = requests.post(f"{API_BASE_URL}/plaid/create_link_token", 
                     headers={"Authorization": f"Bearer {token}"},
                     json={"userId": user_id})
    data = r.json()
    print("Link token response:", data)
    return data.get("link_token")

def create_sandbox_public_token(username, password):
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "institution_id": "ins_109508",  # First Platypus Bank
        "initial_products": ["auth", "transactions"],
        "options": {
            "override_username": username,
            "override_password": password
        }
    }
    r = requests.post(f"{PLAID_BASE_URL}/sandbox/public_token/create", json=payload)
    data = r.json()
    print("Sandbox public_token response:", data)
    return data.get("public_token"), data.get("institution_id")

def exchange_public_token(token, public_token, user_id=1, institution=None):
    payload = {"public_token": public_token, "userId": user_id}
    if institution:
        payload["institution"] = institution
    r = requests.post(f"{API_BASE_URL}/plaid/exchange_public_token", 
                     headers={"Authorization": f"Bearer {token}"},
                     json=payload)
    data = r.json()
    print("Exchange public_token response:", data)
    return data

def fetch_accounts(token, user_id=1):
    r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}",
                    headers={"Authorization": f"Bearer {token}"})
    data = r.json()
    print("Accounts:", json.dumps(data, indent=2))
    return data

def run_tests():
    token, refresh_token, user_id = register_or_login()
    for test in TEST_USERS:
        print(f"\n--- Testing: {test['desc']} ---")
        link_token = get_link_token(token, user_id)
        if not link_token:
            print("Failed to get link token. Skipping test.")
            continue
        public_token, institution_id = create_sandbox_public_token(test['username'], test['password'])
        if not public_token:
            print("Failed to create sandbox public_token. Skipping test.")
            continue
        exchange_public_token(token, public_token, user_id, institution="First Platypus Bank")
        fetch_accounts(token, user_id)
        time.sleep(1)
    print("\nAll tests completed.")

if __name__ == "__main__":
    run_tests() 