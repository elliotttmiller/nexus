import requests

sample_transactions = [
    {"id": "1", "amount": 12.34, "merchant": "Starbucks", "date": "2024-06-01"},
    {"id": "2", "amount": 250.00, "merchant": "Amazon", "date": "2024-06-02"},
    {"id": "3", "amount": 5000.00, "merchant": "Tesla", "date": "2024-06-03"}
]

base_url = "http://localhost:8000/v2"

print("Testing /v2/categorize...")
resp = requests.post(f"{base_url}/categorize", json=sample_transactions)
print("Status:", resp.status_code)
print("Response:", resp.json())

print("\nTesting /v2/anomalies...")
resp = requests.post(f"{base_url}/anomalies", json=sample_transactions)
print("Status:", resp.status_code)
print("Response:", resp.json()) 