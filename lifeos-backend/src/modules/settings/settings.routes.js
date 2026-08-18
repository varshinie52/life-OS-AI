const express = require('express');
const settingsController = require('./settings.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All settings routes require authentication
router.use(protect);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);
router.put('/', settingsController.updateSettings);

router.get('/preferences', settingsController.getPreferences);
router.patch('/preferences', settingsController.updatePreferences);

router.get('/appearance', settingsController.getAppearance);
router.patch('/appearance', settingsController.updateAppearance);

router.get('/notifications', settingsController.getNotifications);
router.patch('/notifications', settingsController.updateNotifications);

router.post('/export', settingsController.exportUserData);
router.delete('/account', settingsController.deleteAccount);

module.exports = router;
