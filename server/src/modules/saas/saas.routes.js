const express = require('express');
const saasController = require('./saas.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { saasOwnerContext } = require('../../middleware/saasOwner.middleware');

const router = express.Router();

router.use(authenticate, saasOwnerContext);

router.get('/tenants', saasController.listTenants);
router.post('/tenants', saasController.createTenant);

module.exports = router;
