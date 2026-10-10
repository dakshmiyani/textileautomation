const { knex } = require('../../database/knex');

class AuthRepository {
  /**
   * Find a user by email, including their role details
   */
  async findByEmail(email) {
    const user = await knex('users')
      .where('users.email', email.toLowerCase().trim())
      .first();

    if (!user) return null;

    const tenants = await knex('tenant_users')
      .join('tenants', 'tenant_users.tenant_id', 'tenants.id')
      .join('roles', 'tenant_users.role_id', 'roles.id')
      .where('tenant_users.user_id', user.id)
      .where('tenant_users.status', 'ACTIVE')
      .where('tenants.status', 'ACTIVE')
      .select(
        'tenants.id',
        'tenants.name',
        'tenants.slug',
        'roles.name as role_name',
        'tenant_users.role_id'
      );

    for (const t of tenants) {
      t.permissions = await knex('permissions')
        .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
        .where('role_permissions.role_id', t.role_id)
        .pluck('permissions.name');
    }

    user.tenants = tenants;
    return user;
  }

  /**
   * Find a user by ID, including their role and permissions
   */
  async findById(id) {
    const user = await knex('users')
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.phone',
        'users.is_active',
        'users.last_login_at',
        'users.created_at',
        'users.updated_at'
      )
      .where('users.id', id)
      .first();

    if (!user) return null;

    const tenants = await knex('tenant_users')
      .join('tenants', 'tenant_users.tenant_id', 'tenants.id')
      .join('roles', 'tenant_users.role_id', 'roles.id')
      .where('tenant_users.user_id', user.id)
      .where('tenant_users.status', 'ACTIVE')
      .where('tenants.status', 'ACTIVE')
      .select(
        'tenants.id',
        'tenants.name',
        'tenants.slug',
        'roles.name as role_name',
        'tenant_users.role_id'
      );

    for (const t of tenants) {
      t.permissions = await knex('permissions')
        .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
        .where('role_permissions.role_id', t.role_id)
        .pluck('permissions.name');
    }

    user.tenants = tenants;
    return user;
  }

  /**
   * Update user details (e.g., last login, password)
   */
  async update(id, updateData) {
    const [updated] = await knex('users')
      .where('id', id)
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning(['id', 'name', 'email', 'updated_at']);

    return updated;
  }
}

module.exports = new AuthRepository();
