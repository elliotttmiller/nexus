// e2e-ai-test-suite.js
// Comprehensive End-to-End AI Test Suite for Nexus Mobile Application
// Tests all AI features: CardRank, InterestKiller, Spending Insights, and mobile integration

const axios = require('axios');
const assert = require('assert');

// Configuration
const CONFIG = {
  BACKEND_URL: process.env.API_BASE_URL || 'https://nexus-production-2e34.up.railway.app/api',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'https://nexus-ai-production.up.railway.app',
  TEST_TIMEOUT: 30000,
  RETRY_COUNT: 3
};

// Test Results Tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Utility Functions
function log(message, level = 'INFO') {
  console.log(`[${level}] ${new Date().toISOString()} - ${message}`);
}

function recordResult(testName, status, details = '') {
  testResults[status]++;
  testResults.details.push({ testName, status, details, timestamp: new Date().toISOString() });
  log(`${testName}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`, status === 'failed' ? 'ERROR' : 'INFO');
}

async function makeRequest(method, url, data = null, headers = {}) {
  const config = {
    method,
    url,
    timeout: CONFIG.TEST_TIMEOUT,
    headers: { 'Content-Type': 'application/json', ...headers }
  };
  if (data) config.data = data;
  
  for (let attempt = 1; attempt <= CONFIG.RETRY_COUNT; attempt++) {
    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      if (attempt === CONFIG.RETRY_COUNT) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Test User Management
class TestUser {
  constructor() {
    this.email = `test_${Date.now()}@nexusai.test`;
    this.password = 'TestPass123!';
    this.token = null;
    this.userId = null;
    this.accounts = [];
  }

  async register() {
    try {
      const response = await makeRequest('POST', `${CONFIG.BACKEND_URL}/auth/register`, {
        email: this.email,
        password: this.password
      });
      this.token = response.data.token;
      this.userId = response.data.userId || response.data.id;
      recordResult('User Registration', 'passed');
      return true;
    } catch (error) {
      recordResult('User Registration', 'failed', error.message);
      return false;
    }
  }

  async login() {
    try {
      const response = await makeRequest('POST', `${CONFIG.BACKEND_URL}/auth/login`, {
        email: this.email,
        password: this.password
      });
      this.token = response.data.token;
      this.userId = response.data.userId || response.data.id;
      recordResult('User Login', 'passed');
      return true;
    } catch (error) {
      recordResult('User Login', 'failed', error.message);
      return false;
    }
  }

  getAuthHeaders() {
    return { Authorization: `Bearer ${this.token}` };
  }
}

// AI Feature Tests
class AIFeatureTests {
  constructor(user) {
    this.user = user;
  }

  async testCardRankAI() {
    log('Testing CardRank AI Feature...');
    
    // Test 1: Basic CardRank Recommendation
    try {
      const payload = {
        user_cards: [
          { id: '1', name: 'Chase Sapphire', category_multipliers: { dining: 2, travel: 2 }, base_rate: 1 },
          { id: '2', name: 'Citi Double Cash', category_multipliers: {}, base_rate: 2 }
        ],
        transaction_context: {
          merchant: 'Amazon',
          category: 'shopping',
          amount: 100,
          location: 'NY'
        },
        user_context: {
          primary_goal: 'maximize_rewards',
          credit_score_info: { score: 750 }
        }
      };

      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/cardrank`, payload);
      assert(response.data.recommended_card, 'Should return recommended card');
      assert(response.data.reason, 'Should provide reasoning');
      recordResult('CardRank AI - Basic Recommendation', 'passed');
    } catch (error) {
      recordResult('CardRank AI - Basic Recommendation', 'failed', error.message);
    }

    // Test 2: CardRank via Backend API
    try {
      const payload = {
        userId: this.user.userId,
        merchant: 'Starbucks',
        category: 'dining',
        amount: 25,
        location: 'CA',
        primaryGoal: 'maximize_rewards'
      };

      const response = await makeRequest('POST', `${CONFIG.BACKEND_URL}/cardrank/recommend`, payload, this.user.getAuthHeaders());
      assert(response.data.recommendation || response.data.aiResponse, 'Should return recommendation');
      recordResult('CardRank Backend Integration', 'passed');
    } catch (error) {
      recordResult('CardRank Backend Integration', 'failed', error.message);
    }

    // Test 3: Edge Cases
    await this.testCardRankEdgeCases();
  }

  async testCardRankEdgeCases() {
    // Test with no cards
    try {
      const payload = {
        user_cards: [],
        transaction_context: { merchant: 'Test', category: 'shopping', amount: 50 },
        user_context: { primary_goal: 'maximize_rewards' }
      };

      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/cardrank`, payload);
      recordResult('CardRank - No Cards Edge Case', 'passed');
    } catch (error) {
      recordResult('CardRank - No Cards Edge Case', 'failed', error.message);
    }

    // Test with invalid category
    try {
      const payload = {
        user_cards: [{ id: '1', name: 'Test Card', base_rate: 1 }],
        transaction_context: { merchant: 'Test', category: 'invalid_category', amount: 50 },
        user_context: { primary_goal: 'maximize_rewards' }
      };

      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/cardrank`, payload);
      recordResult('CardRank - Invalid Category', 'passed');
    } catch (error) {
      recordResult('CardRank - Invalid Category', 'failed', error.message);
    }
  }

  async testInterestKillerAI() {
    log('Testing InterestKiller AI Feature...');

    // Test 1: Basic Interest Optimization
    try {
      const payload = {
        accounts: [
          { id: '1', name: 'Card A', balance: 1000, apr: 24.99, creditLimit: 2000 },
          { id: '2', name: 'Card B', balance: 500, apr: 18.99, creditLimit: 1000 }
        ],
        payment_amount: 300,
        user_context: {
          primary_goal: 'minimize_interest',
          total_debt_last_month: 1600
        }
      };

      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/interestkiller`, payload);
      assert(response.data.minimize_interest_plan, 'Should return minimize interest plan');
      assert(response.data.maximize_score_plan, 'Should return maximize score plan');
      assert(response.data.nexus_recommendation, 'Should provide recommendation');
      recordResult('InterestKiller AI - Basic Optimization', 'passed');
    } catch (error) {
      recordResult('InterestKiller AI - Basic Optimization', 'failed', error.message);
    }

    // Test 2: InterestKiller via Backend
    try {
      const payload = {
        userId: this.user.userId,
        amount: 200
      };

      const response = await makeRequest('POST', `${CONFIG.BACKEND_URL}/interestkiller/suggest`, payload, this.user.getAuthHeaders());
      assert(response.data.suggestion || response.data.aiResponse, 'Should return suggestion');
      recordResult('InterestKiller Backend Integration', 'passed');
    } catch (error) {
      recordResult('InterestKiller Backend Integration', 'failed', error.message);
    }

    // Test 3: Re-explain Feature
    await this.testInterestKillerReExplain();
  }

  async testInterestKillerReExplain() {
    try {
      const payload = {
        accounts: [
          { id: '1', name: 'Card A', balance: 1000, apr: 24.99, creditLimit: 2000 },
          { id: '2', name: 'Card B', balance: 500, apr: 18.99, creditLimit: 1000 }
        ],
        optimal_plan: {
          minimize_interest_plan: {
            split: [{ card_id: '1', amount: 275 }, { card_id: '2', amount: 25 }]
          }
        },
        custom_split: [
          { card_id: '1', card_name: 'Card A', amount: 150, type: 'custom' },
          { card_id: '2', card_name: 'Card B', amount: 150, type: 'custom' }
        ],
        user_context: { primary_goal: 'minimize_interest' }
      };

      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/interestkiller/re-explain`, payload);
      assert(response.data.explanation, 'Should provide explanation');
      assert(response.data.projected_outcome, 'Should provide projected outcome');
      recordResult('InterestKiller - Re-explain Feature', 'passed');
    } catch (error) {
      recordResult('InterestKiller - Re-explain Feature', 'failed', error.message);
    }
  }

  async testSpendingInsightsAI() {
    log('Testing Spending Insights AI Feature...');

    // Test 1: Basic Spending Analysis
    try {
      const payload = {
        transactions: [
          { category: ['Food and Drink'], amount: 45.50, date: '2025-01-15' },
          { category: ['Shopping'], amount: 120.00, date: '2025-01-14' },
          { category: ['Food and Drink'], amount: 32.75, date: '2025-01-13' }
        ],
        previous_transactions: [
          { category: ['Food and Drink'], amount: 25.00, date: '2024-12-15' },
          { category: ['Shopping'], amount: 80.00, date: '2024-12-14' }
        ]
      };

      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/spending-insights`, payload);
      assert(response.data.category_totals, 'Should return category totals');
      assert(response.data.insight, 'Should provide insight');
      recordResult('Spending Insights AI - Basic Analysis', 'passed');
    } catch (error) {
      recordResult('Spending Insights AI - Basic Analysis', 'failed', error.message);
    }

    // Test 2: Empty Transactions
    try {
      const payload = { transactions: [], previous_transactions: null };
      const response = await makeRequest('POST', `${CONFIG.AI_SERVICE_URL}/v2/spending-insights`, payload);
      recordResult('Spending Insights - Empty Transactions', 'passed');
    } catch (error) {
      recordResult('Spending Insights - Empty Transactions', 'failed', error.message);
    }
  }
}

