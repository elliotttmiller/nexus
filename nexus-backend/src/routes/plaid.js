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
      console.log('[Plaid] No accounts found, returning mock credit cards for testing');
      
      // Return mock credit cards when no real accounts are found
      const mockAccounts = [
        {
          id: 'mock_chase_1',
          name: 'Chase Sapphire Preferred',
          type: 'credit',
          subtype: 'credit card',
          mask: '1234',
          last4: '1234',
          institution_id: 'mock_chase',
          institution_name: 'Chase',
          institution: 'Chase',
          balance: 5000.00,
          apr: 21.49,
          creditLimit: 15000.00,
          credit_limit: 15000.00,
          minimum_payment: 150.00,
          due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          rewards: {
            type: 'travel',
            rate: '2x',
            categories: ['travel', 'dining']
          }
        },
        {
          id: 'mock_amex_1',
          name: 'American Express Gold',
          type: 'credit',
          subtype: 'credit card',
          mask: '5678',
          last4: '5678',
          institution_id: 'mock_amex',
          institution_name: 'American Express',
          institution: 'American Express',
          balance: 3000.00,
          apr: 18.99,
          creditLimit: 25000.00,
          credit_limit: 25000.00,
          minimum_payment: 100.00,
          due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          rewards: {
            type: 'dining',
            rate: '4x',
            categories: ['dining', 'groceries']
          }
        },
        {
          id: 'mock_citi_1',
          name: 'Citi Double Cash',
          type: 'credit',
          subtype: 'credit card',
          mask: '9012',
          last4: '9012',
          institution_id: 'mock_citi',
          institution_name: 'Citi',
          institution: 'Citi',
          balance: 7500.00,
          apr: 22.99,
          creditLimit: 20000.00,
          credit_limit: 20000.00,
          minimum_payment: 200.00,
          due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          rewards: {
            type: 'cashback',
            rate: '2%',
            categories: ['all_purchases']
          }
        },
        {
          id: 'mock_discover_1',
          name: 'Discover it Cash Back',
          type: 'credit',
          subtype: 'credit card',
          mask: '3456',
          last4: '3456',
          institution_id: 'mock_discover',
          institution_name: 'Discover',
          institution: 'Discover',
          balance: 1200.00,
          apr: 16.99,
          creditLimit: 10000.00,
          credit_limit: 10000.00,
          minimum_payment: 50.00,
          due_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          rewards: {
            type: 'rotating',
            rate: '5%',
            categories: ['gas_stations', 'grocery_stores', 'restaurants', 'amazon']
          }
        }
      ];
      
      console.log(`[Plaid] SUCCESS: Returning ${mockAccounts.length} mock credit cards for testing`);
      return res.json(mockAccounts);
    }
    
    let allAccounts = [];
    for (const acc of accounts) {
      const merged = await fetchAndMergeCompleteAccountData(acc.plaid_access_token, acc.institution);
      allAccounts = allAccounts.concat(merged);
    }
    // Store the result in Redis with a 30-minute expiration (1800 seconds)
    await redisClient.set(cacheKey, JSON.stringify(allAccounts), { EX: 1800 });
    console.log(`[Plaid] SUCCESS: Returning ${allAccounts.length} real accounts`);
    res.json(allAccounts);
  } catch (err) {
    console.error('[Plaid] ERROR in /accounts:', err);
    res.status(500).json({ 
      error: err.message,
      details: 'Failed to load financial data',
      timestamp: new Date().toISOString(),
      userId: userId
    });
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

// Add mock credit cards endpoint
router.post('/add-mock-cards', async (req, res) => {
  try {
    console.log('💳 Adding mock credit cards to database...');
    
    const mockCards = [
      {
        user_id: 1,
        account_id: 101, // Changed from 1 to avoid conflicts
        card_name: 'Chase Sapphire Preferred',
        apr: 21.49,
        balance: 5000.00,
        credit_limit: 15000.00,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        rewards: {
          type: 'travel',
          rate: '2x',
          categories: ['travel', 'dining']
        }
      },
      {
        user_id: 1,
        account_id: 102, // Changed from 2
        card_name: 'American Express Gold',
        apr: 18.99,
        balance: 3000.00,
        credit_limit: 25000.00,
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        rewards: {
          type: 'dining',
          rate: '4x',
          categories: ['dining', 'groceries']
        }
      },
      {
        user_id: 1,
        account_id: 103, // Changed from 3
        card_name: 'Citi Double Cash',
        apr: 22.99,
        balance: 7500.00,
        credit_limit: 20000.00,
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        rewards: {
          type: 'cashback',
          rate: '2%',
          categories: ['all_purchases']
        }
      },
      {
        user_id: 1,
        account_id: 104, // Changed from 4
        card_name: 'Discover it Cash Back',
        apr: 16.99,
        balance: 1200.00,
        credit_limit: 10000.00,
        due_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        rewards: {
          type: 'rotating',
          rate: '5%',
          categories: ['gas_stations', 'grocery_stores', 'restaurants', 'amazon']
        }
      }
    ];

    const createdCards = [];
    
    for (const cardData of mockCards) {
      try {
        // First, try to find existing card with same account_id
        const existingCard = await Card.findOne({ 
          where: { 
            user_id: cardData.user_id, 
            account_id: cardData.account_id 
          } 
        });
        
        if (existingCard) {
          console.log(`⚠️ Card ${cardData.card_name} already exists, updating...`);
          await existingCard.update(cardData);
          createdCards.push(existingCard);
        } else {
          console.log(`✅ Creating new card: ${cardData.card_name}`);
          const card = await Card.create(cardData);
          createdCards.push(card);
        }
        
        console.log(`✅ Added/Updated: ${cardData.card_name} - $${cardData.balance} balance, ${cardData.apr}% APR`);
      } catch (error) {
        console.log(`❌ Error with ${cardData.card_name}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully added/updated ${createdCards.length} mock credit cards`,
      cards: createdCards.map(card => ({
        id: card.id,
        name: card.card_name,
        balance: card.balance,
        apr: card.apr,
        credit_limit: card.credit_limit
      }))
    });

  } catch (error) {
    console.error('❌ Error adding mock cards:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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