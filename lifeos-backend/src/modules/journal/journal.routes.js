const express = require('express');
const { check } = require('express-validator');
const journalController = require('./journal.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All journal routes require authentication
router.use(protect);

router.post(
  '/',
  [
    check('content', 'Content is required').optional().not().isEmpty(),
    check('mood').optional().isIn(['great', 'good', 'okay', 'bad', 'awful']),
  ],
  validate,
  journalController.createEntry
);

// Specific routes MUST be defined before parametric /:id route
router.get('/', journalController.getEntries);
router.get('/today', journalController.getTodayEntry);
router.get('/calendar', journalController.getCalendarData);
router.get('/moods', journalController.getMoodsAnalytics);
router.get('/stats', journalController.getStats);
router.get('/mood/history', journalController.getCalendarData);

router.get('/:id', journalController.getEntryById);

router.patch(
  '/:id',
  [
    check('mood').optional().isIn(['great', 'good', 'okay', 'bad', 'awful']),
  ],
  validate,
  journalController.updateEntry
);

router.put(
  '/:id',
  [
    check('mood').optional().isIn(['great', 'good', 'okay', 'bad', 'awful']),
  ],
  validate,
  journalController.updateEntry
);

router.delete('/:id', journalController.deleteEntry);

module.exports = router;
