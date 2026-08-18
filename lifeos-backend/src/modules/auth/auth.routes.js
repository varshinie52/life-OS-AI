const express = require('express');
const { check } = require('express-validator');
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

// Apply strict rate limiting to auth routes
router.use(authLimiter);

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  validate,
  authController.login
);

router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);

router.get('/verify-email/:token', authController.verifyEmail);

router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  [check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })],
  validate,
  authController.resetPassword
);

// Protected routes
router.use(protect);

router.put(
  '/change-password',
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 }),
  ],
  validate,
  authController.changePassword
);

router.get('/me', authController.getMe);

module.exports = router;
