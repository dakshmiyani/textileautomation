const { knex } = require('../../database/knex');

class MachinesRepository {
  async findAll(tenantId) {
    if (!tenantId) throw new Error('Missing tenantId');
    return knex('machines').where('tenant_id', tenantId).select('*').orderBy('code', 'asc');
  }

  async findById(id, tenantId) {
    if (!tenantId) throw new Error('Missing tenantId');
    return knex('machines').where({ id, tenant_id: tenantId }).first();
  }
}

module.exports = new MachinesRepository();
