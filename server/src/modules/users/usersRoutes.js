const express = require('express');
const usersController = require('./usersController');
const { authenticate } = require('../../middleware/authMiddleware');
const { requirePermission } = require('../../middleware/permissionMiddleware');

const router = express.Router();
router.use(authenticate);
router.get('/', requirePermission('users.manage', 'production.read'), usersController.list);

module.exports = router;
