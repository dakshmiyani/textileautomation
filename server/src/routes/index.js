const express = require('express');
const authRoutes = require('../modules/auth/authRoutes');
const productionRoutes = require('../modules/production/productionRoutes');
const whatsappRoutes = require('../modules/whatsapp/whatsappRoutes');
const auditRoutes = require('../modules/audit/auditRoutes');
const machinesRoutes = require('../modules/machines/machinesRoutes');
const usersRoutes = require('../modules/users/usersRoutes');
const ordersRoutes = require('../modules/orders/ordersRoutes');
const customersRoutes = require('../modules/customers/customersRoutes');
const saasRoutes = require('../modules/saas/saasRoutes');
const { authenticate } = require('../middleware/authMiddleware');
const { tenantContext } = require('../middleware/tenantMiddleware');

const router = express.Router();

const { knex } = require('../database/knex');

// System & Database Health Check
router.get('/health', async (req, res) => {
  try {
    // Check PostgreSQL connection
    await knex.raw('SELECT 1');
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
      version: '1.0.0',
      service: 'Textile ERP API'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'Textile ERP API'
    });
  }
});

// Phase 1 Core Modules
// Auth does not need tenant context for login/refresh
router.use('/auth', authRoutes);

// SaaS Owner routes (does not need tenantContext, uses saasOwnerContext inside)
router.use('/saas', saasRoutes);

// Tenant-scoped routes
router.use('/production', authenticate, tenantContext, productionRoutes);
router.use('/orders', authenticate, tenantContext, ordersRoutes);
router.use('/whatsapp', authenticate, tenantContext, whatsappRoutes);
router.use('/audit', authenticate, tenantContext, auditRoutes);
router.use('/machines', authenticate, tenantContext, machinesRoutes);
router.use('/customers', authenticate, tenantContext, customersRoutes);

// Users route needs to be careful: creating users vs platform admins
router.use('/users', authenticate, tenantContext, usersRoutes);

// Modular placeholder endpoints for Phase 2/3 ERP expansion
const futureModules = ['inventory', 'suppliers', 'products', 'reports', 'settings'];

futureModules.forEach((mod) => {
  router.all(`/${mod}*`, authenticate, (req, res) => {
    res.status(200).json({
      success: true,
      data: [],
      message: `The ${mod.toUpperCase()} module is scheduled for Phase 2/3 ERP rollout. Database schema and architecture are ready.`
    });
  });
});

module.exports = router;
