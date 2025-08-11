const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Temporary endpoint for direct transaction creation and AI analysis test
router.post('/test-create', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  try {
    const { description, amount, merchant, category, card_used, user_id } = req.body;
    trace.push({ step: 'Find Card', card_used, user_id, timestamp: new Date().toISOString() });
    const card = await db.Card.findOne({ where: { card_name: card_used, user_id } });
    if (!card) return res.status(400).json({ error: 'Card not found for user', trace });
    trace.push({ step: 'Create Transaction', cardId: card.id, timestamp: new Date().toISOString() });
    const tx = await db.Transaction.create({
      user_id,
      amount,
      merchant,
      category,
      card_id: card.id,
      plaid_transaction_id: `test_${Date.now()}`,
      date: new Date(),
    });
    trace.push({ step: 'Transaction Created', txId: tx.id, timestamp: new Date().toISOString() });
    res.json({ ...tx.toJSON(), trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    res.status(500).json({ error: err.message, trace });
  }
});

module.exports = router;
