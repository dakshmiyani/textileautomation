const express = require('express');
const machinesController = require('./machines.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);
router.get('/', machinesController.list);

module.exports = router;
