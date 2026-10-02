const machinesRepository = require('./machines.repository');

class MachinesController {
  async list(req, res, next) {
    try {
      const machines = await machinesRepository.findAll(req.tenant?.id);
      res.status(200).json({
        success: true,
        data: machines,
        message: 'Machines retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MachinesController();
