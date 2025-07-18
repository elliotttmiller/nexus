const express = require('express');
const router = express.Router();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const Account = require('../models/account');

const config = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(config);

// Create Link Token
router.post('/create_link_token', async (req, res) => {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.body.userId || 'test-user' },
      client_name: 'Nexus',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json(response.data);
  } catch (err) {
    console.error('Error in /create_link_token:', err);
    res.status(500).json({ error: err.message });
  }
});

// Exchange Public Token
router.post('/exchange_public_token', async (req, res) => {
  try {
    const { public_token, userId } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    // Save access_token to DB for user
    const access_token = response.data.access_token;
    await Account.create({ user_id: userId, plaid_access_token: access_token });
    res.json(response.data);
  } catch (err) {
    console.error('Error in /exchange_public_token:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Accounts
router.get('/accounts', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const account = await Account.findOne({ where: { user_id: userId } });
    if (!account) return res.status(404).json({ error: 'No account found' });
    const response = await plaidClient.accountsGet({ access_token: account.plaid_access_token });
    res.json(response.data.accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Transactions
router.get('/transactions', async (req, res) => {
  const { userId, start_date, end_date } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const account = await Account.findOne({ where: { user_id: userId } });
    if (!account) return res.status(404).json({ error: 'No account found' });
    const today = new Date();
    const start = start_date || new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().slice(0, 10);
    const end = end_date || today.toISOString().slice(0, 10);
    const response = await plaidClient.transactionsGet({
      access_token: account.plaid_access_token,
      start_date: start,
      end_date: end,
      options: { count: 100, offset: 0 }
    });
    res.json(response.data.transactions);
  } catch (err) {
    console.error('Error in /transactions:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 