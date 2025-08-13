const express = require('express');
const router = express.Router();
const { getSpendingInsights, getBudgetHealth, getCashFlowPrediction } = require('../../aiService');

router.post('/spending-insights', async (req, res) => {
  const { transactions } = req.body;
  const result = await getSpendingInsights(transactions);
  res.json(result);
});

router.post('/budget-health', async (req, res) => {
  const { user_budget, transactions } = req.body;
  try {
    const result = await getBudgetHealth(user_budget, transactions);
    if (result && result.error) {
      res.status(500).json({ error: 'AI service unavailable', details: result });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Budget Health AI error:', error);
    res.status(500).json({ error: 'AI service unavailable', details: error });
  }
});

router.post('/cash-flow-prediction', async (req, res) => {
  const { accounts, upcoming_bills, transactions } = req.body;
  try {
    const result = await getCashFlowPrediction(accounts, upcoming_bills, transactions);
    if (result && result.error) {
      res.status(500).json({ error: 'AI service unavailable', details: result });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Cash Flow Prediction AI error:', error);
    res.status(500).json({ error: 'AI service unavailable', details: error });
  }
});

module.exports = router; 