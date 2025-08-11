const db = require('./src/models');

(async () => {
  try {
    const [results, metadata] = await db.sequelize.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'cards\';');
    console.log('Columns in cards table:');
    results.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));
  } catch (err) {
    console.error('Error describing cards table:', err);
  } finally {
    await db.sequelize.close();
  }
})();
