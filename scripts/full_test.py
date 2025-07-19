import os
import sys
import time
import requests
import json
import uuid
import psycopg2
from urllib.parse import urlparse

# Update these to your Railway deployment URLs
BACKEND_URL = "https://nexus-production-2e34.up.railway.app"
AI_URL = "https://nexus-ai-production.up.railway.app"  # Update if you have a separate AI service URL
DB_URL = os.environ.get("DATABASE_URL", "postgres://postgres:hTckoowSOUVGSbZXigsxWBVXxlXYFAfu@shinkansen.proxy.rlwy.net:57937/railway")


def insert_test_data(user_id):
    """Insert an account, card, and transaction for the given user_id."""
    url = urlparse(DB_URL)
    conn = psycopg2.connect(
        dbname=url.path[1:],
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port
    )
    cur = conn.cursor()
    # Use account_id=1 for all test cards/transactions
    account_id = 1
    # Insert card for user_id and account_id=1
    cur.execute('''
        INSERT INTO cards (user_id, account_id, apr, balance, due_date, rewards, created_at, updated_at, card_name)
        VALUES (%s, %s, %s, %s, NOW() + INTERVAL '30 days', %s, NOW(), NOW(), %s)
        RETURNING id;
    ''', (user_id, account_id, 19.99, 500.00, json.dumps({"dining":2,"shopping":1}), 'Test Card'))
    card_id = cur.fetchone()[0]
    # Insert transaction for the new card
    cur.execute('''
        INSERT INTO transactions (card_id, amount, merchant, category, date)
        VALUES (%s, %s, %s, %s, NOW());
    ''', (card_id, 42.50, 'Amazon', 'shopping'))
    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted test card (id={card_id}) and transaction for user_id={user_id}, account_id=1.")

def check_ai_service():
    print("Checking AI service health...")
    try:
        r = requests.get(f"{AI_URL}/docs", timeout=5)
        if r.status_code == 200:
            print("AI service is reachable.")
            return True
        else:
            print(f"AI service returned status {r.status_code}")
            return False
    except Exception as e:
        print(f"AI service not reachable: {e}")
        return False

def api_tests():
    # Use a unique email for each test run
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "test123"
    print(f"Registering user {test_email}...")
    reg_resp = requests.post(f"{BACKEND_URL}/api/auth/register", json={
        "email": test_email,
        "password": test_password
    })
    print("Registration response:", reg_resp.status_code, reg_resp.text)
    print("Logging in...")
    login_resp = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    print("Login response:", login_resp.status_code, login_resp.text)
    data = login_resp.json()
    token = data.get("token")
    if not token:
        print("Login failed!")
        sys.exit(1)
    print("Token:", token)
    headers = {"Authorization": f"Bearer {token}"}
    print("Testing protected endpoint...")
    r = requests.get(f"{BACKEND_URL}/api/users/profile?userId=1", headers=headers)
    print("Profile response:", r.text)
    print("API tests passed.")

    # Insert test data for this user
    # Get the new user's id from the registration/login response or fetch from DB
    # We'll fetch from DB for robustness
    import psycopg2
    url = urlparse(DB_URL)
    conn = psycopg2.connect(
        dbname=url.path[1:],
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port
    )
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (test_email,))
    user_id = cur.fetchone()[0]
    cur.close()
    conn.close()
    insert_test_data(user_id)

    # Check AI service health
    ai_ok = check_ai_service()

    # CardRank test
    print("\nTesting CardRank endpoint...")
    cardrank_resp = requests.post(f"{BACKEND_URL}/api/cardrank/recommend", json={
        "userId": user_id,
        "merchant": "Amazon",
        "category": "shopping"
    }, headers=headers)
    print("CardRank response:", cardrank_resp.status_code, cardrank_resp.text)

    # InterestKiller test
    print("\nTesting InterestKiller endpoint...")
    ik_resp = requests.post(f"{BACKEND_URL}/api/interestkiller/suggest", json={
        "userId": user_id,
        "amount": 100
    }, headers=headers)
    print("InterestKiller response:", ik_resp.status_code, ik_resp.text)

    # Plaid transactions test
    print("\nTesting Plaid transactions endpoint...")
    plaid_resp = requests.get(f"{BACKEND_URL}/api/plaid/transactions?userId={user_id}", headers=headers)
    print("Plaid transactions response:", plaid_resp.status_code, plaid_resp.text)

def trigger_sentry_error():
    print("Triggering Sentry error...")
    try:
        requests.get(f"{BACKEND_URL}/api/test/error")
    except Exception:
        pass
    print("Check your Sentry dashboard for the error event.")

def main():
    api_tests()
    trigger_sentry_error()
    print("All automated tests complete. Check Sentry dashboard for error event.")

if __name__ == "__main__":
    main() 