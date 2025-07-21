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
        // Fetch accounts and liabilities in parallel
        const [accountsResp, liabilitiesResp] = await Promise.all([
          plaidClient.accountsGet({ access_token: acc.plaid_access_token }),
          plaidClient.liabilitiesGet({ access_token: acc.plaid_access_token }).catch(e => {
            // Liabilities may not exist for all items
            console.warn('No liabilities for access_token:', e.message);
            return { data: { liabilities: {} } };
          })
        ]);
        // Debug logging for Plaid responses
        console.log('Plaid accountsResp:', JSON.stringify(accountsResp.data, null, 2));
        console.log('Plaid liabilitiesResp:', JSON.stringify(liabilitiesResp.data, null, 2));
        const liabilities = liabilitiesResp.data.liabilities || {};
        const creditLiabilities = (liabilities.credit || []);
        // Map Plaid accounts to app format
        const mapped = await Promise.all(accountsResp.data.accounts.map(async (plaidAcc) => {
          let apr = undefined;
          let creditLimit = plaidAcc.credit_limit || plaidAcc.balances.limit || undefined;
          let include = true;
          if (plaidAcc.type === 'credit') {
            // Find matching liability by account_id
            const liability = creditLiabilities.find(l => l.account_id === plaidAcc.account_id);
            if (liability && Array.isArray(liability.aprs) && liability.aprs.length > 0) {
              // Use the first APR (usually purchase_apr)
              apr = parseFloat(liability.aprs[0].apr_percentage);
            }
            // Try to find a matching card for this account and update its APR/creditLimit if needed
            let card = await Card.findOne({ where: { account_id: acc.id } });
            if (!card && plaidAcc.mask) {
              card = await Card.findOne({
                where: {
                  account_id: acc.id,
                  card_name: { [require('sequelize').Op.like]: `%${plaidAcc.mask}` }
                }
              });
            }
            if (card) {
              // Update card APR and creditLimit if changed
              let updateFields = {};
              if (apr !== undefined && card.apr !== apr) updateFields.apr = apr;
              if (creditLimit !== undefined && card.creditLimit !== creditLimit) updateFields.creditLimit = creditLimit;
              if (Object.keys(updateFields).length > 0) await card.update(updateFields);
            } else {
              include = false;
              console.warn(`No card record found for account_id ${acc.id} and Plaid account ${plaidAcc.account_id}, skipping credit card.`);
            }
          }
          if (!include) return null;
          return {
            id: plaidAcc.account_id,
            institution: acc.institution || 'Unknown',
            balance: plaidAcc.balances.current ?? plaidAcc.balances.available ?? 0,
            type: plaidAcc.type,
            apr,
            creditLimit,
          };
        }));
        allAccounts = allAccounts.concat(mapped.filter(Boolean));
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