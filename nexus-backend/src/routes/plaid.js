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
      products: ['auth', 'transactions', 'liabilities'], // Added liabilities
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

// --- Plaid Two-Call Merge Helper ---
async function fetchAndMergeCompleteAccountData(accessToken, institutionName) {
  try {
    const [accountsResponse, liabilitiesResponse] = await Promise.all([
      plaidClient.accountsGet({ access_token: accessToken }),
      plaidClient.liabilitiesGet({ access_token: accessToken }).catch(() => ({ data: { liabilities: {} } }))
    ]);
    const allAccounts = accountsResponse.data.accounts;
    const liabilities = liabilitiesResponse.data.liabilities || {};
    const liabilityDataMap = new Map();
    const allLiabilities = [
      ...(liabilities.credit || []),
      ...(liabilities.student || []),
      ...(liabilities.mortgage || [])
    ];
    for (const liability of allLiabilities) {
      const primaryApr = liability.aprs && liability.aprs.find(apr => apr.apr_type === 'purchase_apr') || (liability.aprs && liability.aprs.length > 0 ? liability.aprs[0] : null);
      liabilityDataMap.set(liability.account_id, {
        apr: primaryApr ? primaryApr.apr_percentage : undefined,
      });
    }
    return allAccounts.map(account => {
      const liabilityDetails = liabilityDataMap.get(account.account_id);
      return {
        id: account.account_id,
        name: account.name,
        institution: institutionName || 'Unknown',
        balance: account.balances.current,
        type: account.type,
        apr: liabilityDetails ? liabilityDetails.apr : undefined,
        creditLimit: account.type === 'credit' ? account.balances.limit : undefined,
      };
    });
  } catch (error) {
    console.error('[Plaid Service] Error fetching or merging Plaid data:', error.response ? error.response.data : error);
    return [];
  }
}

// Get Accounts
router.get('/accounts', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const accounts = await Account.findAll({ where: { user_id: userId } });
    if (!accounts || accounts.length === 0) {
      // Return mock data for development/testing, including four mock credit cards
      return res.json([
        { id: 1, institution: 'Test Bank', balance: 1000, type: 'checking' },
        { id: 2, institution: 'Mock Credit Union', balance: 2500, type: 'savings' },
        { id: 'mock_credit_1', institution: 'Mock Bank', balance: 2500, type: 'credit', apr: 19.99, creditLimit: 8000 },
        { id: 'mock_credit_2', institution: 'Mock Bank', balance: 1500, type: 'credit', apr: 24.99, creditLimit: 5000 },
        { id: 'mock_credit_3', institution: 'Mock Bank', balance: 500, type: 'credit', apr: 16.49, creditLimit: 3000 },
        { id: 'mock_credit_4', institution: 'Mock Bank', balance: 4200, type: 'credit', apr: 29.99, creditLimit: 12000 }
      ]);
    }
    let allAccounts = [];
    for (const acc of accounts) {
      const merged = await fetchAndMergeCompleteAccountData(acc.plaid_access_token, acc.institution);
      allAccounts = allAccounts.concat(merged);
    }
    // If no liability accounts found, add a mock credit card for demo/testing
    const hasLiability = allAccounts.some(acc => acc.type === 'credit' && acc.apr !== undefined && acc.creditLimit !== undefined);
    if (!hasLiability) {
      console.warn('No real liability accounts found, adding mock credit card for demo/testing.');
      allAccounts.push({
        id: 'mock_credit_1',
        institution: 'Mock Bank',
        balance: 2500,
        type: 'credit',
        apr: 19.99,
        creditLimit: 8000
      });
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