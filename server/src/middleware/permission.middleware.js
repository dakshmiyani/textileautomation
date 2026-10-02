const { AuthorizationError } = require('./error.middleware');

/**
 * Checks if authenticated user has the required permission
 * SUPER_ADMIN has unconditional access
 * 
 * @param {string} requiredPermission e.g. 'production.read', 'production.create'
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    if (req.tenantMembership?.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.tenantMembership?.permissions || !req.tenantMembership.permissions.includes(requiredPermission)) {
      return next(new AuthorizationError(`Forbidden: Missing required permission "${requiredPermission}"`));
    }

    next();
  };
}

/**
 * Checks if user belongs to one of allowed roles
 * 
 * @param {string[]} allowedRoles 
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthorizationError('User not authenticated'));
    }

    if (req.tenantMembership?.role === 'SUPER_ADMIN' || allowedRoles.includes(req.tenantMembership?.role)) {
      return next();
    }

    next(new AuthorizationError(`Forbidden: Role "${req.tenantMembership?.role}" is not authorized`));
  };
}

module.exports = {
  requirePermission,
  requireRole
};
