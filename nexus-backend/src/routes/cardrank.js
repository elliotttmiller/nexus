const express = require('express');
const router = express.Router();
const { getCardRank } = require('../../aiService');
const Card = require('../models/card');
const UserEvent = require('../models/user_event');

router.post('/recommend', async (req, res) => {
  const { userId, merchant, category } = req.body;
  if (!userId || (!merchant && !category)) return res.status(400).json({ error: 'userId and merchant/category required' });
  try {
    const cards = await Card.findAll({ where: { user_id: userId } });
    const cardsData = cards.map(card => card.toJSON());
    const recommendation = await getCardRank(cardsData, merchant, category);
    // Log event
    await UserEvent.create({
      user_id: userId,
      event_type: 'card_recommendation',
      event_data: { request: { merchant, category }, recommendation }
    });
    res.json({ recommendation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 