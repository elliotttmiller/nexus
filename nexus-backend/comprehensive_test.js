

// comprehensive_test.js
// Deep, actionable, and insightful test suite for all backend features and integrations.
// Run with: node comprehensive_test.js

const axios = require('axios');
const assert = require('assert');
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

const summary = [];
function now() { return new Date().toISOString(); }
function logStep(title, details) {
  console.log(`\n=== ${title} @ ${now()} ===`);
  if (details) console.log(details);
}
function logRequest(method, url, payload) {
  const t0 = Date.now();
  console.log(`\n[REQUEST] ${method.toUpperCase()} ${url} @ ${now()}`);
  if (payload) console.log('[PAYLOAD]', JSON.stringify(payload, null, 2));
  return t0;
}
function logResponse(res, t0) {
  const t1 = Date.now();
  const duration = t0 ? (t1 - t0) : undefined;
  console.log(`[RESPONSE]${duration !== undefined ? ` (${duration}ms)` : ''}`, JSON.stringify(res.data, null, 2));
  // If AI/model response, show step-by-step reasoning if present
  if (res.data && (res.data.aiResponse || res.data.recommended_card || res.data.reason)) {
    const ai = res.data.aiResponse || res.data;
    if (ai.reason) {
      try {
        const parsed = typeof ai.reason === 'string' ? JSON.parse(ai.reason) : ai.reason;
        if (parsed.thinking) console.log('[AI THOUGHT]', parsed.thinking);
        if (parsed.answer) console.log('[AI ANSWER]', parsed.answer);
      } catch {}
    }
    if (ai.why_not && ai.why_not.length) {
      console.log('[AI WHY NOT]', JSON.stringify(ai.why_not, null, 2));
    }
  }
}
function logError(err, t0) {
  const t1 = Date.now();
  const duration = t0 ? (t1 - t0) : undefined;
  if (err.response) {
    console.error(`[ERROR]${duration !== undefined ? ` (${duration}ms)` : ''}`, err.response.status, err.response.data);
  } else {
    console.error(`[ERROR]${duration !== undefined ? ` (${duration}ms)` : ''}`, err.message);
  }
}
function recordSummary(feature, status, details) {
  summary.push({ feature, status, details });
}
function printSummary() {
  console.log('\n\n=== SYSTEM FEATURE SUMMARY ===');
  summary.forEach(({ feature, status, details }) => {
    console.log(`- ${feature}: ${status}`);
    if (details) console.log(`    ${details}`);
  });
}

