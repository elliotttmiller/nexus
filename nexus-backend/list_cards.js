const { Card } = require('./src/models');

async function main() {
  const cards = await Card.findAll();
  for (const card of cards) {
    console.log({
      id: card.id,
      user_id: card.user_id,
      card_name: card.card_name,
      account_id: card.account_id,
      plaid_account_id: card.plaid_account_id,
      balance: card.balance,
      credit_limit: card.credit_limit,
      apr: card.apr
    });
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
