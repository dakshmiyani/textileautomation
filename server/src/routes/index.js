const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const productionRoutes = require('../modules/production/production.routes');
const whatsappRoutes = require('../modules/whatsapp/whatsapp.routes');
const auditRoutes = require('../modules/audit/audit.routes');
const machinesRoutes = require('../modules/machines/machines.routes');
const usersRoutes = require('../modules/users/users.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const customersRoutes = require('../modules/customers/customers.routes');
const saasRoutes = require('../modules/saas/saas.routes');
const { authenticate } = require('../middleware/auth.middleware');
const { tenantContext } = require('../middleware/tenant.middleware');

const router = express.Router();

// System Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'Textile ERP API'
  });
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
