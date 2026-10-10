const express = require('express');
const machinesController = require('./machinesController');
const { authenticate } = require('../../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);
router.get('/', machinesController.list);

module.exports = router;
