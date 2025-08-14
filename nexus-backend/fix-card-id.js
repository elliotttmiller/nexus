require('dotenv').config();
const { Sequelize } = require('sequelize');

// Parse DATABASE_URL
const url = new URL(process.env.DATABASE_URL);
const sequelize = new Sequelize({
  database: url.pathname.substring(1),
  username: url.username,
  password: url.password,
  host: url.hostname,
  port: url.port ? Number(url.port) : 5432,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function fixCardId() {
  try {
    console.log('🔧 Fixing card_id constraint...');
    
    // Run the SQL command to make card_id nullable
    await sequelize.query('ALTER TABLE transactions ALTER COLUMN card_id DROP NOT NULL;');
    
    console.log('✅ Successfully made card_id nullable in transactions table');
    
    // Verify the change
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'card_id';
    `);
    
    console.log('📋 Verification:', results[0]);
    
  } catch (error) {
    console.error('❌ Error fixing card_id constraint:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixCardId(); 