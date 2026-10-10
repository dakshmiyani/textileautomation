const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const authRepository = require('./authRepository');
const auditService = require('../audit/auditService');
const { AuthenticationError, ValidationError, NotFoundError } = require('../../middleware/errorMiddleware');

class AuthService {
  /**
   * Authenticate user with email and password
   */
  async login({ email, password, ip, userAgent }) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account has been deactivated. Please contact administrator.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await authRepository.update(user.id, { last_login_at: new Date() });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Audit log
    await auditService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'AUTH',
      entity: 'USER',
      entityId: user.id,
      newValue: { email: user.email, role: user.role_name },
      ip,
      userAgent
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        tenants: user.tenants
      },
      tokens
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      const user = await authRepository.findById(decoded.id);

      if (!user || !user.is_active) {
        throw new AuthenticationError('Invalid refresh token or inactive account');
      }

      const tokens = this.generateTokens(user);
      return { tokens };
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      tenants: user.tenants,
      lastLoginAt: user.last_login_at
    };
  }

  /**
   * Update profile / change password
   */
  async updateProfile(userId, { name, currentPassword, newPassword, ip, userAgent }) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updates = {};
    if (name) updates.name = name;

    if (newPassword) {
      if (!currentPassword) {
        throw new ValidationError('Current password is required to set a new password');
      }

      // Re-fetch full user with password_hash
      const fullUser = await authRepository.findByEmail(user.email);
      const isMatch = await bcrypt.compare(currentPassword, fullUser.password_hash);
      if (!isMatch) {
        throw new ValidationError('Current password does not match');
      }

      updates.password_hash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length > 0) {
      await authRepository.update(userId, updates);

      await auditService.log({
        userId,
        action: 'UPDATE_PROFILE',
        module: 'AUTH',
        entity: 'USER',
        entityId: userId,
        newValue: { name: updates.name, passwordChanged: !!updates.password_hash },
        ip,
        userAgent
      });
    }

    return this.getProfile(userId);
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      tenants: user.tenants
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign({ id: user.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN
    };
  }
}

module.exports = new AuthService();
