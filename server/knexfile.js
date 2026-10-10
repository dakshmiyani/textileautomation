require('dotenv').config();
const path = require('path');



module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME || 'textile_erp',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'database', 'seeds')
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL 
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: { rejectUnauthorized: false }
        },
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: path.join(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'database', 'seeds')
    }
  },

  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL_TEST 
      ? { connectionString: process.env.DATABASE_URL_TEST, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT) || 5432,
          database: 'textile_erp_test',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'src', 'database', 'migrations')
    },
    seeds: {
      directory: path.join(__dirname, 'src', 'database', 'seeds')
    }
  }
};
