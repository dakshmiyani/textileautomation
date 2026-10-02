const { AuthorizationError } = require('./error.middleware');

function saasOwnerContext(req, res, next) {
  try {
    if (!req.user) {
      return next(new AuthorizationError('User must be authenticated'));
    }

    // Check if user belongs to the default tenant (id = 1) with SUPER_ADMIN role
    const isSaasOwner = req.user.tenants?.some(t => t.id === 1 && t.role_name === 'SUPER_ADMIN');

    if (!isSaasOwner) {
      return next(new AuthorizationError('Access denied. Only SaaS Owners can perform this action.'));
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { saasOwnerContext };
