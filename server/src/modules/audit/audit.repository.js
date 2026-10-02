const { knex } = require('../../database/knex');

class AuditRepository {
  _enforceTenant(tenantId) {
    if (!tenantId) throw new Error('TenantContextError: Missing tenantId');
  }

  /**
   * Insert an audit log entry
   */
  async create(data) {
    const [log] = await knex('audit_logs')
      .insert({
        tenant_id: data.tenant_id || null,
        user_id: data.user_id || null,
        action: data.action,
        module: data.module,
        entity: data.entity,
        entity_id: data.entity_id ? String(data.entity_id) : null,
        old_value: data.old_value ? JSON.stringify(data.old_value) : null,
        new_value: data.new_value ? JSON.stringify(data.new_value) : null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
        created_at: new Date()
      })
      .returning('*');
    return log;
  }

  /**
   * Get paginated audit logs with optional filters
   */
  async findPaginated({ tenantId, page = 1, limit = 20, module, action, userId, from, to } = {}) {
    this._enforceTenant(tenantId);
    const offset = (page - 1) * limit;
    let query = knex('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select(
        'audit_logs.*',
        'users.name as user_name',
        'users.email as user_email'
      )
      .where('audit_logs.tenant_id', tenantId);

    if (module) {
      query = query.where('audit_logs.module', module);
    }
    if (action) {
      query = query.where('audit_logs.action', action);
    }
    if (userId) {
      query = query.where('audit_logs.user_id', userId);
    }
    if (from) {
      query = query.where('audit_logs.created_at', '>=', new Date(from));
    }
    if (to) {
      query = query.where('audit_logs.created_at', '<=', new Date(to));
    }

    const countQuery = knex('audit_logs').where('tenant_id', tenantId);
    if (module) countQuery.where('module', module);
    if (action) countQuery.where('action', action);
    if (userId) countQuery.where('user_id', userId);
    if (from) countQuery.where('created_at', '>=', new Date(from));
    if (to) countQuery.where('created_at', '<=', new Date(to));

    const [{ count }] = await countQuery.count('id as count');
    const total = parseInt(count, 10) || 0;

    const rows = await query
      .orderBy('audit_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Parse JSON values if needed
    const parsedRows = rows.map((row) => ({
      ...row,
      old_value: row.old_value ? safeJsonParse(row.old_value) : null,
      new_value: row.new_value ? safeJsonParse(row.new_value) : null
    }));

    return {
      data: parsedRows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }
}

function safeJsonParse(str) {
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

module.exports = new AuditRepository();
