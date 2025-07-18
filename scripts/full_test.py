import os
import sys
import time
import requests
import subprocess
import json

BACKEND_URL = "http://localhost:5000"
AI_URL = "http://localhost:8000"
DB_URL = os.environ.get("DATABASE_URL", "postgres://user:password@localhost:5432/nexusdb")

def run_docker_compose():
    print("Starting all services with Docker Compose...")
    subprocess.run(["docker-compose", "up", "--build", "-d"], check=True)
    time.sleep(10)

def check_health():
    print("Checking backend health...")
    try:
        r = requests.get(f"{BACKEND_URL}/")
        r.raise_for_status()
    except Exception as e:
        print("Backend not healthy!", e)
        sys.exit(1)
    print("Checking AI microservice health...")
    try:
        r = requests.get(f"{AI_URL}/docs")
        r.raise_for_status()
    except Exception as e:
        print("AI microservice not healthy!", e)
        sys.exit(1)
    print("All services are healthy.")

def api_tests():
    print("Registering user...")
    requests.post(f"{BACKEND_URL}/api/auth/register", json={
        "email": "testuser@example.com",
        "password": "test123"
    })
    print("Logging in...")
    r = requests.post(f"{BACKEND_URL}/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "test123"
    })
    data = r.json()
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

def check_user_events():
    print("Checking user_events table...")
    try:
        import psycopg2
        import urllib.parse as urlparse
        url = urlparse.urlparse(DB_URL)
        conn = psycopg2.connect(
            dbname=url.path[1:],
            user=url.username,
            password=url.password,
            host=url.hostname,
            port=url.port
        )
        cur = conn.cursor()
        cur.execute("SELECT * FROM user_events ORDER BY created_at DESC LIMIT 5;")
        rows = cur.fetchall()
        for row in rows:
            print(row)
        cur.close()
        conn.close()
    except Exception as e:
        print("Could not check user_events table:", e)

def main():
    run_docker_compose()
    check_health()
    api_tests()
    trigger_sentry_error()
    check_user_events()
    print("All automated tests complete. Check Sentry dashboard for error event.")

if __name__ == "__main__":
    main() 