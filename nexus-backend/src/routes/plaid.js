const express = require('express');
const router = express.Router();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const db = require('../models');
const Account = db.Account;
const Card = db.Card;
const Transaction = db.Transaction;
const { createClient } = require('redis');
const { Op } = require('sequelize');

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

// Initialize Redis client with fallback logic
const redisUrl = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });
redisClient.on('error', (err) => console.log('Redis Client Error', err));
(async () => { try { await redisClient.connect(); } catch (e) { console.error('Redis connect error:', e); } })();

// Create Link Token
router.post('/create_link_token', async (req, res) => {
  try {
    const { userId } = req.body;
    // Unified, robust product request
    const tokenConfig = {
      user: { client_user_id: String(userId) },
      client_name: 'Nexus',
      products: ['transactions', 'auth', 'identity', 'liabilities'],
      country_codes: ['US'],
      language: 'en',
      webhook: 'https://your-backend-url.up.railway.app/api/plaid/webhook', // optional, can be updated
    };
    console.log('[Plaid] Creating Link Token with products:', tokenConfig.products);
    const response = await plaidClient.linkTokenCreate(tokenConfig);
    res.json({ link_token: response.data.link_token });
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
    // Debug logging for Plaid API responses
    console.log('Plaid accountsGet response:', JSON.stringify(accountsResponse.data, null, 2));
    console.log('Plaid liabilitiesGet response:', JSON.stringify(liabilitiesResponse.data, null, 2));
    const allAccounts = accountsResponse.data.accounts;
    const liabilities = liabilitiesResponse.data.liabilities || {};
    const liabilityDataMap = new Map();
    const allLiabilities = [
      ...(liabilities.credit || []),
      ...(liabilities.student || []),
      ...(liabilities.mortgage || [])
    ];
    for (const liability of allLiabilities) {
      // Find the purchase_apr, or fallback to the first APR if not present
      let primaryApr = undefined;
      if (liability.aprs && Array.isArray(liability.aprs)) {
        primaryApr = liability.aprs.find(apr => apr.apr_type === 'purchase_apr') || liability.aprs[0];
      }
      liabilityDataMap.set(liability.account_id, {
        apr: primaryApr ? primaryApr.apr_percentage : undefined,
        minimum_payment_amount: liability.minimum_payment_amount,
      });
    }
    const mergedAccounts = allAccounts.map(account => {
      const liabilityDetails = liabilityDataMap.get(account.account_id);
      // Force type 'credit' for credit cards (Plaid type or name)
      let mappedType = account.type;
      if (account.type === 'credit' || (account.name && account.name.toLowerCase().includes('credit'))) {
        mappedType = 'credit';
      }
      return {
        id: account.account_id,
        name: account.name,
        institution: institutionName || 'Unknown',
        balance: account.balances.current,
        type: mappedType,
        apr: liabilityDetails ? liabilityDetails.apr : undefined,
        minimumPayment: liabilityDetails ? liabilityDetails.minimum_payment_amount : undefined,
        creditLimit: mappedType === 'credit' ? account.balances.limit : undefined,
      };
    });
    console.log('Merged Plaid accounts:', JSON.stringify(mergedAccounts, null, 2));
    return mergedAccounts;
  } catch (error) {
    console.error('[Plaid Service] Error fetching or merging Plaid data:', error.response ? error.response.data : error);
    return [];
  }
}

// Get Accounts
router.get('/accounts', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const cacheKey = `user:${userId}:accounts`;
  try {
    // 1. Try to get data from cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`CACHE HIT for user ${userId}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`CACHE MISS for user ${userId}`);
    const accounts = await Account.findAll({ where: { user_id: userId } });
    if (!accounts || accounts.length === 0) {
      return res.json([]);
    }
    let allAccounts = [];
    for (const acc of accounts) {
      const merged = await fetchAndMergeCompleteAccountData(acc.plaid_access_token, acc.institution);
      allAccounts = allAccounts.concat(merged);
    }
    // Store the result in Redis with a 30-minute expiration (1800 seconds)
    await redisClient.set(cacheKey, JSON.stringify(allAccounts), { EX: 1800 });
    console.log('Returning accounts:', allAccounts);
    res.json(allAccounts);
  } catch (err) {
    console.error('Error in /accounts:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Safe Payment & Cash Flow Aware Endpoint ---
// GET /accounts/payment-context?userId=...
router.get('/accounts/payment-context', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    // 1. Fetch all accounts for the user
    const cacheKey = `user:${userId}:accounts`;
    let allAccounts = [];
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      allAccounts = JSON.parse(cachedData);
    } else {
      const accounts = await Account.findAll({ where: { user_id: userId } });
      for (const acc of accounts) {
        const merged = await fetchAndMergeCompleteAccountData(acc.plaid_access_token, acc.institution);
        allAccounts = allAccounts.concat(merged);
      }
      await redisClient.set(cacheKey, JSON.stringify(allAccounts), { EX: 1800 });
    }
    // 2. Filter for depository (checking/savings) accounts
    const fundingAccounts = allAccounts.filter(acc => acc.type === 'depository' || acc.type === 'checking' || acc.type === 'savings');
    const totalCash = fundingAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    // 3. Fetch upcoming bills (simple prediction: recurring transactions or category includes 'bill')
    let totalUpcomingBills = 0;
    let upcomingBills = [];
    try {
      const today = new Date();
      const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
      // Find all recurring or bill-like transactions in the last 60 days
      const recurringTxs = await Transaction.findAll({
        where: {
          user_id: userId,
          date: { [Op.gte]: sixtyDaysAgo },
          [Op.or]: [
            { is_recurring: true },
            { category: { [Op.iLike]: '%bill%' } }
          ]
        }
      });
      // Group by merchant/category and estimate next 30 days' bills
      const billMap = new Map();
      for (const tx of recurringTxs) {
        const key = tx.merchant || tx.category || 'Other';
        if (!billMap.has(key)) billMap.set(key, { total: 0, count: 0 });
        billMap.get(key).total += parseFloat(tx.amount);
        billMap.get(key).count += 1;
      }
      // Estimate next 30 days' bills as average per group
      for (const [key, val] of billMap.entries()) {
        const avg = val.total / val.count;
        totalUpcomingBills += avg;
        upcomingBills.push({ name: key, estimated_amount: avg });
      }
    } catch (e) {
      console.warn('Bill prediction failed:', e.message);
    }
    // 4. Safety buffer
    const safetyBuffer = 500;
    // 5. Calculate max safe payment
    const discretionaryCash = totalCash - totalUpcomingBills - safetyBuffer;
    const maxSafePayment = Math.max(0, discretionaryCash);
    // 6. Recommend best funding account (highest balance)
    const recommendedFundingAccount = fundingAccounts.sort((a, b) => (b.balance || 0) - (a.balance || 0))[0] || null;
    res.json({
      maxSafePayment,
      recommendedFundingAccountId: recommendedFundingAccount ? recommendedFundingAccount.id : null,
      fundingAccounts,
      totalCash,
      totalUpcomingBills,
      upcomingBills,
      safetyBuffer
    });
  } catch (err) {
    console.error('Error in /accounts/payment-context:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Transactions
router.get('/transactions', async (req, res) => {
  const { userId, start_date, end_date } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  try {
    const account = await Account.findOne({ where: { user_id: userId } });
    if (!account) return res.json([]); // Return empty array if no account found
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