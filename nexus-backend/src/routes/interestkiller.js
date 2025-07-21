const express = require('express');
const router = express.Router();
const { getInterestKillerSplit } = require('../../aiService');
const Card = require('../models/card');
const UserEvent = require('../models/user_event');

// Helper to calculate utilization
function calcUtilization(balance, creditLimit) {
  if (!creditLimit || creditLimit === 0) return 0;
  return parseFloat(balance) / parseFloat(creditLimit);
}

router.post('/suggest', async (req, res) => {
  const { userId, amount, optimizationGoal } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });
  try {
    // Fetch all cards for the user
    const cards = await Card.findAll({ where: { user_id: userId } });
    // You may need to fetch credit limits and promo info from another model if not present
    const accounts = cards.map(card => {
      // Placeholder: you may want to fetch creditLimit, promoAPR, promoEndDate from another model/table
      const creditLimit = 5000; // TODO: Replace with real value
      return {
        id: card.id,
        balance: parseFloat(card.balance),
        apr: parseFloat(card.apr),
        creditLimit,
        promoAPR: null, // TODO: Replace with real value if available
        promoEndDate: null // TODO: Replace with real value if available
      };
    });
    const split = await getInterestKillerSplit(accounts, parseFloat(amount), optimizationGoal || 'MINIMIZE_INTEREST_COST');
    // Log event
    await UserEvent.create({
      user_id: userId,
      event_type: 'interestkiller_suggestion',
      event_data: { request: { amount, optimizationGoal }, suggestion: split }
    });
    res.json({ suggestion: split });
  } catch (err) {
    console.error('Error in /suggest:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/pay', async (req, res) => {
  const { userId, accounts, payment_amount, optimization_goal } = req.body;
  if (!userId || !accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: 'Please select at least one card to pay.' });
  }
  if (!payment_amount || payment_amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid payment amount.' });
  }
  try {
    const result = await getInterestKillerSplit(accounts, payment_amount, optimization_goal || 'MINIMIZE_INTEREST_COST');
    // Optionally log the payment attempt here
    res.json(result);
  } catch (error) {
    console.error('Error in /pay:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pay/execute', async (req, res) => {
  const { userId, funding_account_id, split } = req.body;
  if (!userId || !funding_account_id || !split || !Array.isArray(split) || split.length === 0) {
    return res.status(400).json({ error: 'Missing required payment info.' });
  }
  // Simulate Plaid payment initiation for each payment in the split
  const results = [];
  for (const payment of split) {
    // In production, call Plaid's payment initiation API here
    results.push({
      card_id: payment.card_id,
      amount: payment.amount,
      status: 'success',
      message: 'Sandbox payment simulated'
    });
  }
  // Optionally log/store the payment attempt here
  res.json({ payments: results });
});

router.post('/pay/ai-recommendation', async (req, res) => {
  const { userId, accounts, payment_amount } = req.body;
  if (!userId || !payment_amount) {
    return res.status(400).json({ error: 'Missing required info.' });
  }
  let cards = accounts;
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    // Fetch all user's credit cards from the DB
    const userCards = await Card.findAll({ where: { user_id: userId } });
    cards = userCards.map(card => ({
      id: card.id,
      institution: card.institution || 'Unknown',
      balance: parseFloat(card.balance),
      apr: parseFloat(card.apr),
      creditLimit: card.creditLimit || 5000, // or fetch from DB
    }));
  }
  if (!cards || cards.length === 0) {
    return res.status(400).json({ error: 'No credit cards found for this user.' });
  }
  try {
    const [minInterest, maxScore] = await Promise.all([
      getInterestKillerSplit(cards, payment_amount, 'MINIMIZE_INTEREST_COST'),
      getInterestKillerSplit(cards, payment_amount, 'MAXIMIZE_CREDIT_SCORE')
    ]);
    res.json({
      minimize_interest: minInterest,
      maximize_score: maxScore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 