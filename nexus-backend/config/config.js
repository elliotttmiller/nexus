require('dotenv').config();

// Force production environment if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Parse DATABASE_URL if available
let dbConfig = {};
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    database: url.pathname.substring(1), // Remove leading '/'
    username: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port ? Number(url.port) : undefined,
  };
  console.log('[DEBUG] Parsed DATABASE_URL:', process.env.DATABASE_URL);
  console.log('[DEBUG] Parsed dbConfig:', dbConfig);
}

module.exports = {
  development: {
    database: dbConfig.database || process.env.DB_NAME || 'railway',
    username: dbConfig.username || process.env.DB_USER || 'postgres',
    password: dbConfig.password || process.env.DB_PASSWORD || 'hTckoowSOUVGSbZXigsxWBVXxlXYFAfu',
    host: dbConfig.host || process.env.DB_HOST || 'localhost',
    port: dbConfig.port || process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    database: dbConfig.database || process.env.DB_NAME || 'railway',
    username: dbConfig.username || process.env.DB_USER || 'postgres',
    password: dbConfig.password || process.env.DB_PASSWORD || 'hTckoowSOUVGSbZXigsxWBVXxlXYFAfu',
    host: dbConfig.host || process.env.DB_HOST || 'shinkansen.proxy.rlwy.net',
    port: dbConfig.port || process.env.DB_PORT || 57937,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
