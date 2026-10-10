const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AuthenticationError, AuthorizationError } = require('./errorMiddleware');
const { db } = require('../database/knex');

/**
 * Verifies JWT access token and attaches req.user with role & permissions
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AuthenticationError('Authentication token is missing or malformed'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AuthenticationError('Token has expired. Please log in again or refresh token.'));
      }
      return next(new AuthenticationError('Invalid authentication token'));
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return next(new AuthenticationError('Invalid authentication token payload'));
    }

    // Fetch user from database
    const user = await db('users')
      .where({ id: userId, is_active: true })
      .first();

    if (!user) {
      return next(new AuthenticationError('User account not found or has been deactivated'));
    }

    // Fetch user tenants
    const tenants = await db('tenant_users')
      .join('tenants', 'tenant_users.tenant_id', 'tenants.id')
      .join('roles', 'tenant_users.role_id', 'roles.id')
      .where('tenant_users.user_id', user.id)
      .where('tenant_users.status', 'ACTIVE')
      .select('tenants.id', 'tenants.name', 'tenants.slug', 'roles.name as role_name');

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      tenants: tenants
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authenticate
};
