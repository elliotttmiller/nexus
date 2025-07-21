const express = require('express');
const router = express.Router();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const Account = require('../models/account');
const Card = require('../models/card');

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
      user: { client_user_id: req.body.userId ? String(req.body.userId) : 'test-user' },
      client_name: 'Nexus',
      products: ['auth', 'transactions'],
      country_codes: ['US'],
      language: 'en',
      // institution_id removed to allow user selection in UI
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
    const { public_token, userId, institution } = req.body;
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;

    // Fetch institution info from Plaid if not provided
    let institutionName = institution;
    let institutionId = null;
    try {
      const itemResp = await plaidClient.itemGet({ access_token });
      institutionId = itemResp.data.item.institution_id;
      if (!institutionName && institutionId) {
        const instResp = await plaidClient.institutionsGetById({ institution_id: institutionId, country_codes: ['US'] });
        institutionName = instResp.data.institution.name;
      }
    } catch (e) {
      console.warn('Could not fetch institution info:', e.message);
    }

    await Account.create({ user_id: userId, plaid_access_token: access_token, institution: institutionName || 'Unknown' });
    console.log('Account created:', { user_id: userId, plaid_access_token: access_token, institution: institutionName || 'Unknown' });
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
    const accounts = await Account.findAll({ where: { user_id: userId } });
    if (!accounts || accounts.length === 0) {
      // Return mock data for development/testing
      return res.json([
        { id: 1, institution: 'Test Bank', balance: 1000, type: 'checking' },
        { id: 2, institution: 'Mock Credit Union', balance: 2500, type: 'savings' }
      ]);
    }
    let allAccounts = [];
    for (const acc of accounts) {
      try {
        const response = await plaidClient.accountsGet({ access_token: acc.plaid_access_token });
        // Map Plaid accounts to app format
        const mapped = await Promise.all(response.data.accounts.map(async (plaidAcc) => {
          let apr = undefined;
          if (plaidAcc.type === 'credit') {
            // Try to find a matching card for this account and get its APR
            const card = await Card.findOne({ where: { account_id: acc.id } });
            apr = card ? parseFloat(card.apr) : undefined;
          }
          return {
            id: plaidAcc.account_id,
            institution: acc.institution || 'Unknown',
            balance: plaidAcc.balances.current ?? plaidAcc.balances.available ?? 0,
            type: plaidAcc.type,
            apr,
          };
        }));
        allAccounts = allAccounts.concat(mapped);
      } catch (e) {
        console.warn('Error fetching accounts for access_token:', e.message);
      }
    }
    console.log('Returning accounts:', allAccounts);
    res.json(allAccounts);
  } catch (err) {
    console.error('Error in /accounts:', err);
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