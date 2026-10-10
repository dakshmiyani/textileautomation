const { knex } = require('../database/knex');
const { AuthorizationError } = require('./errorMiddleware');

/**
 * Ensures the authenticated user has access to the requested tenant.
 * Expects req.user to be populated by auth.middleware.js
 */
async function tenantContext(req, res, next) {
  try {
    if (!req.user) {
      return next(new AuthorizationError('User must be authenticated before resolving tenant context'));
    }

    // Tenant ID is supplied via header by the frontend
    const tenantIdStr = req.headers['x-tenant-id'];
    
    // If missing, and user belongs to exactly one active tenant, we could auto-select,
    // but strict REST says we require the header.
    // For safety and compatibility with the migration step, we'll try to fallback 
    // to their primary tenant if they didn't send a header.
    
    let targetTenantId = tenantIdStr ? parseInt(tenantIdStr, 10) : null;

    if (!targetTenantId) {
      // Auto-fallback: Find their first active tenant
      const fallbackMembership = await knex('tenant_users')
        .where({ user_id: req.user.id, status: 'ACTIVE' })
        .first();

      if (!fallbackMembership) {
        return next(new AuthorizationError('User does not belong to any active tenant'));
      }
      targetTenantId = fallbackMembership.tenant_id;
    }

    // Verify membership
    const membership = await knex('tenant_users')
      .join('tenants', 'tenant_users.tenant_id', 'tenants.id')
      .join('roles', 'tenant_users.role_id', 'roles.id')
      .where({
        'tenant_users.user_id': req.user.id,
        'tenant_users.tenant_id': targetTenantId,
        'tenant_users.status': 'ACTIVE',
        'tenants.status': 'ACTIVE'
      })
      .select(
        'tenants.id as tenant_id',
        'tenants.name as tenant_name',
        'tenants.slug as tenant_slug',
        'tenants.status as tenant_status',
        'roles.name as role_name',
        'tenant_users.role_id'
      )
      .first();

    if (!membership) {
      return next(new AuthorizationError('Access denied to the specified tenant or tenant is suspended'));
    }

    // Fetch tenant-specific permissions
    const permissions = await knex('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', membership.role_id)
      .select('permissions.name');

    req.tenant = {
      id: membership.tenant_id,
      name: membership.tenant_name,
      slug: membership.tenant_slug,
      status: membership.tenant_status
    };

    req.tenantMembership = {
      role: membership.role_name,
      permissions: permissions.map(p => p.name)
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  tenantContext
};
