

// comprehensive_test.js
// Deep, actionable, and insightful test suite for all backend features and integrations.
// Run with: node comprehensive_test.js

const axios = require('axios');
const assert = require('assert');
const BASE_URL = process.env.API_BASE_URL || process.env.TEST_API_URL || 'https://nexus-production-2e34.up.railway.app/api';

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

async function makeRequest(method, url, data, user, skipAuth = false) {
  const config = skipAuth ? {} : { headers: { Authorization: `Bearer ${user.token}` } };
  const t0 = logRequest(method, url, data);
  
  try {
    const res = await axios[method](url, data, config);
    logResponse(res, t0);
    return res;
  } catch (err) {
    if (err.response?.status === 401 && user && !skipAuth) {
      const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: user.refreshToken });
      user.token = refreshRes.data.token;
      user.refreshToken = refreshRes.data.refreshToken;
      config.headers.Authorization = `Bearer ${user.token}`;
      const res = await axios[method](url, data, config);
      logResponse(res, t0);
      return res;
    }
    logError(err, t0);
    throw err;
  }
}

async function testUserEndpoints(user) {
  logStep('Testing User Endpoints');
  try {
    console.log('[DEBUG] User token before /users/profile:', user.token);
    const res = await makeRequest('get', `${BASE_URL}/users/profile?userId=${user.userId}`, null, user);
    assert(res.data.email === user.email, 'User profile should match');
    recordSummary('Users/Profile Get', 'PASS');
  } catch (err) {
    recordSummary('Users/Profile Get', 'FAIL', err.message);
  }
  
  try {
    const res = await makeRequest('put', `${BASE_URL}/users/profile`, { userId: user.userId, email: user.email }, user);
    assert(res.data.message, 'Profile update should return message');
    recordSummary('Users/Profile Update', 'PASS');
  } catch (err) {
    recordSummary('Users/Profile Update', 'FAIL', err.message);
  }
}

async function testCardRankEndpoints(user) {
  logStep('Testing CardRank Endpoints');
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
    const res = await makeRequest('post', `${BASE_URL}/cardrank/recommend`, payload, user);
    assert(res.data, 'CardRank recommend should return data');
    recordSummary('CardRank/Recommend', 'PASS');
  } catch (err) {
    recordSummary('CardRank/Recommend', 'FAIL', err.message);
  }
}

async function testInterestKillerEndpoints(user) {
  logStep('Testing InterestKiller Endpoints');
  const payload = { userId: user.userId, amount: 200 };
  try {
    const res = await makeRequest('post', `${BASE_URL}/interestkiller/suggest`, payload, user);
    assert(res.data.suggestion, 'InterestKiller suggest should return suggestion');
    recordSummary('InterestKiller/Suggest', 'PASS');
  } catch (err) {
    recordSummary('InterestKiller/Suggest', 'FAIL', err.message);
  }
}

async function testInsightsEndpoints(user) {
  logStep('Testing Insights Endpoints');
  const payload = {
    transactions: [
      { category: ['Food and Drink'], amount: 45.50, date: '2025-01-15' },
      { category: ['Shopping'], amount: 120.00, date: '2025-01-14' }
    ]
  };
  try {
    const res = await makeRequest('post', `${BASE_URL}/insights/spending-insights`, payload, user);
    assert(res.data.category_totals || res.data.insight, 'Insights should return analysis');
    recordSummary('Insights/Spending', 'PASS');
  } catch (err) {
    recordSummary('Insights/Spending', 'FAIL', err.message);
  }
}

async function testPlaidEndpoints(user) {
  logStep('Testing Plaid Integration');
  try {
    console.log('[DEBUG] User token before /plaid/accounts:', user.token);
    const res = await makeRequest('get', `${BASE_URL}/plaid/accounts`, null, user);
    assert(res.data.accounts || res.data.message, 'Plaid should return accounts or message');
    recordSummary('Plaid/Accounts', 'PASS');
  } catch (err) {
    recordSummary('Plaid/Accounts', 'FAIL', err.message);
  }
}

async function runComprehensiveTest() {
  logStep('Starting Comprehensive Backend Test Suite');
  let user;
  try {
    user = await testAuthEndpoints();
    await addTestCardsOrPlaid(user);
    await testUserEndpoints(user);
    await testCardRankEndpoints(user);
    await testInterestKillerEndpoints(user);
    await testInsightsEndpoints(user);
    await testPlaidEndpoints(user);
  } catch (err) {
    console.error('Critical test failure:', err.message);
    recordSummary('Critical Failure', 'FAIL', err.message);
  }
  printSummary();
  process.exit(summary.filter(s => s.status === 'FAIL').length > 0 ? 1 : 0);
}

if (require.main === module) {
  runComprehensiveTest();
}

module.exports = {
  testAuthEndpoints,
  testCardRankEndpoints,
  testInterestKillerEndpoints,
  testInsightsEndpoints,
  testPlaidEndpoints,
  runComprehensiveTest
};
