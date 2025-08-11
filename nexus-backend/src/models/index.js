const { Sequelize } = require('sequelize');
const config = require('../../config/config');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize with config
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port, // Explicitly set port
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

// Import all models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add the sequelize instance and Sequelize class to the db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test the database connection and sync models
async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log(`Host: ${sequelize.config.host}, Database: ${sequelize.config.database}, User: ${sequelize.config.username}`);
    
    await sequelize.authenticate({ timeout: 10000 });
    console.log('Database connection has been established successfully.');
    // Removed sequelize.sync() to prevent schema changes in production
  } catch (error) {
    console.error('Unable to connect to the database:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Connection config:', {
      host: sequelize.config.host,
      database: sequelize.config.database,
      username: sequelize.config.username,
      port: sequelize.config.port,
      dialect: sequelize.config.dialect
    });
    process.exit(1);
  }
}

// Only run in development or when explicitly needed
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = db;
