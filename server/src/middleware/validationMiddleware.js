const { ValidationError } = require('./errorMiddleware');

/**
 * Validates request body, query, and params against Zod schemas
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(new ValidationError('Validation failed for input data', formattedErrors));
      }
      next(err);
    }
  };
}

module.exports = {
  validate
};
