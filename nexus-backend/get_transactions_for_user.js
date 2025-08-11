// get_transactions_for_user.js
// Usage: node get_transactions_for_user.js <user_id>
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./src/db');
const userId = process.argv[2];
(async () => {
  if (!userId) {
    console.error('Usage: node get_transactions_for_user.js <user_id>');
    process.exit(1);
  }
  try {
    const txs = await db.Transaction.findAll({ where: { user_id: userId } });
    if (!txs.length) {
      console.log('No transactions found for user:', userId);
    } else {
      console.log('Transactions for user', userId + ':');
      txs.forEach(tx => {
        console.log(`ID: ${tx.id}, Amount: ${tx.amount}, Merchant: ${tx.merchant}, Date: ${tx.date}`);
      });
    }
    process.exit(0);
  } catch (e) {
    console.error('Error fetching transactions:', e);
    process.exit(1);
  }
})();
