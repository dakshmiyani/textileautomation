const { knex } = require('../../database/knex');

class UsersRepository {
  async findAll(tenantId) {
    if (!tenantId) throw new Error('Missing tenantId');
    return knex('tenant_users')
      .join('users', 'tenant_users.user_id', 'users.id')
      .join('roles', 'tenant_users.role_id', 'roles.id')
      .where('tenant_users.tenant_id', tenantId)
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.phone',
        'tenant_users.status as is_active',
        'users.last_login_at',
        'tenant_users.created_at',
        'roles.name as role_name'
      )
      .orderBy('tenant_users.created_at', 'desc');
  }
}

module.exports = new UsersRepository();
