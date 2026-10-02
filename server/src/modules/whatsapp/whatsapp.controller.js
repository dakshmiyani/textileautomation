const whatsAppService = require('./whatsapp.service');

class WhatsAppController {
  async getStatus(req, res, next) {
    try {
      const status = await whatsAppService.getStatus(req.tenant?.id);
      res.status(200).json({
        success: true,
        data: status,
        message: 'WhatsApp status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async connect(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        tenantId: req.tenant?.id
      };

      const result = await whatsAppService.connect(context);
      res.status(200).json({
        success: true,
        data: result,
        message: 'WhatsApp connection initiated'
      });
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        tenantId: req.tenant?.id
      };

      const result = await whatsAppService.disconnect(context);
      res.status(200).json({
        success: true,
        data: result,
        message: 'WhatsApp disconnected successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async reconnect(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        tenantId: req.tenant?.id
      };

      const result = await whatsAppService.reconnect(context);
      res.status(200).json({
        success: true,
        data: result,
        message: 'WhatsApp reconnection initiated'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessageLogs(req, res, next) {
    try {
      const logs = await whatsAppService.getMessageLogs({ ...req.query, tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: logs.data,
        pagination: logs.pagination,
        message: 'Message logs retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WhatsAppController();
