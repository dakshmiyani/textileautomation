const productionService = require('./production.service');

class ProductionController {
  async listRecords(req, res, next) {
    try {
      const result = await productionService.listRecords(req.query, { tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: 'Production records retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await productionService.getRecordById(req.params.id, { tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: record,
        message: 'Production record retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async createRecord(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        companyId: req.user?.companyId,
        factoryId: req.user?.factoryId,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const record = await productionService.createRecord(req.body, context);

      res.status(201).json({
        success: true,
        data: record,
        message: 'Production record created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const updated = await productionService.updateRecord(req.params.id, req.body, context);

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Production record updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const result = await productionService.deleteRecord(req.params.id, context);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Production record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getKPIs(req, res, next) {
    try {
      const kpis = await productionService.getKPIs({ tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: kpis,
        message: 'Production KPIs retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days, 10) : 14;
      const analytics = await productionService.getAnalytics({ days }, { tenantId: req.tenant?.id });
      res.status(200).json({
        success: true,
        data: analytics,
        message: 'Production analytics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async exportExcel(req, res, next) {
    try {
      const context = {
        userId: req.user?.id,
        tenantId: req.tenant?.id,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };

      const buffer = await productionService.exportExcel(req.query, context);
      const filename = `yarn_production_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductionController();
