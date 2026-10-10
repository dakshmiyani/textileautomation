const express = require('express');
const saasController = require('./saasController');
const { authenticate } = require('../../middleware/authMiddleware');
const { saasOwnerContext } = require('../../middleware/saasOwnerMiddleware');

const router = express.Router();

router.use(authenticate, saasOwnerContext);

router.get('/tenants', saasController.listTenants);
router.post('/tenants', saasController.createTenant);

module.exports = router;
