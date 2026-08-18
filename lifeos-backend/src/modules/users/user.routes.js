const express = require('express');
const { check } = require('express-validator');
const userController = require('./user.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');
const upload = require('../../middleware/upload.middleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

router.get('/profile', userController.getProfile);

router.put(
  '/profile',
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('username', 'Username is required').optional().not().isEmpty(),
  ],
  validate,
  userController.updateProfile
);

router.put('/preferences', userController.updatePreferences);

// Upload Avatar (single file named 'avatar')
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

router.delete('/avatar', userController.deleteAvatar);

router.delete('/account', userController.deleteAccount);

module.exports = router;
