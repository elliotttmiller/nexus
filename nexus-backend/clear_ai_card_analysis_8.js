const { Transaction } = require('./src/models');

async function main() {
  const tx = await Transaction.findByPk(8);
  if (!tx) {
    console.error('Transaction 8 not found');
    process.exit(1);
  }
  await tx.update({ ai_card_analysis: null });
  console.log('Cleared ai_card_analysis for transaction 8');
}

main().catch(e => { console.error(e); process.exit(1); });
