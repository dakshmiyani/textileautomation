const express = require('express');
const authController = require('./authController');
const { validate } = require('../../middleware/validationMiddleware');
const { authenticate } = require('../../middleware/authMiddleware');
const { authLimiter } = require('../../middleware/rateLimitMiddleware');
const { loginSchema, refreshTokenSchema, updateProfileSchema } = require('./authValidation');

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
