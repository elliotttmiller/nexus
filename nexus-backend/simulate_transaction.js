const { Transaction, Card } = require('./src/models');

async function main() {
  // Find a Plaid card for user 8
  const card = await Card.findOne({ where: { user_id: 8, card_name: { $like: '%Credit Card%' } } });
  if (!card) {
    console.error('No Plaid credit card found for user 8.');
    process.exit(1);
  }
  // Create a test transaction
  const tx = await Transaction.create({
    card_id: card.id,
    amount: 123.45,
    currency: 'USD',
    merchant: 'Test Merchant',
    date: new Date(),
    category: 'shopping',
    ai_card_analysis: null
  });
  console.log('Created transaction:', tx.id);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
