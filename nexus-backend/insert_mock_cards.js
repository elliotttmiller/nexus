const { Card } = require('./src/models');
const { sequelize } = require('./src/db');

async function insertMockCards() {
  console.log('💳 Inserting Mock Credit Cards into Database');
  console.log('=' .repeat(50));
  console.log('This will insert mock credit cards into the database');
  console.log('so they appear in the mobile app for testing');
  console.log();

  try {
    // Mock credit cards data
    const mockCards = [
      {
        user_id: 1,
        account_id: 1,
        card_name: 'Chase Sapphire Preferred',
        apr: 21.49,
        balance: 5000.00,
        credit_limit: 15000.00,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
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
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
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
        due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
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
        due_date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
        rewards: {
          type: 'rotating',
          rate: '5%',
          categories: ['gas_stations', 'grocery_stores', 'restaurants', 'amazon']
        }
      }
    ];

    console.log(`📊 Inserting ${mockCards.length} mock credit cards into database...`);

    // Insert each card into the database
    for (let i = 0; i < mockCards.length; i++) {
      const card = mockCards[i];
      console.log(`\n💳 Inserting card ${i + 1}: ${card.card_name}`);
      console.log(`   📊 Data: $${card.balance.toFixed(2)} balance, ${card.apr}% APR`);

      try {
        const createdCard = await Card.create(card);
        console.log(`   ✅ Successfully inserted: ${createdCard.card_name} - $${createdCard.balance} balance, ${createdCard.apr}% APR`);
      } catch (error) {
        console.log(`   ❌ Failed to insert ${card.card_name}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully inserted mock credit cards!`);
    console.log('\n📱 Now you can test in the mobile app:');
    console.log('   1. Open the mobile app');
    console.log('   2. Go to Accounts screen');
    console.log('   3. You should see the mock credit cards');
    console.log('   4. Go to Pay Cards screen');
    console.log('   5. Test the AI recommendation feature');
    console.log('   6. Try different payment amounts');

  } catch (error) {
    console.error('❌ Error inserting mock cards:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
insertMockCards().then(() => {
  console.log('\n🎉 Mock cards insertion completed!');
  console.log('You can now test the AI features in the mobile app!');
}).catch((error) => {
  console.error('\n❌ Failed to insert mock cards:', error);
}); 