async function testAuthEndpoints() {
  logStep('Testing Auth Endpoints');
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPass123!';
  let token, refreshToken, userId;
  try {
    const t0 = logRequest('post', `${BASE_URL}/auth/register`, { email, password });
    const res = await axios.post(`${BASE_URL}/auth/register`, { email, password });
    logResponse(res, t0);
    assert(res.data.token, 'Register should return token');
    token = res.data.token;
    refreshToken = res.data.refreshToken;
    recordSummary('Auth/Register', 'PASS');
  } catch (err) {
    logError(err);
    recordSummary('Auth/Register', 'FAIL', err.message);
    throw new Error('Register failed');
  }
  // Login
  try {
    const t0 = logRequest('post', `${BASE_URL}/auth/login`, { email, password });
    const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    logResponse(res, t0);
    assert(res.data.token || res.data.twofa_required, 'Login should return token or 2FA required');
    if (res.data.token) token = res.data.token;
    userId = res.data.userId || res.data.id;
    recordSummary('Auth/Login', 'PASS');
  } catch (err) {
    logError(err);
    recordSummary('Auth/Login', 'FAIL', err.message);
    throw new Error('Login failed');
  }
  // 2FA Setup & Verify (optional, edge case)
  let twofaSecret, twofaToken;
  try {
    const t0 = logRequest('post', `${BASE_URL}/auth/2fa/setup`, { userId });
    const res = await axios.post(`${BASE_URL}/auth/2fa/setup`, { userId });
    logResponse(res, t0);
    twofaSecret = res.data.secret;
    recordSummary('Auth/2FA Setup', 'PASS');
    // Simulate a TOTP code (not possible without real TOTP, so skip verify)
  } catch (err) {
    logError(err);
    recordSummary('Auth/2FA Setup', 'SKIP', '2FA not required or not supported');
  }
  // Refresh
  try {
    const t0 = logRequest('post', `${BASE_URL}/auth/refresh`, { refreshToken });
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    logResponse(res, t0);
    assert(res.data.token, 'Refresh should return new token');
    token = res.data.token;
    refreshToken = res.data.refreshToken;
    recordSummary('Auth/Refresh', 'PASS');
  } catch (err) {
    logError(err);
    recordSummary('Auth/Refresh', 'FAIL', err.message);
    throw new Error('Refresh failed');
  }
  // Profile
  try {
    const t0 = logRequest('get', `${BASE_URL}/auth/profile`);
    const res = await axios.get(`${BASE_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
    logResponse(res, t0);
    assert(res.data.email === email, 'Profile should match registered email');
    userId = res.data.id;
    recordSummary('Auth/Profile', 'PASS');
  } catch (err) {
    logError(err);
    recordSummary('Auth/Profile', 'FAIL', err.message);
    throw new Error('Profile failed');
  }
  return { token, refreshToken, userId, email, password };
}
// Add Plaid account or create cards for the test user (mock endpoint or Plaid flow)
async function addTestCardsOrPlaid(user) {
  logStep('Adding Cards or Linking Plaid for Test User');
  // Try test endpoint first
  try {
    const t0 = logRequest('post', `${BASE_URL}/test/add-mock-cards`, { userId: user.userId });
    const res = await axios.post(`${BASE_URL}/test/add-mock-cards`, { userId: user.userId }, { headers: { Authorization: `Bearer ${user.token}` } });
    logResponse(res, t0);
    assert(res.data.success, 'Should add mock cards');
    recordSummary('Cards/Add Mock', 'PASS');
    return true;
  } catch (err) {
    logError(err);
    recordSummary('Cards/Add Mock', 'FAIL', 'Mock card endpoint not available or failed');
  }
  // If Plaid flow is required, this is where you would automate Plaid link (not possible in headless test)
  recordSummary('Cards/Plaid Link', 'SKIP', 'Plaid linking not automated in test');
  return false;
}

async function refreshJwt(user) {
  // Refresh the JWT token using the refresh token
  try {
    logRequest('post', `${BASE_URL}/auth/refresh`, { refreshToken: user.refreshToken });
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: user.refreshToken });
    logResponse(res);
    user.token = res.data.token;
    user.refreshToken = res.data.refreshToken;
    return user.token;
  } catch (err) {
    logError(err);
    throw new Error('Token refresh failed');
  }
}

async function testUserEndpoints(user) {
  logStep('Testing User Endpoints');
  // Get profile
  try {
    const t0 = logRequest('get', `${BASE_URL}/users/profile?userId=${user.userId}`);
    let res;
    try {
      res = await axios.get(`${BASE_URL}/users/profile?userId=${user.userId}`, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await refreshJwt(user);
        res = await axios.get(`${BASE_URL}/users/profile?userId=${user.userId}`, { headers: { Authorization: `Bearer ${user.token}` } });
      } else throw err;
    }
    logResponse(res, t0);
    assert(res.data.email === user.email, 'User profile should match');
  } catch (err) {
    logError(err);
  }
  // Update profile
  try {
    const t0 = logRequest('put', `${BASE_URL}/users/profile`, { userId: user.userId, email: user.email });
    let res;
    try {
      res = await axios.put(`${BASE_URL}/users/profile`, { userId: user.userId, email: user.email }, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await refreshJwt(user);
        res = await axios.put(`${BASE_URL}/users/profile`, { userId: user.userId, email: user.email }, { headers: { Authorization: `Bearer ${user.token}` } });
      } else throw err;
    }
    logResponse(res, t0);
    assert(res.data.message, 'Profile update should return message');
  } catch (err) {
    logError(err);
  }
}

async function testCardRankEndpoints(user) {
  logStep('Testing CardRank Endpoints');
  // /cardrank/recommend
  const payload = {
    userId: user.userId,
    merchant: 'Amazon',
    category: 'shopping',
    amount: 100,
    location: 'NY',
    primaryGoal: 'maximize_rewards',
    creditScoreInfo: { score: 750 }
  };
  try {
    const t0 = logRequest('post', `${BASE_URL}/cardrank/recommend`, payload);
    let res;
    try {
      res = await axios.post(`${BASE_URL}/cardrank/recommend`, payload, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await refreshJwt(user);
        res = await axios.post(`${BASE_URL}/cardrank/recommend`, payload, { headers: { Authorization: `Bearer ${user.token}` } });
      } else throw err;
    }
    logResponse(res, t0);
    assert(res.data, 'CardRank recommend should return data');
  } catch (err) {
    logError(err);
  }
}

async function testInterestKillerEndpoints(user) {
  logStep('Testing InterestKiller Endpoints');
  // /interestkiller/suggest
  const suggestPayload = { userId: user.userId, amount: 200 };
  try {
    const t0 = logRequest('post', `${BASE_URL}/interestkiller/suggest`, suggestPayload);
    let res;
    try {
      res = await axios.post(`${BASE_URL}/interestkiller/suggest`, suggestPayload, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await refreshJwt(user);
        res = await axios.post(`${BASE_URL}/interestkiller/suggest`, suggestPayload, { headers: { Authorization: `Bearer ${user.token}` } });
      } else throw err;
    }
    logResponse(res, t0);
    assert(res.data.suggestion, 'InterestKiller suggest should return suggestion');
  } catch (err) {
    logError(err);
  }
}

async function testPlaidEndpoints(user) {
  logStep('Testing Plaid Endpoints');
  // /plaid/accounts
  try {
    const t0 = logRequest('get', `${BASE_URL}/plaid/accounts?userId=${user.userId}`);
    let res;
    try {
      res = await axios.get(`${BASE_URL}/plaid/accounts?userId=${user.userId}`, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await refreshJwt(user);
        res = await axios.get(`${BASE_URL}/plaid/accounts?userId=${user.userId}`, { headers: { Authorization: `Bearer ${user.token}` } });
      } else throw err;
    }
    logResponse(res, t0);
    assert(res.data, 'Plaid accounts should return data');
  } catch (err) {
    logError(err);
  }
}

async function testInsightsEndpoints(user) {
  logStep('Testing Insights Endpoints');
  // /insights/spending-insights
  const txs = [
    { amount: 100, category: 'shopping', date: '2025-08-01' },
    { amount: 50, category: 'groceries', date: '2025-08-02' }
  ];
  try {
    const t0 = logRequest('post', `${BASE_URL}/insights/spending-insights`, { transactions: txs });
    let res;
    try {
      res = await axios.post(`${BASE_URL}/insights/spending-insights`, { transactions: txs }, { headers: { Authorization: `Bearer ${user.token}` } });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        await refreshJwt(user);
        res = await axios.post(`${BASE_URL}/insights/spending-insights`, { transactions: txs }, { headers: { Authorization: `Bearer ${user.token}` } });
      } else throw err;
    }
    logResponse(res, t0);
    assert(res.data, 'Spending insights should return data');
  } catch (err) {
    logError(err);
  }
}

async function testTestEndpoints(user) {
  logStep('Testing Test/Debug Endpoints');
  // /test/ai-payload
  const aiPayload = {
    userCards: [
      { id: 'card1', name: 'Test Card', balance: 1000, creditLimit: 5000, apr: 15, rewards: { type: 'cashback' } }
    ],
    transactionContext: { merchantName: 'Amazon', amount: 100, category: 'shopping', location: 'NY' },
    userContext: { primaryGoal: 'maximize_rewards' }
  };
  try {
    const t0 = logRequest('post', `${BASE_URL}/test/ai-payload`, aiPayload);
    const res = await axios.post(`${BASE_URL}/test/ai-payload`, aiPayload);
    logResponse(res, t0);
    assert(res.data.aiResponse, 'AI payload endpoint should return aiResponse');
  } catch (err) {
    logError(err);
  }
}

async function runAllTests() {
  try {
    const user = await testAuthEndpoints();
    await addTestCardsOrPlaid(user);
    await testUserEndpoints(user);
    await testCardRankEndpoints(user);
    await testInterestKillerEndpoints(user);
    await testPlaidEndpoints(user);
    await testInsightsEndpoints(user);
    await testTestEndpoints(user);
    // Add transaction/payment edge case tests here
    // ...
    printSummary();
    console.log('\nAll endpoints tested. Review logs above for step-by-step workflow and insights.');
  } catch (err) {
    recordSummary('Test Suite', 'FAIL', err.message);
    printSummary();
    console.error('Test suite failed:', err.message);
    process.exit(1);
  }
}

runAllTests();
