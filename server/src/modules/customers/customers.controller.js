const customersRepository = require('./customers.repository');
const logger = require('../../config/logger');

class CustomersController {
  async getCustomers(req, res, next) {
    try {
      const customers = await customersRepository.getAll(req.tenant?.id, 500); // Fetch up to 500 customers
      
      res.status(200).json({
        success: true,
        data: customers,
        message: 'Customers retrieved successfully'
      });
    } catch (error) {
      logger.error({ error: error.message, stack: error.stack }, 'Failed to fetch customers');
      next(error);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const data = { ...req.body, tenant_id: req.tenant?.id };
      const created = await customersRepository.createCustomer(data);
      
      res.status(201).json({
        success: true,
        data: created,
        message: 'Customer created successfully'
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to create customer');
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await customersRepository.updateCustomer(id, data, req.tenant?.id);
      
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to update customer');
      next(error);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await customersRepository.deleteCustomer(id, req.tenant?.id);
      
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      res.status(200).json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to delete customer');
      next(error);
    }
  }
}

module.exports = new CustomersController();
