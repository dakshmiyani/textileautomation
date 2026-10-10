const express = require('express');
const auditController = require('./auditController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');

const router = express.Router();

router.use(authenticate);
router.get('/', requirePermission('audit.read', 'production.read'), auditController.getLogs);

module.exports = router;
