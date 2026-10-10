const saasService = require('./saasService');

class SaasController {
  async listTenants(req, res, next) {
    try {
      const tenants = await saasService.listTenants();
      res.status(200).json({
        success: true,
        data: tenants,
        message: 'Tenants retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async createTenant(req, res, next) {
    try {
      const tenant = await saasService.createTenant(req.body);
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'Tenant created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SaasController();
