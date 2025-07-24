const express = require('express');
const router = express.Router();
const db = require('../models');
const User = db.User;
const Account = db.Account;

// Get user profile
router.get('/profile', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error('Error in /profile (GET):', err);
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'userId and email required' });
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ email });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error('Error in /profile (PUT):', err);
    res.status(500).json({ error: err.message });
  }
});

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
  const { userId, secret } = req.body;
  if (!userId || !secret) return res.status(400).json({ error: 'userId and secret required' });
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ twofa_secret: secret });
    res.json({ message: '2FA enabled' });
  } catch (err) {
    console.error('Error in /2fa/enable:', err);
    res.status(500).json({ error: err.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update({ twofa_secret: null });
    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List linked accounts (data access)
router.get('/data-access', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const accounts = await Account.findAll({ where: { user_id: userId } });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revoke account access
router.delete('/data-access/:accountId', async (req, res) => {
  const { accountId } = req.params;
  try {
    const account = await Account.findByPk(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    await account.destroy();
    res.json({ message: 'Account access revoked' });
  } catch (err) {
    console.error('Error in /data-access/:accountId (DELETE):', err);
    res.status(500).json({ error: err.message });
  }
});

// --- RESET ALL USER FINANCIAL DATA ---
router.delete('/data-access/reset', async (req, res) => {
  let userId = req.query.userId || req.body.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  userId = parseInt(userId, 10);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId: must be an integer' });
  try {
    // Delete all recommendations
    await db.Recommendation.destroy({ where: { user_id: userId } });
    // Delete all payment history
    await db.PaymentHistory.destroy({ where: { user_id: userId } });
    // Delete all transactions (by cards and accounts)
    const userCards = await db.Card.findAll({ where: { user_id: userId } });
    const cardIds = userCards.map(card => card.id);
    if (cardIds.length > 0) {
      await db.Transaction.destroy({ where: { card_id: cardIds } });
    }
    // Delete all accounts (cascade deletes cards, which cascade deletes transactions by account_id)
    await db.Account.destroy({ where: { user_id: userId } });
    // Delete all cards (in case any remain)
    await db.Card.destroy({ where: { user_id: userId } });
    res.json({ message: 'All user financial data reset.' });
  } catch (err) {
    console.error('Error in /data-access/reset (DELETE):', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 