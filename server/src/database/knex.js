const knexLib = require('knex');
const knexConfig = require('../../knexfile');
const env = require('../config/env');
const logger = require('../config/logger');

const environment = env.NODE_ENV || 'development';
const config = knexConfig[environment] || knexConfig.development;

let db;

try {
  db = knexLib(config);
} catch (err) {
  logger.error({ err }, 'Failed to initialize Knex database instance');
  throw err;
}

/**
 * Checks connection health and runs any pending migrations automatically on startup
 */
async function testConnectionAndMigrate() {
  try {
    // Test basic query
    await db.raw('SELECT 1+1 AS result');
    logger.info(`[DATABASE] Connected successfully using client "${config.client}"`);

    // Run migrations
    const [batchNo, log] = await db.migrate.latest();
    if (log.length === 0) {
      logger.info('[DATABASE] Migrations are up to date.');
    } else {
      logger.info(`[DATABASE] Batch ${batchNo} run: ${log.length} migrations applied: ${log.join(', ')}`);
    }

    // Run seed if users table is empty
    const hasUsers = await db.schema.hasTable('users');
    if (hasUsers) {
      const userCount = await db('users').count('* as count').first();
      const count = Number(userCount?.count || 0);
      if (count === 0) {
        logger.info('[DATABASE] Seeding initial data (roles, permissions, admin user)...');
        await db.seed.run();
        logger.info('[DATABASE] Initial seeding complete.');
      }
    }
  } catch (err) {
    if (config.client === 'pg' && (err.code === 'ECONNREFUSED' || err.code === '28P01' || err.code === '3D000')) {
      logger.error({ err }, '[DATABASE] PostgreSQL connection failed. Please check your DATABASE_URL in .env');
      throw err;
    } else {
      logger.error({ err }, '[DATABASE] Database connection/migration error');
      throw err;
    }
  }
}

/**
 * Dynamic Knex proxy that always delegates to active `db` instance
 */
const knexProxy = new Proxy(
  function (...args) {
    return db(...args);
  },
  {
    get(target, prop) {
      if (prop === 'destroy') {
        return (...args) => db.destroy(...args);
      }
      if (typeof db[prop] === 'function') {
        return (...args) => db[prop](...args);
      }
      return db[prop];
    },
    apply(target, thisArg, argArray) {
      return db(...argArray);
    }
  }
);

module.exports = {
  db: knexProxy,
  knex: knexProxy,
  getDb: () => db,
  testConnectionAndMigrate
};
