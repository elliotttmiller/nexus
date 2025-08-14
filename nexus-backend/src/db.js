const { Sequelize } = require('sequelize');
const config = require('../config/config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

if (dbConfig.url) {
  // Use URL if provided (production)
  sequelize = new Sequelize(dbConfig.url, {
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    dialectOptions: dbConfig.dialectOptions,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  // Use individual config (development/test)
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
      define: {
        timestamps: true,
        underscored: true,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    // Removed sequelize.sync() to prevent schema changes in production
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

// Only run in development or when explicitly needed
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

// Dynamically load all models and set up associations
const fs = require('fs');
const path = require('path');
const models = {};
models.Sequelize = Sequelize;
models.sequelize = sequelize;
models.testConnection = testConnection;

const modelsDir = path.join(__dirname, 'models');

fs.readdirSync(modelsDir)
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const modelModule = require(path.join(modelsDir, file));
    if (typeof modelModule === 'function') {
      const model = modelModule(sequelize, Sequelize.DataTypes);
      models[model.name] = model;
    } else {
      // Skip files that do not export a model function (e.g., index.js)
    }
  });

// Set up associations after all models are loaded
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

module.exports = models;