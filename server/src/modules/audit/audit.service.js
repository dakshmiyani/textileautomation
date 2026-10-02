const auditRepository = require('./audit.repository');
const logger = require('../../config/logger');

class AuditService {
  /**
   * Log an action in the system
   */
  async log({ userId, tenantId, action, module, entity, entityId, oldValue, newValue, ip, userAgent }) {
    try {
      return await auditRepository.create({
        tenant_id: tenantId,
        user_id: userId,
        action,
        module,
        entity,
        entity_id: entityId,
        old_value: oldValue,
        new_value: newValue,
        ip_address: ip,
        user_agent: userAgent
      });
    } catch (error) {
      // Audit failure should not crash the primary business operation, but should be logged
      logger.error({ error: error.message, stack: error.stack, action, module }, 'Failed to record audit log');
      return null;
    }
  }

  /**
   * Retrieve audit logs
   */
  async getAuditLogs(params, tenantId) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId in audit service');
    return auditRepository.findPaginated({ ...params, tenantId });
  }
}

module.exports = new AuditService();
