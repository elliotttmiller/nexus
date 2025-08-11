const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'https://nexus-production-2e34.up.railway.app/api';
const TRANSACTION_ID = 1; // Change if needed
const USER_EMAIL = 'elliotttmiller@hotmail.com';
const USER_PASSWORD = 'elliott';

async function main() {
  try {
    // 1. Log in to get JWT token
    const loginResp = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: USER_EMAIL,
      password: USER_PASSWORD
    });
    const token = loginResp.data.token;
    if (!token) throw new Error('No token returned from login');

    // 2. Call the AI analysis endpoint with Authorization header
    const resp = await axios.get(
      `${API_BASE_URL}/plaid/transaction/${TRANSACTION_ID}/ai-analysis`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('CardRank AI Analysis Result:');
    console.dir(resp.data, { depth: null });
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Request Error:', err.message);
    }
  }
}

main();
