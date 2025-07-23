require('dotenv').config();

module.exports = {
  development: {
    database: process.env.PGDATABASE || 'railway',
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'hTckoowSOUVGSbZXigsxWBVXxlXYFAfu',
    host: process.env.PGHOST || 'shinkansen.proxy.rlwy.net',
    port: process.env.PGPORT || 57937,
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
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
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
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
  }
};
