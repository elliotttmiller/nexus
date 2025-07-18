const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Account = require('../models/account');

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

module.exports = router; 