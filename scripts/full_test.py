import requests
import json

BASE_URL = 'http://localhost:8080/api'
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

if __name__ == '__main__':
    login()

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