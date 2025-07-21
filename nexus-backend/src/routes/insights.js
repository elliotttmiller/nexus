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
  const result = await getBudgetHealth(user_budget, transactions);
  res.json(result);
});

router.post('/cash-flow-prediction', async (req, res) => {
  const { accounts, upcoming_bills, transactions } = req.body;
  const result = await getCashFlowPrediction(accounts, upcoming_bills, transactions);
  res.json(result);
});

module.exports = router; 