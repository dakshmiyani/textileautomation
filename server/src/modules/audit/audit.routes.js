const express = require('express');
const auditController = require('./audit.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/', requirePermission('audit.read', 'production.read'), auditController.getLogs);

module.exports = router;
