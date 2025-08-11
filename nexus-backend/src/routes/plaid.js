
const express = require('express');
const router = express.Router();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const db = require('../models');
const Account = db.Account;
const Card = db.Card;
const Transaction = db.Transaction;
const { createClient } = require('redis');
const { Op } = require('sequelize');
const axios = require('axios');

// Get a transaction with AI card analysis (for mobile app)
router.get('/transaction/:id/ai-analysis', async (req, res) => {
  try {
    const tx = await db.Transaction.findByPk(req.params.id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({
      id: tx.id,
      amount: tx.amount,
      merchant: tx.merchant,
      date: tx.date,
      card_id: tx.card_id,
      ai_card_analysis: tx.ai_card_analysis
    });
  } catch (err) {
    console.error('[Get AI Card Analysis] Error:', err);
    res.status(500).json({ error: err.message });
  }
});
// --- Plaid Webhook Listener ---
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    // Log and store the webhook for idempotency and debugging
    console.log('[Plaid Webhook] Received:', JSON.stringify(payload, null, 2));
    // Only handle transaction webhooks for now
    if (payload.webhook_type === 'TRANSACTIONS' && payload.webhook_code === 'TRANSACTIONS_ADDED') {
      // For each new transaction, analyze optimal card
      const userId = await getUserIdFromItemId(payload.item_id);
      if (!userId) {
        console.warn('[Plaid Webhook] No user found for item_id:', payload.item_id);
        return res.status(200).json({ status: 'ok' });
      }
      // Fetch new transactions from DB (idempotent: only update if not already analyzed)
      const newTxs = await db.Transaction.findAll({
        where: {
          user_id: userId,
          plaid_transaction_id: payload.new_transactions ? { [Op.in]: payload.new_transactions } : undefined
        }
      });
      const userCards = await db.Card.findAll({ where: { user_id: userId } });
      for (const tx of newTxs) {
        if (tx.ai_card_analysis) continue; // Idempotency: skip if already analyzed
        // Optionally fetch user goal from profile/settings
        let userGoal = 'MAXIMIZE_CASHBACK';
        try {
          const user = await db.User.findByPk(userId);
          if (user && user.ai_card_goal) userGoal = user.ai_card_goal;
        } catch {}
        const aiResult = await analyzeTransactionOptimalCard(userCards, tx, userGoal);
        await tx.update({ ai_card_analysis: aiResult });
      }
    }
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Plaid Webhook] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Map Plaid item_id to user_id (implement as needed)
async function getUserIdFromItemId(item_id) {
  const account = await Account.findOne({ where: { plaid_item_id: item_id } });
  return account ? account.user_id : null;
}

