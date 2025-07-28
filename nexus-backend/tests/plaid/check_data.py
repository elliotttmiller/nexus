import requests

API_BASE_URL = "https://nexus-production-2e34.up.railway.app/api"

def check_user_data():
    """Check what data exists for different users"""
    
    # Try to get data for user ID 1 (which your app is using)
    print("🔍 Checking data for User ID 1...")
    try:
        r = requests.get(f"{API_BASE_URL}/plaid/accounts?userId=1")
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Accounts found: {len(data) if isinstance(data, list) else 'Not a list'}")
            print(f"Data: {data}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*50)
    
    # Try to get transactions for user ID 1
    print("🔍 Checking transactions for User ID 1...")
    try:
        r = requests.get(f"{API_BASE_URL}/plaid/transactions?userId=1")
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Transactions found: {len(data) if isinstance(data, list) else 'Not a list'}")
            print(f"Data: {data}")
        else:
            print(f"Error: {r.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_user_data() 