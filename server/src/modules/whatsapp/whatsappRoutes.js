const express = require('express');
const whatsAppController = require('./whatsappController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/status', requirePermission('whatsapp.read'), whatsAppController.getStatus);
router.post('/connect', requirePermission('whatsapp.manage'), whatsAppController.connect);
router.post('/disconnect', requirePermission('whatsapp.manage'), whatsAppController.disconnect);
router.post('/reconnect', requirePermission('whatsapp.manage'), whatsAppController.reconnect);
router.get('/logs', requirePermission('whatsapp.read'), whatsAppController.getMessageLogs);

module.exports = router;
