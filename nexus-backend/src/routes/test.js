const express = require('express');
const router = express.Router();
const { Card } = require('../models');
const { getCardRank } = require('../../aiService');

// Debug endpoint to test AI payload type-safety and log raw AI service response
router.post('/ai-payload', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  try {
    const { userCards, transactionContext, userContext } = req.body;
    if (!Array.isArray(userCards) || !transactionContext) {
      trace.push({ step: 'Validation Failed', timestamp: new Date().toISOString() });
      return res.status(400).json({ error: 'userCards (array) and transactionContext (object) are required.', trace });
    }
    trace.push({ step: 'Payload Validated', timestamp: new Date().toISOString() });
    // Log outgoing payload
    trace.push({ step: 'Log Payload', userCards, transactionContext, userContext, timestamp: new Date().toISOString() });
    let aiResponse;
    try {
      aiResponse = await getCardRank(userCards, transactionContext, userContext || {});
      trace.push({ step: 'AI Response', aiResponse, timestamp: new Date().toISOString() });
      res.json({ aiResponse, trace });
    } catch (err) {
      trace.push({ step: 'AI Error', error: err.message, aiError: err.response ? err.response.data : undefined, timestamp: new Date().toISOString() });
      res.status(500).json({ error: err.message, aiError: err.response ? err.response.data : undefined, trace });
    }
  } catch (error) {
    trace.push({ step: 'Error', error: error.message, timestamp: new Date().toISOString() });
    res.status(500).json({ error: error.message, trace });
  }
});



router.get('/error', (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString() });
  trace.push({ step: 'Throw Error', message: 'Sentry test error!', timestamp: new Date().toISOString() });
  res.status(500).json({ error: 'Sentry test error!', trace });
});

// Add mock credit cards endpoint
router.post('/add-mock-cards', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString() });
  try {
    trace.push({ step: 'Prepare Mock Cards', timestamp: new Date().toISOString() });
    const mockCards = [
      // ...existing code...
    ];
    const createdCards = [];
    for (const cardData of mockCards) {
      try {
        const card = await Card.create(cardData);
        createdCards.push(card);
        trace.push({ step: 'Card Added', card: card.card_name, timestamp: new Date().toISOString() });
      } catch (error) {
        trace.push({ step: 'Card Exists', card: cardData.card_name, error: error.message, timestamp: new Date().toISOString() });
      }
    }
    trace.push({ step: 'All Cards Processed', count: createdCards.length, timestamp: new Date().toISOString() });
    res.json({
      success: true,
      message: `Successfully added ${createdCards.length} mock credit cards`,
      cards: createdCards.map(card => ({
        id: card.id,
        name: card.card_name,
        balance: card.balance,
        apr: card.apr,
        credit_limit: card.credit_limit
      })),
      trace
    });
  } catch (error) {
    trace.push({ step: 'Error', error: error.message, timestamp: new Date().toISOString() });
    res.status(500).json({
      success: false,
      error: error.message,
      trace
    });
  }
});

module.exports = router; 