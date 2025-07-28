const express = require('express');
const router = express.Router();
const { Card } = require('../models');

router.get('/error', (req, res) => {
  throw new Error('Sentry test error!');
});

// Add mock credit cards endpoint
router.post('/add-mock-cards', async (req, res) => {
  try {
    console.log('💳 Adding mock credit cards to database...');
    
    const mockCards = [
      {
        user_id: 1,
        account_id: 1,
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
        account_id: 2,
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
        account_id: 3,
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
        account_id: 4,
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
        const card = await Card.create(cardData);
        createdCards.push(card);
        console.log(`✅ Added: ${card.card_name} - $${card.balance} balance, ${card.apr}% APR`);
      } catch (error) {
        console.log(`⚠️ Card ${cardData.card_name} might already exist: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully added ${createdCards.length} mock credit cards`,
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

module.exports = router; 