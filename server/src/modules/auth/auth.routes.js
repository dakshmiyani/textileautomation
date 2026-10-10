const express = require('express');
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimit.middleware');
const { loginSchema, refreshTokenSchema, updateProfileSchema } = require('./auth.validation');

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
