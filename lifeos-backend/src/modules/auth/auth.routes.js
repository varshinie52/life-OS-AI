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
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
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

router.post(
  '/test-email',
  [check('email', 'Please include a valid email').isEmail()],
  validate,
  authController.testEmail
);

router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  validate,
  authController.forgotPassword
);

router.post(
  '/verify-otp',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
  ],
  validate,
  authController.verifyOtp
);

router.post(
  '/reset-password',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('otp', 'OTP must be 6 digits').isLength({ min: 6, max: 6 }),
    check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  ],
  validate,
  authController.resetPassword
);

// Protected routes
router.use(protect);

router.put(
  '/change-password',
  [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Password must be at least 8 characters').isLength({ min: 8 }),
  ],
  validate,
  authController.changePassword
);

router.get('/me', authController.getMe);

module.exports = router;
