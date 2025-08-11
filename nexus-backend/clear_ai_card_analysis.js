const { Transaction } = require('./src/models');

async function main() {
  const tx = await Transaction.findByPk(1);
  if (!tx) {
    console.error('Transaction 1 not found');
    process.exit(1);
  }
  await tx.update({ ai_card_analysis: null });
  console.log('Cleared ai_card_analysis for transaction 1');
}

main().catch(e => { console.error(e); process.exit(1); });
