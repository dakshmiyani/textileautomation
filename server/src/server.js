const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { testConnectionAndMigrate, knex } = require('./database/knex');
const { whatsAppSessionManager } = require('./modules/whatsapp/whatsappConnection');
const { initExportWorkers } = require('./jobs/workers/exportWorker');

async function startServer() {
  try {
    logger.info('Starting Textile ERP Backend Server...');

    // 1. Database Connection & Migration Check
    await testConnectionAndMigrate();

    // 2. Initialize Background Job Workers
    initExportWorkers();

    // 3. Start Express HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          apiPrefix: '/api/v1'
        },
        `🚀 Textile ERP Server running at http://localhost:${env.PORT}`
      );
    });

    // 4. Initialize WhatsApp Gateway in background (non-blocking)
    if (env.WHATSAPP_AUTO_CONNECT) {
      logger.info('Auto-connecting WhatsApp gateways for all tenants...');
      try {
        const activeSessions = await knex('whatsapp_sessions').where('status', 'CONNECTED');
        for (const session of activeSessions) {
          whatsAppSessionManager.initialize(session.tenant_id).catch((err) => {
            logger.warn({ error: err.message, tenantId: session.tenant_id }, 'Initial WhatsApp connection attempt paused. Connect via Dashboard.');
          });
        }
      } catch (err) {
        logger.error({ error: err.message }, 'Failed to fetch active whatsapp sessions on startup');
      }
    }

    // 5. Graceful Shutdown
    const handleShutdown = async (signal) => {
      logger.info({ signal }, 'Received shutdown signal. Closing resources...');

      server.close(async () => {
        logger.info('HTTP server closed.');

        try {
          // Disconnect WhatsApp
          const activeSessions = Array.from(whatsAppSessionManager.sessions.keys());
          for (const tenantId of activeSessions) {
            await whatsAppSessionManager.disconnect(tenantId);
          }
          logger.info('WhatsApp gateways disconnected.');
        } catch (e) {
          logger.warn({ error: e.message }, 'Error closing WhatsApp gateway');
        }

        try {
          // Close Knex pool
          await knex.destroy();
          logger.info('Database pool closed.');
        } catch (e) {
          logger.warn({ error: e.message }, 'Error closing DB pool');
        }

        logger.info('Graceful shutdown completed.');
        process.exit(0);
      });

      // Force exit after 10s if hanging
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    logger.fatal({ error: err.message, stack: err.stack }, 'Fatal error during server startup');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
