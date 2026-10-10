/**
 * Orders Routes
 * Express routes for the Orders & Calculations module
 */
const express = require('express');
const ordersController = require('./ordersController');
const { authenticate } = require('../../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Metric summary for dashboard cards
router.get('/metrics/summary', (req, res, next) => ordersController.getMetrics(req, res, next));

// Parse preview helper (before :id)
router.post('/preview', (req, res, next) => ordersController.previewParse(req, res, next));

// CRUD
router.get('/', (req, res, next) => ordersController.listOrders(req, res, next));
router.post('/', (req, res, next) => ordersController.createOrder(req, res, next));
router.get('/:id', (req, res, next) => ordersController.getOrder(req, res, next));
router.put('/:id', (req, res, next) => ordersController.updateOrder(req, res, next));
router.delete('/:id', (req, res, next) => ordersController.deleteOrder(req, res, next));

// Send/re-send WhatsApp reply
router.post('/:id/send-whatsapp', (req, res, next) => ordersController.sendWhatsApp(req, res, next));

module.exports = router;
