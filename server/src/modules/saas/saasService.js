const bcrypt = require('bcryptjs');
const saasRepository = require('./saasRepository');
const { knex } = require('../../database/knex');
const { ValidationError } = require('../../middleware/errorMiddleware');

class SaasService {
  async listTenants() {
    return saasRepository.findAllTenants();
  }

  async getTenant(id) {
    return saasRepository.findTenantById(id);
  }

  async createTenant(data) {
    // Basic validation
    if (!data.name || !data.slug || !data.adminEmail || !data.adminPassword) {
      throw new ValidationError('Tenant name, slug, adminEmail, and adminPassword are required');
    }

    // Check if slug exists
    const existingTenant = await knex('tenants').where('slug', data.slug).first();
    if (existingTenant) {
      throw new ValidationError('Tenant slug already exists');
    }

    return await knex.transaction(async (trx) => {
      // 1. Create Tenant
      const [tenant] = await trx('tenants')
        .insert({
          name: data.name,
          slug: data.slug,
          email: data.adminEmail,
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*');

      // 2. Find or Create Admin User
      let user = await trx('users').where('email', data.adminEmail.toLowerCase().trim()).first();
      
      if (!user) {
        const password_hash = await bcrypt.hash(data.adminPassword, 10);
        const [newUser] = await trx('users')
          .insert({
            email: data.adminEmail.toLowerCase().trim(),
            password_hash,
            name: data.adminName || 'Admin',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('*');
        user = newUser;
      }

      // 3. Get ADMIN role id for the client
      const role = await trx('roles').where('name', 'ADMIN').first();
      if (!role) {
        throw new Error('ADMIN role not found in the database');
      }

      // 4. Create membership
      await trx('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          role_id: role.id,
          status: 'ACTIVE',
          created_at: new Date(),
          updated_at: new Date()
        });

      return tenant;
    });
  }
}

module.exports = new SaasService();
