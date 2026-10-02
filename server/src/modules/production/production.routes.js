const express = require('express');
const productionController = require('./production.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validate } = require('../../middleware/validation.middleware');
const {
  createProductionSchema,
  updateProductionSchema,
  queryProductionSchema
} = require('./production.validation');

const router = express.Router();

// Handled in parent router

// KPIs & Analytics
router.get('/kpis', requirePermission('production.read'), productionController.getKPIs);
router.get('/analytics', requirePermission('production.read'), productionController.getAnalytics);

// Excel export
router.get('/export', requirePermission('reports.export', 'production.read'), productionController.exportExcel);

// List & Detail
router.get('/', requirePermission('production.read'), validate(queryProductionSchema), productionController.listRecords);
router.get('/:id', requirePermission('production.read'), productionController.getRecordById);

// Create, Update, Delete
router.post('/', requirePermission('production.create'), validate(createProductionSchema), productionController.createRecord);
router.put('/:id', requirePermission('production.update'), validate(updateProductionSchema), productionController.updateRecord);
router.delete('/:id', requirePermission('production.delete'), productionController.deleteRecord);

module.exports = router;
