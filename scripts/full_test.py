import requests
import json

API_BASE_URL = 'https://nexus-production-2e34.up.railway.app'  # Use Railway production backend
BASE_URL = f'{API_BASE_URL}/api'
EMAIL = 'elliotttmiller@hotmail.com'  # Use a real or test user
PASSWORD = 'elliott'            # Use the correct password for the test user

token = None
refresh_token = None

def login():
    global token, refresh_token
    print('Logging in...')
    resp = requests.post(f'{BASE_URL}/auth/login', json={'email': EMAIL, 'password': PASSWORD})
    if resp.status_code == 200:
        data = resp.json()
        token = data.get('token')
        refresh_token = data.get('refreshToken')
        print('Login successful.')
    else:
        print('Login failed:', resp.status_code, resp.text)
        token = None
        refresh_token = None

def refresh_jwt():
    global token, refresh_token
    print('Refreshing JWT...')
    resp = requests.post(f'{BASE_URL}/auth/refresh', json={'refreshToken': refresh_token})
    if resp.status_code == 200:
        data = resp.json()
        token = data.get('token')
        refresh_token = data.get('refreshToken')
        print('Token refreshed.')
    else:
        print('Token refresh failed:', resp.status_code, resp.text)
        token = None
        refresh_token = None

def test_endpoint(path, payload, protected=False):
    url = f'{BASE_URL}{path}'
    headers = {'Content-Type': 'application/json'}
    if protected and token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        res = requests.post(url, json=payload, headers=headers)
        if protected and res.status_code == 401 and refresh_token:
            print(f'401 Unauthorized for {path}, attempting token refresh...')
            refresh_jwt()
            headers['Authorization'] = f'Bearer {token}'
            res = requests.post(url, json=payload, headers=headers)
        print(f'\nTesting {path}...')
        print('Status:', res.status_code)
        try:
            data = res.json()
            print('Response:', json.dumps(data, indent=2))
        except Exception:
            print('Raw Response:', res.text)
    except Exception as e:
        print(f'Error testing {path}:', str(e))

def test_get_accounts():
    print('\nTesting /plaid/accounts...')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        res = requests.get(f'{BASE_URL}/plaid/accounts?userId=1', headers=headers)
        print('Status:', res.status_code)
        try:
            data = res.json()
            print('Response:', json.dumps(data, indent=2))
        except Exception:
            print('Raw Response:', res.text)
    except Exception as e:
        print(f'Error testing /plaid/accounts:', str(e))

def get_accounts():
    print('\nGetting linked accounts for userId=1...')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        res = requests.get(f'{BASE_URL}/users/data-access?userId=1', headers=headers)
        if res.status_code == 401 and refresh_token:
            print('401 Unauthorized, attempting token refresh...')
            refresh_jwt()
            headers['Authorization'] = f'Bearer {token}'
            res = requests.get(f'{BASE_URL}/users/data-access?userId=1', headers=headers)
        print('Status:', res.status_code)
        try:
            data = res.json()
            print('Accounts:', json.dumps(data, indent=2))
            return data
        except Exception:
            print('Raw Response:', res.text)
            return []
    except Exception as e:
        print(f'Error getting accounts:', str(e))
        return []

def unlink_all_accounts():
    accounts = get_accounts()
    if not accounts or not isinstance(accounts, list):
        print('No accounts to unlink.')
        return
    for acc in accounts:
        acc_id = acc.get('id')
        if not acc_id:
            continue
        print(f'Unlinking account {acc_id}...')
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        try:
            res = requests.delete(f'{BASE_URL}/users/data-access/{acc_id}', headers=headers)
            if res.status_code == 401 and refresh_token:
                print('401 Unauthorized on delete, attempting token refresh...')
                refresh_jwt()
                headers['Authorization'] = f'Bearer {token}'
                res = requests.delete(f'{BASE_URL}/users/data-access/{acc_id}', headers=headers)
            print(f'Account {acc_id} unlink status:', res.status_code)
        except Exception as e:
            print(f'Error unlinking account {acc_id}:', str(e))

def test_ai_recommendation():
    print('\nTesting AI Recommendation...')
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    payload = {
        "userId": 1,
        "accounts": [
            {"id": "mock_credit_1", "institution": "Mock Bank", "balance": 2500, "type": "credit", "apr": 19.99, "creditLimit": 8000},
            {"id": "mock_credit_2", "institution": "Mock Bank", "balance": 1500, "type": "credit", "apr": 24.99, "creditLimit": 5000},
            {"id": "mock_credit_3", "institution": "Mock Bank", "balance": 500, "type": "credit", "apr": 16.49, "creditLimit": 3000},
            {"id": "mock_credit_4", "institution": "Mock Bank", "balance": 4200, "type": "credit", "apr": 29.99, "creditLimit": 12000}
        ],
        "payment_amount": 1000
    }
    try:
        res = requests.post(f'{BASE_URL}/interestkiller/pay/ai-recommendation', json=payload, headers=headers)
        print('Status:', res.status_code)
        try:
            data = res.json()
            print('Response:', json.dumps(data, indent=2))
        except Exception:
            print('Raw Response:', res.text)
    except Exception as e:
        print(f'Error testing AI Recommendation:', str(e))

if __name__ == '__main__':
    login()
    unlink_all_accounts()
    test_get_accounts()
    test_ai_recommendation()

    test_endpoint('/cardrank/recommend', {
        'userId': 1,
        'merchant': 'STARBUCKS',
        'category': 'Food & Drink',
        'amount': 7.5,
        'location': 'New York, NY',
        'primaryGoal': 'MAXIMIZE_CASHBACK',
        'creditScoreInfo': { 'score': 750, 'utilization': 0.25 }
    }, protected=True)

    test_endpoint('/interestkiller/suggest', {
        'userId': 1,
        'amount': 200,
        'optimizationGoal': 'MINIMIZE_INTEREST_COST'
    }, protected=True)

    test_endpoint('/test', {}, protected=True)

    test_endpoint('/insights/spending-insights', {
        'transactions': [
            { 'id': 't1', 'amount': 50, 'category': 'Food & Drink' },
            { 'id': 't2', 'amount': 100, 'category': 'Shopping' }
        ]
    })

    test_endpoint('/insights/budget-health', {
        'user_budget': { 'Food & Drink': 100, 'Shopping': 200 },
        'transactions': [
            { 'id': 't1', 'amount': 50, 'category': 'Food & Drink' },
            { 'id': 't2', 'amount': 250, 'category': 'Shopping' }
        ]
    })

    test_endpoint('/insights/cash-flow-prediction', {
        'accounts': [ { 'id': 'a1', 'balance': 500 } ],
        'upcoming_bills': [ { 'id': 'b1', 'amount': 600, 'due_date': '2024-07-01' } ],
        'transactions': [ { 'id': 't1', 'amount': 50, 'category': 'Food & Drink' } ]
    }) 