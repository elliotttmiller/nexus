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

module.exports = router; 