import requests

# Plaid sandbox credentials (replace with your actual values if needed)
PLAID_CLIENT_ID = "6878c62f8325000026a8eb6f"
PLAID_SECRET = "7bf17d0cab6c264862db25dbb58516"
INSTITUTION_ID = "ins_109508"  # First Platypus Bank
API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"
USER_EMAIL = "elliotttmiller@hotmail.com"
USER_PASSWORD = "elliott"

# 1. Register or login to get a token

login_data = {"email": USER_EMAIL, "password": USER_PASSWORD}
login_response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
if login_response.status_code != 200:
    print("Login failed:", login_response.text)
    exit(1)
token = login_response.json().get("token")
user = login_response.json().get("user")
user_id = None
if user and user.get("id"):
    user_id = user["id"]
else:
    # Fallback: fetch user profile
    profile_resp = requests.get(f"{API_BASE_URL}/auth/profile", headers={"Authorization": f"Bearer {token}"})
    if profile_resp.status_code == 200:
        user_id = profile_resp.json().get("id")
if not user_id:
    print("Could not determine user_id after login. Aborting.")
    exit(1)
print(f"Logged in as {USER_EMAIL} (user_id={user_id})")

# 2. Create a Plaid sandbox public token for a credit card account
payload = {
    "client_id": PLAID_CLIENT_ID,
    "secret": PLAID_SECRET,
    "institution_id": INSTITUTION_ID,
    "initial_products": ["auth", "transactions", "identity", "liabilities"],
    "options": {
        "override_username": "user_good",
        "override_password": "pass_good"
    }
}
resp = requests.post("https://sandbox.plaid.com/sandbox/public_token/create", json=payload)
public_token = resp.json().get("public_token")
print("Plaid sandbox public_token:", public_token)

# 3. Exchange the public token with your backend
exchange_data = {"public_token": public_token, "userId": user_id, "institution": "First Platypus Bank"}
exchange_resp = requests.post(f"{API_BASE_URL}/plaid/exchange_public_token", headers={"Authorization": f"Bearer {token}"}, json=exchange_data)
print("Exchange response:", exchange_resp.json())

# 4. Fetch accounts to verify credit card presence
accounts_resp = requests.get(f"{API_BASE_URL}/plaid/accounts?userId={user_id}", headers={"Authorization": f"Bearer {token}"})
print("Accounts response:", accounts_resp.json())
