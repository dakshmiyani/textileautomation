const { knex } = require('../../database/knex');

class SaasRepository {
  async findAllTenants() {
    return knex('tenants').orderBy('created_at', 'desc');
  }

  async findTenantById(id) {
    return knex('tenants').where('id', id).first();
  }

  async createTenant(data) {
    const [tenant] = await knex('tenants')
      .insert({
        name: data.name,
        slug: data.slug,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return tenant;
  }

  async updateTenant(id, data) {
    const [tenant] = await knex('tenants')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');
    return tenant;
  }
}

module.exports = new SaasRepository();