// Mobile App Integration Tests
class MobileIntegrationTests {
  constructor(user) {
    this.user = user;
  }

  async testMobileCardRankFlow() {
    log('Testing Mobile CardRank Integration...');

    // Simulate mobile app CardRank request
    try {
      const mobilePayload = {
        userId: this.user.userId,
        merchant: 'Target',
        category: 'shopping'
      };

      const response = await makeRequest('POST', `${CONFIG.BACKEND_URL}/cardrank/recommend`, mobilePayload, this.user.getAuthHeaders());
      
      // Validate mobile-expected response format
      assert(response.data.recommendation || response.data.error, 'Should return recommendation or error');
      recordResult('Mobile CardRank Flow', 'passed');
    } catch (error) {
      recordResult('Mobile CardRank Flow', 'failed', error.message);
    }
  }

  async testMobileInterestKillerFlow() {
    log('Testing Mobile InterestKiller Integration...');

    try {
      const mobilePayload = {
        userId: this.user.userId,
        amount: '150'
      };

      const response = await makeRequest('POST', `${CONFIG.BACKEND_URL}/interestkiller/suggest`, mobilePayload, this.user.getAuthHeaders());
      
      // Validate mobile-expected response format
      assert(response.data.suggestion || response.data.error, 'Should return suggestion or error');
      recordResult('Mobile InterestKiller Flow', 'passed');
    } catch (error) {
      recordResult('Mobile InterestKiller Flow', 'failed', error.message);
    }
  }

