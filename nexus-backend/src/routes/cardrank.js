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
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
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
  trace.push({ step: 'Input Validation', valid: parseResult.success, errors: parseResult.error ? parseResult.error.errors : null, timestamp: new Date().toISOString() });
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid input', details: parseResult.error.errors, trace });
  }
  const { userId, merchant, category, amount, location, primaryGoal, creditScoreInfo } = parseResult.data;
  if (!userId || (!merchant && !category)) return res.status(400).json({ error: 'userId and merchant/category required', trace });
  try {
    // Fetch all cards for the user
    let cards = await Card.findAll({ where: { user_id: userId } });
    trace.push({ step: 'DB Query', model: 'Card', query: { user_id: userId }, resultCount: cards.length, timestamp: new Date().toISOString() });
    if (!cards || cards.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        trace.push({ step: 'No Cards', error: 'No cards found for user in production', timestamp: new Date().toISOString() });
        return res.status(500).json({ error: 'Internal server error. No cards found for user.', trace });
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
      trace.push({ step: 'Mock Cards Used', count: cards.length, timestamp: new Date().toISOString() });
    }
    // You may need to fetch credit limits and other fields from another model if not present
    const userCards = cards.map(card => {
      // Defensive: sanitize all fields for AI
      const id = card.id ? String(card.id) : '';
      let creditLimitRaw = card.credit_limit || card.creditLimit || 5000;
      let creditLimit = 0;
      if (typeof creditLimitRaw === 'string') {
        creditLimit = parseFloat(creditLimitRaw) || 0;
      } else if (typeof creditLimitRaw === 'number') {
        creditLimit = creditLimitRaw;
      } else {
        creditLimit = 0;
      }
      let apr = 0;
      if (card.apr == null || isNaN(Number(card.apr))) {
        apr = 0;
      } else {
        apr = Number(card.apr);
      }
      const rewards = card.rewards || {};
      return {
        id,
        name: card.card_name || card.name || '',
        balance: parseFloat(card.balance) || 0,
        creditLimit,
        apr,
        utilization: creditLimit > 0 ? (parseFloat(card.balance) / creditLimit) : 0,
        rewards,
        point_value_cents: 1,
        signup_bonus_progress: null
      };
    });
    trace.push({ step: 'Sanitize Cards', userCards, timestamp: new Date().toISOString() });
    if (!userCards || userCards.length === 0) {
      trace.push({ step: 'No User Cards', timestamp: new Date().toISOString() });
      return res.status(400).json({ error: 'No cards found for this user.', trace });
    }
    // Build user_context with both primaryGoal and creditScoreInfo if present
    const user_context = {};
    if (primaryGoal) user_context.primaryGoal = primaryGoal;
    if (creditScoreInfo) user_context.creditScoreInfo = creditScoreInfo;
    trace.push({ step: 'Build User Context', user_context, timestamp: new Date().toISOString() });
    // Call the AI service only if userCards is not empty
    let result;
    try {
      trace.push({ step: 'AI Call Start', timestamp: new Date().toISOString() });
      result = await getCardRank(
        userCards,
        { merchantName: merchant, amount, category, location },
        user_context
      );
      trace.push({ step: 'AI Call Success', aiResult: result, timestamp: new Date().toISOString() });
    } catch (aiErr) {
      trace.push({ step: 'AI Call Error', error: aiErr.message, timestamp: new Date().toISOString() });
      throw aiErr;
    }
    res.json({ ...result, trace });
  } catch (error) {
    trace.push({ step: 'Error', error: error.message, timestamp: new Date().toISOString() });
    console.error('Error in /cardrank/recommend:', error);
    res.status(500).json({ error: error.message, trace });
  }
});

module.exports = router; 