// Helper: Analyze transaction and compare to AI optimal card
async function analyzeTransactionOptimalCard(userCards, transaction, userGoal = 'MAXIMIZE_CASHBACK') {
  const aiPayload = {
    user_cards: userCards.map(card => ({
      id: card.id,
      name: card.card_name,
      balance: parseFloat(card.balance),
      creditLimit: parseFloat(card.credit_limit),
      apr: parseFloat(card.apr),
      utilization: card.credit_limit ? parseFloat(card.balance) / parseFloat(card.credit_limit) : 0,
      rewards: card.rewards,
      point_value_cents: 1,
      signup_bonus_progress: null
    })),
    transaction_context: {
      merchantName: transaction.merchant,
      amount: parseFloat(transaction.amount),
      category: transaction.category,
      location: transaction.location || '',
      date: transaction.date
    },
    user_context: {
      primaryGoal: userGoal
    }
  };
  const AI_BASE_URL = process.env.AI_BASE_URL;
  let aiResponse;
  try {
    const resp = await axios.post(`${AI_BASE_URL}/v2/cardrank`, aiPayload);
    aiResponse = resp.data;
  } catch (e) {
    console.error('[AI CardRank] Error:', e.message);
    aiResponse = null;
  }
  const usedCardId = transaction.card_id;
  const aiCardId = aiResponse && aiResponse.recommended_card ? aiResponse.recommended_card.id : null;
  const isOptimal = usedCardId && aiCardId && String(usedCardId) === String(aiCardId);
  return {
    isOptimal,
    aiCard: aiResponse ? aiResponse.recommended_card : null,
    usedCard: userCards.find(c => String(c.id) === String(usedCardId)),
    explanation: aiResponse ? aiResponse.reason : null,
    why_not: aiResponse ? aiResponse.why_not : null
  };
}
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

    // --- Sync Plaid credit accounts into Card table ---
    try {
      const accountsResponse = await plaidClient.accountsGet({ access_token });
      const accounts = accountsResponse.data.accounts || [];
      console.log('[Plaid] All Plaid accounts:', JSON.stringify(accounts, null, 2));
      let createdCount = 0;
      for (const account of accounts) {
        // Only sync credit card accounts
        if (account.type === 'credit' || (account.name && account.name.toLowerCase().includes('credit'))) {
          console.log('[Plaid] Syncing credit account:', account);
          try {
            const [card, created] = await Card.upsert({
              user_id: userId,
              account_id: null, // Plaid cards do not use integer account_id
              plaid_account_id: account.account_id, // Store Plaid account_id in plaid_account_id
              card_name: account.name,
              apr: account.apr || null,
              balance: account.balances.current,
              credit_limit: account.balances.limit,
              // Add more fields as needed
            }, {
              where: { user_id: userId, plaid_account_id: account.account_id }
            });
            console.log(`[Plaid] Upserted card:`, card ? card.toJSON ? card.toJSON() : card : card, 'Created:', created);
            createdCount++;
          } catch (err) {
            console.error('[Plaid] Error upserting card:', err);
          }
        } else {
          console.log('[Plaid] Skipping non-credit account:', account);
        }
      }
      console.log(`[Plaid] Synced ${createdCount} credit card(s) to Card table for user ${userId}`);
    } catch (e) {
      console.error('[Plaid] Error syncing credit cards to Card table:', e.message);
    }

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
  
  console.log(`[Plaid] Request for accounts, userId: ${userId}`);
  const cacheKey = `user:${userId}:accounts`;
  
  try {
    // 1. Try to get data from cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`[Plaid] CACHE HIT for user ${userId}`);
      return res.json(JSON.parse(cachedData));
    }
    console.log(`[Plaid] CACHE MISS for user ${userId}`);
    
    const accounts = await Account.findAll({ where: { user_id: userId } });
    console.log(`[Plaid] Found ${accounts.length} accounts for user ${userId}`);
    
        if (accounts.length === 0) {
            console.log('[Plaid] No accounts found for user, returning empty array.');
            return res.json([]);
        }

    // If real accounts exist, fetch and merge Plaid data
    let allAccounts = [];
    for (const acc of accounts) {
      const merged = await fetchAndMergeCompleteAccountData(acc.plaid_access_token, acc.institution);
      allAccounts = allAccounts.concat(merged);
    }
    await redisClient.set(cacheKey, JSON.stringify(allAccounts), { EX: 1800 });

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
    if (!account) {
      console.log('[Plaid] No account found, returning mock transactions');
      
      // Return mock transactions when no real account is found
      const mockTransactions = [
        {
          id: 'mock_tx_1',
          account_id: 'mock_chase_1',
          amount: 89.50,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          name: 'Amazon.com',
          merchant_name: 'Amazon.com',
          category: ['shopping', 'online'],
          category_id: '22016000',
          pending: false,
          account_owner: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          payment_channel: 'online',
          payment_processor_id: null,
          reference_number: null,
          by_order_of: null,
          payee: null,
          payer: null,
          type: 'special',
          subcategory: ['online'],
          check_number: null,
          date_transacted: null,
          location: {
            address: null,
            city: null,
            region: null,
            country: null,
            lat: null,
            lon: null,
            store_number: null,
            postal_code: null
          },
          payment_meta: {
            by_order_of: null,
            payee: null,
            payer: null,
            payment_method: null,
            payment_processor: null,
            ppd_id: null,
            reason: null,
            reference_number: null
          }
        },
        {
          id: 'mock_tx_2',
          account_id: 'mock_amex_1',
          amount: 156.78,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          name: 'Whole Foods Market',
          merchant_name: 'Whole Foods Market',
          category: ['food_and_drink', 'groceries'],
          category_id: '22009000',
          pending: false,
          account_owner: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          payment_channel: 'in store',
          payment_processor_id: null,
          reference_number: null,
          by_order_of: null,
          payee: null,
          payer: null,
          type: 'place',
          subcategory: ['groceries'],
          check_number: null,
          date_transacted: null,
          location: {
            address: '123 Main St',
            city: 'New York',
            region: 'NY',
            country: 'US',
            lat: 40.7128,
            lon: -74.0060,
            store_number: '1234',
            postal_code: '10001'
          },
          payment_meta: {
            by_order_of: null,
            payee: null,
            payer: null,
            payment_method: null,
            payment_processor: null,
            ppd_id: null,
            reason: null,
            reference_number: null
          }
        },
        {
          id: 'mock_tx_3',
          account_id: 'mock_citi_1',
          amount: 45.20,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          name: 'Shell Gas Station',
          merchant_name: 'Shell',
          category: ['food_and_drink', 'gas_stations'],
          category_id: '22009000',
          pending: false,
          account_owner: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          payment_channel: 'in store',
          payment_processor_id: null,
          reference_number: null,
          by_order_of: null,
          payee: null,
          payer: null,
          type: 'place',
          subcategory: ['gas_stations'],
          check_number: null,
          date_transacted: null,
          location: {
            address: '456 Oak Ave',
            city: 'New York',
            region: 'NY',
            country: 'US',
            lat: 40.7589,
            lon: -73.9851,
            store_number: '5678',
            postal_code: '10002'
          },
          payment_meta: {
            by_order_of: null,
            payee: null,
            payer: null,
            payment_method: null,
            payment_processor: null,
            ppd_id: null,
            reason: null,
            reference_number: null
          }
        },
        {
          id: 'mock_tx_4',
          account_id: 'mock_discover_1',
          amount: 234.99,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          name: 'Target',
          merchant_name: 'Target',
          category: ['shopping', 'department_stores'],
          category_id: '22016000',
          pending: false,
          account_owner: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          payment_channel: 'in store',
          payment_processor_id: null,
          reference_number: null,
          by_order_of: null,
          payee: null,
          payer: null,
          type: 'place',
          subcategory: ['department_stores'],
          check_number: null,
          date_transacted: null,
          location: {
            address: '789 Pine St',
            city: 'New York',
            region: 'NY',
            country: 'US',
            lat: 40.7505,
            lon: -73.9934,
            store_number: '9012',
            postal_code: '10003'
          },
          payment_meta: {
            by_order_of: null,
            payee: null,
            payer: null,
            payment_method: null,
            payment_processor: null,
            ppd_id: null,
            reason: null,
            reference_number: null
          }
        },
        {
          id: 'mock_tx_5',
          account_id: 'mock_chase_1',
          amount: 67.89,
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          name: 'Starbucks',
          merchant_name: 'Starbucks',
          category: ['food_and_drink', 'restaurants'],
          category_id: '22009000',
          pending: false,
          account_owner: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          payment_channel: 'in store',
          payment_processor_id: null,
          reference_number: null,
          by_order_of: null,
          payee: null,
          payer: null,
          type: 'place',
          subcategory: ['restaurants'],
          check_number: null,
          date_transacted: null,
          location: {
            address: '321 Coffee Blvd',
            city: 'New York',
            region: 'NY',
            country: 'US',
            lat: 40.7614,
            lon: -73.9776,
            store_number: '3456',
            postal_code: '10004'
          },
          payment_meta: {
            by_order_of: null,
            payee: null,
            payer: null,
            payment_method: null,
            payment_processor: null,
            ppd_id: null,
            reason: null,
            reference_number: null
          }
        },
        {
          id: 'mock_tx_6',
          account_id: 'mock_amex_1',
          amount: 189.99,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          name: 'Uber',
          merchant_name: 'Uber',
          category: ['travel', 'taxi'],
          category_id: '22016000',
          pending: false,
          account_owner: null,
          iso_currency_code: 'USD',
          unofficial_currency_code: null,
          payment_channel: 'online',
          payment_processor_id: null,
          reference_number: null,
          by_order_of: null,
          payee: null,
          payer: null,
          type: 'special',
          subcategory: ['taxi'],
          check_number: null,
          date_transacted: null,
          location: {
            address: null,
            city: null,
            region: null,
            country: null,
            lat: null,
            lon: null,
            store_number: null,
            postal_code: null
          },
          payment_meta: {
            by_order_of: null,
            payee: null,
            payer: null,
            payment_method: null,
            payment_processor: null,
            ppd_id: null,
            reason: null,
            reference_number: null
          }
        }
      ];
      
      console.log(`[Plaid] Returning ${mockTransactions.length} mock transactions`);
      return res.json(mockTransactions);
    }
    
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


