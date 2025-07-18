const express = require('express');
const router = express.Router();
const { getInterestKillerSplit } = require('../../aiService');
const Card = require('../models/card');
const UserEvent = require('../models/user_event');

router.post('/suggest', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });
  try {
    const cards = await Card.findAll({ where: { user_id: userId } });
    const balances = cards.map(card => parseFloat(card.balance));
    const aprs = cards.map(card => parseFloat(card.apr));
    const split = await getInterestKillerSplit(balances, aprs, parseFloat(amount));
    const result = split.map(s => ({
      amount: s.amount,
      card: cards[s.card_index]?.card_name || `Card ${s.card_index + 1}`,
      apr: cards[s.card_index]?.apr
    }));
    // Log event
    await UserEvent.create({
      user_id: userId,
      event_type: 'interestkiller_suggestion',
      event_data: { request: { amount }, suggestion: result }
    });
    res.json({ suggestion: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 