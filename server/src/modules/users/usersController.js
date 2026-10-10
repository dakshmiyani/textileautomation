const usersRepository = require('./usersRepository');

class UsersController {
  async list(req, res, next) {
    try {
      const users = await usersRepository.findAll(req.tenant?.id);
      res.status(200).json({
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();