// Clear all accounts endpoint
router.post('/clear-accounts', async (req, res) => {
  try {
    console.log('🗑️ Clearing all accounts...');
    
    const deletedAccounts = await Account.destroy({
      where: { user_id: 1 }
    });
    
    console.log(`✅ Deleted ${deletedAccounts} accounts`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedAccounts} accounts`
    });
    
  } catch (error) {
    console.error('❌ Error clearing accounts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all cards endpoint
router.post('/clear-cards', async (req, res) => {
  try {
    console.log('🗑️ Clearing all cards...');
    
    const deletedCards = await Card.destroy({
      where: { user_id: 1 }
    });
    
    console.log(`✅ Deleted ${deletedCards} cards`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedCards} cards`
    });
    
  } catch (error) {
    console.error('❌ Error clearing cards:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all transactions endpoint
router.post('/clear-transactions', async (req, res) => {
  try {
    console.log('🗑️ Clearing all transactions...');
    
    const deletedTransactions = await Transaction.destroy({
      where: { user_id: 1 }
    });
    
    console.log(`✅ Deleted ${deletedTransactions} transactions`);
    
    res.json({
      success: true,
      message: `Successfully cleared ${deletedTransactions} transactions`
    });
    
  } catch (error) {
    console.error('❌ Error clearing transactions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear all data endpoint (comprehensive)
router.post('/clear-all-data', async (req, res) => {
  try {
    console.log('🧹 Clearing all data for fresh start...');
    
    const [deletedAccounts, deletedCards, deletedTransactions] = await Promise.all([
      Account.destroy({ where: { user_id: 1 } }),
      Card.destroy({ where: { user_id: 1 } }),
      Transaction.destroy({ where: { user_id: 1 } })
    ]);
    
    console.log(`✅ Deleted ${deletedAccounts} accounts, ${deletedCards} cards, ${deletedTransactions} transactions`);
    
    res.json({
      success: true,
      message: `Successfully cleared all data: ${deletedAccounts} accounts, ${deletedCards} cards, ${deletedTransactions} transactions`
    });
    
  } catch (error) {
    console.error('❌ Error clearing all data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;