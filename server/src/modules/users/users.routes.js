const express = require('express');
const usersController = require('./users.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');

const router = express.Router();
router.use(authenticate);
router.get('/', requirePermission('users.manage', 'production.read'), usersController.list);

module.exports = router;
