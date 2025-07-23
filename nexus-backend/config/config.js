require('dotenv').config();

// Force production environment
process.env.NODE_ENV = 'production';

module.exports = {
  // Production configuration
  production: {
    database: 'railway',
    username: 'postgres',
    password: 'hTckoowSOUVGSbZXigsxWBVXxlXYFAfu',
    host: 'shinkansen.proxy.rlwy.net',
    port: 57937,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    url: process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/nexus_test',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
