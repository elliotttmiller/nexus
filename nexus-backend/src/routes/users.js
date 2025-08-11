const express = require('express');
const router = express.Router();
const db = require('../models');
const User = db.User;
const Account = db.Account;

// Get user profile
router.get('/profile', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), query: req.query });
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required', trace });
  try {
    trace.push({ step: 'Find User', userId, timestamp: new Date().toISOString() });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found', trace });
    trace.push({ step: 'User Found', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ id: user.id, email: user.email, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /profile (GET):', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { userId, email } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'userId and email required', trace });
  try {
    trace.push({ step: 'Find User', userId, timestamp: new Date().toISOString() });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found', trace });
    await user.update({ email });
    trace.push({ step: 'Profile Updated', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ message: 'Profile updated', trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /profile (PUT):', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { userId, secret } = req.body;
  if (!userId || !secret) return res.status(400).json({ error: 'userId and secret required', trace });
  try {
    trace.push({ step: 'Find User', userId, timestamp: new Date().toISOString() });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found', trace });
    await user.update({ twofa_secret: secret });
    trace.push({ step: '2FA Enabled', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ message: '2FA enabled', trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /2fa/enable:', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), body: req.body });
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required', trace });
  try {
    trace.push({ step: 'Find User', userId, timestamp: new Date().toISOString() });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found', trace });
    await user.update({ twofa_secret: null });
    trace.push({ step: '2FA Disabled', userId: user.id, timestamp: new Date().toISOString() });
    res.json({ message: '2FA disabled', trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    res.status(500).json({ error: err.message, trace });
  }
});

// List linked accounts (data access)
router.get('/data-access', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), query: req.query });
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required', trace });
  try {
    trace.push({ step: 'Find Accounts', userId, timestamp: new Date().toISOString() });
    const accounts = await Account.findAll({ where: { user_id: userId } });
    trace.push({ step: 'Accounts Found', count: accounts.length, timestamp: new Date().toISOString() });
    res.json({ accounts, trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    res.status(500).json({ error: err.message, trace });
  }
});

// Revoke account access
router.delete('/data-access/:accountId', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), params: req.params });
  const { accountId } = req.params;
  try {
    trace.push({ step: 'Find Account', accountId, timestamp: new Date().toISOString() });
    const account = await Account.findByPk(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found', trace });
    await account.destroy();
    trace.push({ step: 'Account Revoked', accountId, timestamp: new Date().toISOString() });
    res.json({ message: 'Account access revoked', trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /data-access/:accountId (DELETE):', err);
    res.status(500).json({ error: err.message, trace });
  }
});

// --- RESET ALL USER FINANCIAL DATA ---
router.delete('/data-access/reset', async (req, res) => {
  const trace = [];
  trace.push({ step: 'Start', timestamp: new Date().toISOString(), query: req.query, body: req.body });
  let userId = req.query.userId || req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId required', trace });
  userId = parseInt(userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId: must be an integer', trace });
  try {
    trace.push({ step: 'Delete Recommendations', userId, timestamp: new Date().toISOString() });
    await db.Recommendation.destroy({ where: { user_id: userId } });
    trace.push({ step: 'Delete Payment History', userId, timestamp: new Date().toISOString() });
    await db.PaymentHistory.destroy({ where: { user_id: userId } });
    trace.push({ step: 'Find User Cards', userId, timestamp: new Date().toISOString() });
    const userCards = await db.Card.findAll({ where: { user_id: userId } });
    const cardIds = userCards.map(card => card.id);
    if (cardIds.length > 0) {
      trace.push({ step: 'Delete Transactions by Card', cardIds, timestamp: new Date().toISOString() });
      await db.Transaction.destroy({ where: { card_id: cardIds } });
    }
    trace.push({ step: 'Delete Accounts', userId, timestamp: new Date().toISOString() });
    await db.Account.destroy({ where: { user_id: userId } });
    trace.push({ step: 'Delete Cards', userId, timestamp: new Date().toISOString() });
    await db.Card.destroy({ where: { user_id: userId } });
    trace.push({ step: 'Reset Complete', userId, timestamp: new Date().toISOString() });
    res.json({ message: 'All user financial data reset.', trace });
  } catch (err) {
    trace.push({ step: 'Error', error: err.message, timestamp: new Date().toISOString() });
    console.error('Error in /data-access/reset (DELETE):', err);
    res.status(500).json({ error: err.message, trace });
  }
});

module.exports = router; 