  async testAuthenticationFlow() {
    log('Testing Mobile Authentication Flow...');

    // Test token refresh
    try {
      const response = await makeRequest('GET', `${CONFIG.BACKEND_URL}/auth/profile`, null, this.user.getAuthHeaders());
      assert(response.data.email === this.user.email, 'Profile should match user');
      recordResult('Mobile Auth - Profile Access', 'passed');
    } catch (error) {
      recordResult('Mobile Auth - Profile Access', 'failed', error.message);
    }
  }
}

// Performance and Load Tests
class PerformanceTests {
  constructor(user) {
    this.user = user;
  }

  async testAIResponseTimes() {
    log('Testing AI Response Times...');

    const tests = [
      { name: 'CardRank Response Time', endpoint: `${CONFIG.AI_SERVICE_URL}/v2/cardrank`, payload: this.getCardRankPayload() },
      { name: 'InterestKiller Response Time', endpoint: `${CONFIG.AI_SERVICE_URL}/v2/interestkiller`, payload: this.getInterestKillerPayload() },
      { name: 'Spending Insights Response Time', endpoint: `${CONFIG.AI_SERVICE_URL}/v2/spending-insights`, payload: this.getSpendingInsightsPayload() }
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        await makeRequest('POST', test.endpoint, test.payload);
        const responseTime = Date.now() - startTime;
        
        if (responseTime < 5000) {
          recordResult(`${test.name} (${responseTime}ms)`, 'passed');
        } else {
          recordResult(`${test.name} (${responseTime}ms)`, 'failed', 'Response time too slow');
        }
      } catch (error) {
        recordResult(test.name, 'failed', error.message);
      }
    }
  }

  getCardRankPayload() {
    return {
      user_cards: [{ id: '1', name: 'Test Card', base_rate: 1 }],
      transaction_context: { merchant: 'Test', category: 'shopping', amount: 50 },
      user_context: { primary_goal: 'maximize_rewards' }
    };
  }

  getInterestKillerPayload() {
    return {
      accounts: [{ id: '1', name: 'Test Card', balance: 1000, apr: 20, creditLimit: 2000 }],
      payment_amount: 200,
      user_context: { primary_goal: 'minimize_interest' }
    };
  }

  getSpendingInsightsPayload() {
    return {
      transactions: [{ category: ['Shopping'], amount: 100, date: '2025-01-15' }]
    };
  }
}

// Main Test Runner
async function runComprehensiveAITests() {
  log('Starting Comprehensive AI Test Suite for Nexus Mobile Application');
  log('='.repeat(80));

  // Initialize test user
  const testUser = new TestUser();
  
  // Setup phase
  log('Phase 1: User Setup and Authentication');
  if (!(await testUser.register()) || !(await testUser.login())) {
    log('Failed to setup test user. Aborting tests.', 'ERROR');
    return;
  }

  // AI Feature Tests
  log('\nPhase 2: AI Feature Testing');
  const aiTests = new AIFeatureTests(testUser);
  await aiTests.testCardRankAI();
  await aiTests.testInterestKillerAI();
  await aiTests.testSpendingInsightsAI();

  // Mobile Integration Tests
  log('\nPhase 3: Mobile Integration Testing');
  const mobileTests = new MobileIntegrationTests(testUser);
  await mobileTests.testMobileCardRankFlow();
  await mobileTests.testMobileInterestKillerFlow();
  await mobileTests.testAuthenticationFlow();

  // Performance Tests
  log('\nPhase 4: Performance Testing');
  const perfTests = new PerformanceTests(testUser);
  await perfTests.testAIResponseTimes();

  // Results Summary
  log('\n' + '='.repeat(80));
  log('TEST SUITE COMPLETE');
  log('='.repeat(80));
  log(`Total Tests: ${testResults.passed + testResults.failed + testResults.skipped}`);
  log(`Passed: ${testResults.passed}`);
  log(`Failed: ${testResults.failed}`);
  log(`Skipped: ${testResults.skipped}`);
  log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  if (testResults.failed > 0) {
    log('\nFailed Tests:');
    testResults.details
      .filter(test => test.status === 'failed')
      .forEach(test => log(`  - ${test.testName}: ${test.details}`));
  }

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveAITests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  runComprehensiveAITests,
  TestUser,
  AIFeatureTests,
  MobileIntegrationTests,
  PerformanceTests
};