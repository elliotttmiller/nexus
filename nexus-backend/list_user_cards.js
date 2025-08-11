// Script to list all cards for a given user email
const db = require('./src/models');

async function listCardsForUser(email) {
  const user = await db.User.findOne({ where: { email } });
  if (!user) {
    console.error('No user found with email:', email);
    return;
  }
  const cards = await db.Card.findAll({ where: { user_id: user.id } });
  console.log(`User: ${email} (id: ${user.id})`);
  if (cards.length === 0) {
    console.log('No cards found for this user.');
    return;
  }
  for (const card of cards) {
    console.log(`- Card Name: ${card.card_name}, Card ID: ${card.id}`);
  }
}

listCardsForUser('elliotttmiller@hotmail.com').then(() => process.exit());
