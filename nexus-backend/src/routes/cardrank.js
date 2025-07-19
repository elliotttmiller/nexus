const express = require('express');
const router = express.Router();
const { getCardRank } = require('../../aiService');
const Card = require('../models/card');
const UserEvent = require('../models/user_event');

// Helper to calculate utilization
function calcUtilization(balance, creditLimit) {
  if (!creditLimit || creditLimit === 0) return 0;
  return parseFloat(balance) / parseFloat(creditLimit);
}

router.post('/recommend', async (req, res) => {
  const { userId, merchant, category, amount, location, primaryGoal, creditScoreInfo } = req.body;
  if (!userId || (!merchant && !category)) return res.status(400).json({ error: 'userId and merchant/category required' });
  try {
    // Fetch all cards for the user
    const cards = await Card.findAll({ where: { user_id: userId } });
    // You may need to fetch credit limits and other fields from another model if not present
    const userCards = cards.map(card => {
      const rewards = card.rewards || {};
      // Placeholder: you may want to fetch creditLimit from another model/table
      const creditLimit = 5000; // TODO: Replace with real value
      return {
        id: card.id,
        name: card.card_name,
        balance: parseFloat(card.balance),
        creditLimit,
        apr: parseFloat(card.apr),
        utilization: calcUtilization(card.balance, creditLimit),
        rewards,
        point_value_cents: 1.0, // TODO: Replace with real value if available
        signup_bonus_progress: null // TODO: Add if available
      };
    });
    const transactionContext = {
      merchantName: merchant,
      amount: amount || 1.0,
      location: location || ''
    };
    const userContext = {
      primaryGoal: primaryGoal || 'MAXIMIZE_CASHBACK',
      creditScoreInfo: creditScoreInfo || { score: 700, utilization: 0.2 }
    };
    const recommendation = await getCardRank(userCards, transactionContext, userContext);
    // Log event
    await UserEvent.create({
      user_id: userId,
      event_type: 'card_recommendation',
      event_data: { request: { merchant, category, amount, location, primaryGoal, creditScoreInfo }, recommendation }
    });
    res.json(recommendation);
  } catch (err) {
    console.error('Error in /recommend:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 