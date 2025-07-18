const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Read the schema file
const schemaPath = path.join(__dirname, '..', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Create Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Running database migrations...');
    await sequelize.query(schema);
    console.log('Database schema created successfully.');

    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 