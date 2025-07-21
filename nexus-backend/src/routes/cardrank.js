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
    if (!cards || cards.length === 0) {
      return res.status(400).json({ error: 'No cards found for this user.' });
    }
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
        utilization: (parseFloat(card.balance) / creditLimit),
        rewards,
        point_value_cents: 1,
        signup_bonus_progress: null
      };
    });
    // Call the AI service only if userCards is not empty
    const result = await getCardRank(userCards, { merchantName: merchant, amount, category, location }, { primaryGoal });
    res.json(result);
  } catch (error) {
    console.error('Error in /cardrank/recommend:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 