const express = require('express');
const { check } = require('express-validator');
const journalController = require('./journal.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    check('content', 'Content is required').not().isEmpty(),
    check('mood').optional().isIn(['great', 'good', 'okay', 'bad', 'awful']),
  ],
  validate,
  journalController.createEntry
);

router.get('/mood/history', journalController.getMoodHistory);

router.get('/', journalController.getEntries);
router.get('/:id', journalController.getEntryById);

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
