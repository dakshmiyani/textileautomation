const auditService = require('./auditService');

class AuditController {
  async getLogs(req, res, next) {
    try {
      const result = await auditService.getAuditLogs(req.query, req.tenant?.id);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Audit logs retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
