/**
 * Orders Controller
 * Handles HTTP requests for the Orders & Calculations module
 */
const ordersService = require('./ordersService');

class OrdersController {
  async listOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, search = '', status = 'ALL', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
      const result = await ordersService.listOrders(
        {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          search,
          status,
          sortBy,
          sortOrder
        },
        { tenantId: req.tenant?.id }
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  async getMetrics(req, res, next) {
    try {
      const summary = await ordersService.getMetricsSummary({ tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrder(req, res, next) {
    try {
      const order = await ordersService.getOrderById(req.params.id, { tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  async createOrder(req, res, next) {
    try {
      const order = await ordersService.createOrder(req.body, { user: req.user, tenantId: req.tenant?.id });
      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created and calculated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateOrder(req, res, next) {
    try {
      const order = await ordersService.updateOrder(req.params.id, req.body, { user: req.user, tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: order,
        message: 'Order updated and recalculated successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      await ordersService.deleteOrder(req.params.id, { tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        message: `Order #${req.params.id} deleted successfully`
      });
    } catch (err) {
      next(err);
    }
  }

  async previewParse(req, res, next) {
    try {
      const preview = ordersService.previewCalculation(req.body);
      res.status(200).json({
        success: true,
        data: preview
      });
    } catch (err) {
      next(err);
    }
  }

  async sendWhatsApp(req, res, next) {
    try {
      const result = await ordersService.sendOrderWhatsAppReply(req.params.id, req.body.phone, { tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: result,
        message: 'WhatsApp confirmation reply sent successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrdersController();
