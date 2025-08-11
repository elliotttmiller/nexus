// test_ai_card_analysis.js
// Script to test the AI card analysis feature and integration

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001'; // adjust port if needed

// Example test transactions
const testTransactions = [
  {
    description: 'Starbucks Coffee',
    amount: 5.75,
    merchant: 'Starbucks',
    category: 'Coffee Shop',
    card_used: 'Chase Sapphire Preferred',
    user_id: 1
  },
  {
    description: 'Delta Airlines Flight',
    amount: 350.00,
    merchant: 'Delta Airlines',
    category: 'Travel',
    card_used: 'Amex Platinum',
    user_id: 1
  },
  {
    description: 'Whole Foods Market',
    amount: 120.00,
    merchant: 'Whole Foods',
    category: 'Groceries',
    card_used: 'Citi Double Cash',
    user_id: 1
  },
  {
    description: 'Uber Ride',
    amount: 18.50,
    merchant: 'Uber',
    category: 'Rideshare',
    card_used: 'Chase Freedom Flex',
    user_id: 1
  }
];

async function runTests() {
  for (const tx of testTransactions) {
    // Simulate creating a transaction (or call the webhook/analysis endpoint directly)
    try {
      const createRes = await axios.post(`${API_BASE_URL}/api/transactions/test-create`, tx);
      const transaction = createRes.data;
      console.log(`\nTransaction: ${tx.description} ($${tx.amount})`);
      // Fetch the transaction with AI analysis
      const fetchRes = await axios.get(`${API_BASE_URL}/api/transactions/${transaction.id}`);
      const aiAnalysis = fetchRes.data.ai_card_analysis;
      if (aiAnalysis) {
        console.log('AI Card Analysis:', JSON.stringify(aiAnalysis, null, 2));
      } else {
        console.log('No AI analysis found for this transaction.');
      }
    } catch (err) {
      console.error('Test failed for transaction:', tx.description, err.response ? err.response.data : err.message);
    }
  }
}

runTests();
