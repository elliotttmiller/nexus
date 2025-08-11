// get_cards_for_user.js
// Usage: node get_cards_for_user.js <user_id>
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./src/db');
const userId = process.argv[2];
(async () => {
  if (!userId) {
    console.error('Usage: node get_cards_for_user.js <user_id>');
    process.exit(1);
  }
  try {
    const cards = await db.Card.findAll({ where: { user_id: userId } });
    if (!cards.length) {
      console.log('No cards found for user:', userId);
    } else {
      console.log('Cards for user', userId + ':');
      cards.forEach(card => {
        console.log(`ID: ${card.id}, Name: ${card.card_name}`);
      });
    }
    process.exit(0);
  } catch (e) {
    console.error('Error fetching cards:', e);
    process.exit(1);
  }
})();
