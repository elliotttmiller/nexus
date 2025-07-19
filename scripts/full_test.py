import os
import sys
import time
import requests
import json
import uuid

# Update these to your Railway deployment URLs
BACKEND_URL = "https://nexus-production-2e34.up.railway.app"
AI_URL = "https://nexus-ai-production.up.railway.app"  # Update if you have a separate AI service URL

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
    print("Testing protected endpoint...")
    r = requests.get(f"{BACKEND_URL}/api/users/profile?userId=1", headers={"Authorization": f"Bearer {token}"})
    print("Profile response:", r.text)
    print("API tests passed.")

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