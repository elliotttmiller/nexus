const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const { getInterestKillerSplit } = require('../../aiService');
const db = require('../models');
const Card = db.Card;
const UserEvent = db.UserEvent;
const PaymentHistory = db.PaymentHistory;

// Helper to calculate utilization
function calcUtilization(balance, creditLimit) {
  if (!creditLimit || creditLimit === 0) return 0;
  return parseFloat(balance) / parseFloat(creditLimit);
}

// Helper to calculate interest savings
function calculateInterestSavings(split, cards) {
  let totalSaved = 0;
  split.forEach(s => {
    const card = cards.find(c => c.id === s.card_id || c.id === s.id);
    if (card && card.apr) {
      // Simple monthly interest saved: (payment * apr) / 12 / 100
      totalSaved += (s.amount * card.apr) / 12 / 100;
    }
  });
  return totalSaved.toFixed(2);
}
// Helper to calculate utilization improvement
function calculateUtilizationImprovement(split, cards) {
  const totalLimit = cards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalBalance = cards.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalPayment = split.reduce((sum, s) => sum + s.amount, 0);
  const before = totalLimit > 0 ? totalBalance / totalLimit : 0;
  const after = totalLimit > 0 ? (totalBalance - totalPayment) / totalLimit : 0;
  return { before: (before * 100).toFixed(1), after: (after * 100).toFixed(1) };
}

router.post('/suggest', async (req, res) => {
  const { userId, amount, optimizationGoal } = req.body;
  if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });
  try {
    // Fetch all cards for the user
    const cards = await Card.findAll({ where: { user_id: userId } });
    
    // If no cards found in database, return a helpful message
    if (!cards || cards.length === 0) {
      return res.status(400).json({ 
        error: 'No credit cards found for this user. Please link your credit cards through Plaid first.',
        suggestion: {
          message: 'To get personalized payment recommendations, please connect your credit cards through the Plaid integration.',
          next_steps: [
            'Link your credit cards through the Plaid connection',
            'Once connected, you can get AI-powered payment optimization',
            'The system will analyze your APR, balances, and credit limits'
          ]
        }
      });
    }
    
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
    
    const user_context = { primary_goal: 'minimize_interest' };
    const split = await getInterestKillerSplit(accounts, parseFloat(amount), user_context);
    
    // Log event (with error handling for database issues)
    try {
      await UserEvent.create({
        user_id: userId,
        event_type: 'interestkiller_suggestion',
        data: { request: { amount, optimizationGoal }, suggestion: split }
      });
    } catch (logError) {
      console.warn('Failed to log user event:', logError);
      // Don't fail the request if logging fails
    }
    
    res.json({ suggestion: split });
  } catch (err) {
    console.error('Error in /suggest:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/pay', async (req, res) => {
  const { userId, accounts, payment_amount, optimization_goal } = req.body;
  if (!userId || !accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return res.status(400).json({ error: 'Please select at least one card to pay.' });
  }
  if (!payment_amount || payment_amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid payment amount.' });
  }
  try {
    const user_context = { primary_goal: 'minimize_interest' };
    const result = await getInterestKillerSplit(accounts, payment_amount, user_context);
    // Optionally log the payment attempt here
    res.json(result);
  } catch (error) {
    console.error('Error in /pay:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pay/execute', async (req, res) => {
  const { userId, funding_account_id, split } = req.body;
  if (!userId || !funding_account_id || !split || !Array.isArray(split) || split.length === 0) {
    return res.status(400).json({ error: 'Missing required payment info.' });
  }
  // Simulate Plaid payment initiation for each payment in the split
  const results = [];
  for (const payment of split) {
    // In production, call Plaid's payment initiation API here
    results.push({
      card_id: payment.card_id,
      amount: payment.amount,
      status: 'success',
      message: 'Sandbox payment simulated'
    });
  }
  // Optionally log/store the payment attempt here
  res.json({ payments: results });
});

router.post('/pay/ai-recommendation', async (req, res) => {
  const { userId, accounts, payment_amount } = req.body;
  if (!userId || !payment_amount) {
    return res.status(400).json({ error: 'Missing required info.' });
  }
  let cards = accounts;
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    // Fetch all user's credit cards from the DB
    const userCards = await Card.findAll({ where: { user_id: userId } });
    cards = userCards.map(card => ({
      id: card.id,
      institution: card.institution || 'Unknown',
      name: card.name || card.card_name || 'Card', // Ensure name is present
      balance: parseFloat(card.balance),
      apr: parseFloat(card.apr),
      creditLimit: card.creditLimit || 5000, // or fetch from DB
      promo_apr_expiry_date: card.promo_apr_expiry_date || null,
      type: card.type || 'credit'
    }));
  }
  // Filter to only credit cards and ensure all required fields are present
  const creditCards = cards
    .filter(card => card.type === 'credit')
    .map(card => ({
      id: card.id,
      name: card.name || card.card_name || 'Card', // Ensure name is present
      balance: parseFloat(card.balance) || 0,
      apr: parseFloat(card.apr) || 15.0, // Default APR if missing
      creditLimit: parseFloat(card.creditLimit) || 5000, // Default credit limit if missing
      promo_apr_expiry_date: card.promo_apr_expiry_date || null
    }))
    .filter(card => card.id && !isNaN(card.balance) && !isNaN(card.apr) && !isNaN(card.creditLimit));
  if (!creditCards || creditCards.length === 0) {
    return res.status(400).json({ error: 'No valid credit cards found for this user.' });
  }
  try {
    const user_context = { primary_goal: 'minimize_interest' };
    const aiPayload = {
      accounts: creditCards,
      payment_amount,
      user_context
    };
    console.log('AI Recommendation payload:', JSON.stringify(aiPayload, null, 2));
    // Always use the AI-driven logic for both splits and explanations
    const aiResult = await getInterestKillerSplit(creditCards, payment_amount, user_context);
    res.json(aiResult);
  } catch (error) {
    console.error('AI Recommendation error:', error);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

// Save payment history
router.post('/save-payment', async (req, res) => {
  const { userId, amount, status, cards } = req.body;
  
  if (!userId || !amount || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'Missing required payment information' });
  }

  try {
    const payment = await PaymentHistory.create({
      user_id: userId,
      amount: parseFloat(amount),
      status: status || 'pending',
      details: JSON.stringify({ cards }),
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      paymentId: payment.id
    });
  } catch (error) {
    console.error('Error saving payment:', error);
    res.status(500).json({ error: 'Failed to save payment history' });
  }
});

// Get payment history for a user
router.get('/payment-history', async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const payments = await PaymentHistory.findAll({
      where: { user_id: userId },
      order: [['timestamp', 'DESC']],
      limit: 50 // Return last 50 payments
    });

    // Format the response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      timestamp: payment.timestamp,
      cards: JSON.parse(payment.details || '[]').cards || []
    }));

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;