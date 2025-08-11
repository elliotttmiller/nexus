// backfill_user_id_in_transactions.js
// Usage: node backfill_user_id_in_transactions.js
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./src/db');
(async () => {
  try {
    // Find all transactions with null user_id
    const txs = await db.Transaction.findAll({ where: { user_id: null } });
    for (const tx of txs) {
      // Try to infer user_id from the card
      const card = await db.Card.findByPk(tx.card_id);
      if (card && card.user_id) {
        await tx.update({ user_id: card.user_id });
        console.log(`Updated transaction ${tx.id} with user_id ${card.user_id}`);
      } else {
        console.log(`Could not infer user_id for transaction ${tx.id}`);
      }
    }
    console.log('Backfill complete.');
    process.exit(0);
  } catch (e) {
    console.error('Error during backfill:', e);
    process.exit(1);
  }
})();
