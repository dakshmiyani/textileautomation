const authService = require('./auth.service');
const auditService = require('../audit/audit.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await authService.login({ email, password, ip, userAgent });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const result = await authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, currentPassword, newPassword } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      const result = await authService.updateProfile(req.user.id, {
        name,
        currentPassword,
        newPassword,
        ip,
        userAgent
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      if (req.user) {
        await auditService.log({
          userId: req.user.id,
          action: 'LOGOUT',
          module: 'AUTH',
          entity: 'USER',
          entityId: req.user.id,
          ip: req.ip,
          userAgent: req.get('user-agent')
        });
      }

      res.status(200).json({
        success: true,
        data: null,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
