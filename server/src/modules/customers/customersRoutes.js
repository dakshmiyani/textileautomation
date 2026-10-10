const express = require('express');
const router = express.Router();
const customersController = require('./customersController');
const { authenticate } = require('../../middleware/authMiddleware');

// GET /api/customers
router.get('/', authenticate, customersController.getCustomers.bind(customersController));

// POST /api/customers
router.post('/', authenticate, customersController.createCustomer.bind(customersController));

// PUT /api/customers/:id
router.put('/:id', authenticate, customersController.updateCustomer.bind(customersController));

// DELETE /api/customers/:id
router.delete('/:id', authenticate, customersController.deleteCustomer.bind(customersController));

module.exports = router;
