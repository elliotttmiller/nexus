const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');

// Temporary endpoint for direct transaction creation and AI analysis test
router.post('/test-create', async (req, res) => {
  try {
    const { description, amount, merchant, category, card_used, user_id } = req.body;
    // Find a card and user
    const card = await db.Card.findOne({ where: { card_name: card_used, user_id } });
    if (!card) return res.status(400).json({ error: 'Card not found for user' });
    // Create transaction
    const tx = await db.Transaction.create({
      user_id,
      amount,
      merchant,
      category,
      card_id: card.id,
      plaid_transaction_id: `test_${Date.now()}`,
      date: new Date(),
    });
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
