import requests

BASE_URL = "http://127.0.0.1:8000/v2"

payload = {
    "transactions": [
        {"id": "t1", "amount": 7.50, "merchant": "STARBUCKS 123", "date": "2025-07-21"},
        {"id": "t2", "amount": 149.99, "merchant": "AMAZON.COM*AX2BC", "date": "2025-07-21"}
    ]
}

print("Testing /v2/categorize...")
resp = requests.post(f"{BASE_URL}/categorize", json=payload)
print("Status:", resp.status_code)
print("Raw Response:", resp.text)

print("\nTesting /v2/anomalies...")
resp = requests.post(f"{BASE_URL}/anomalies", json=payload)
print("Status:", resp.status_code)
print("Raw Response:", resp.text) 