const express = require('express');
const router = express.Router();
const { getCardRank } = require('../../aiService');
const db = require('../models');
const Card = db.Card;
const UserEvent = db.UserEvent;
const { z } = require('zod');

// Helper to calculate utilization
function calcUtilization(balance, creditLimit) {
  if (!creditLimit || creditLimit === 0) return 0;
  return parseFloat(balance) / parseFloat(creditLimit);
}

router.post('/recommend', async (req, res) => {
  const schema = z.object({
    userId: z.union([z.string(), z.number()]),
    merchant: z.string().optional(),
    category: z.string().optional(),
    amount: z.number().positive().optional(),
    location: z.string().optional(),
    primaryGoal: z.string().optional(),
    creditScoreInfo: z.any().optional()
  });
  const parseResult = schema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors });
  }
  const { userId, merchant, category, amount, location, primaryGoal, creditScoreInfo } = parseResult.data;
  if (!userId || (!merchant && !category)) return res.status(400).json({ error: 'userId and merchant/category required' });
  try {
    // Fetch all cards for the user
    let cards = await Card.findAll({ where: { user_id: userId } });
    if (!cards || cards.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Attempted to use mock cards in production for userId:', userId);
        return res.status(500).json({ error: 'Internal server error. No cards found for user.' });
      }
      // Fallback to mock cards if none found (for testing/demo)
      cards = [
        {
          id: 'mock_chase_1',
          card_name: 'Chase Sapphire Preferred',
          balance: 5000,
          apr: 21.49,
          user_id: userId,
          rewards: { type: 'travel', rate: '2x', categories: ['travel', 'dining'] },
        },
        {
          id: 'mock_amex_1',
          card_name: 'American Express Gold',
          balance: 3000,
          apr: 18.99,
          user_id: userId,
          rewards: { type: 'dining', rate: '4x', categories: ['dining', 'groceries'] },
        },
        {
          id: 'mock_citi_1',
          card_name: 'Citi Double Cash',
          balance: 7500,
          apr: 22.99,
          user_id: userId,
          rewards: { type: 'cashback', rate: '2%', categories: ['all_purchases'] },
        },
        {
          id: 'mock_discover_1',
          card_name: 'Discover it Cash Back',
          balance: 1200,
          apr: 16.99,
          user_id: userId,
          rewards: { type: 'rotating', rate: '5%', categories: ['gas_stations', 'grocery_stores', 'restaurants', 'amazon'] },
        },
      ];
    }
    // You may need to fetch credit limits and other fields from another model if not present
    const userCards = cards.map(card => {
      const rewards = card.rewards || {};
      const creditLimit = card.credit_limit || card.creditLimit || 5000;
      return {
        id: card.id,
        name: card.card_name || card.name, // Accept both
        balance: parseFloat(card.balance),
        creditLimit,
        apr: parseFloat(card.apr),
        utilization: (parseFloat(card.balance) / creditLimit),
        rewards,
        point_value_cents: 1,
        signup_bonus_progress: null
      };
    });
    console.log('[DEBUG] userCards for AI:', JSON.stringify(userCards, null, 2));
    console.log('[DEBUG] FINAL userCards for AI:', JSON.stringify(userCards, null, 2));
    if (!userCards || userCards.length === 0) {
      return res.status(400).json({ error: 'No cards found for this user.' });
    }
    // Call the AI service only if userCards is not empty
    // Build user_context with both primaryGoal and creditScoreInfo if present
    const user_context = {};
    if (primaryGoal) user_context.primaryGoal = primaryGoal;
    if (creditScoreInfo) user_context.creditScoreInfo = creditScoreInfo;
    const result = await getCardRank(
      userCards,
      { merchantName: merchant, amount, category, location },
      user_context
    );
    res.json(result);
  } catch (error) {
    console.error('Error in /cardrank/recommend:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 