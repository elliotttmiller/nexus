const { Transaction, Card, Sequelize } = require('./src/models');
const Op = Sequelize.Op;

async function main() {
  // Find a Plaid card for the test user
  const card = await Card.findOne({ where: { user_id: 8, card_name: { [Op.like]: '%Credit Card%' } } });
  if (!card) {
    console.error('No Plaid credit card found for user_id=8');
    process.exit(1);
  }
  // Create a test transaction
  const tx = await Transaction.create({
    card_id: card.id,
    amount: 42.50,
    currency: 'USD',
    merchant: 'Test Merchant',
    category: 'shopping',
    date: new Date(),
    user_id: 8
  });
  console.log('Created test transaction:', tx.id);
}

main().catch(e => { console.error(e); process.exit(1); });
