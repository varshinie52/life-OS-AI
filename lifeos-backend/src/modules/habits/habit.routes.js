const express = require('express');
const { check } = require('express-validator');
const habitController = require('./habit.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('frequency').optional().isIn(['daily', 'weekly', 'custom']),
  ],
  validate,
  habitController.createHabit
);

router.get('/', habitController.getHabits);
router.get('/:id', habitController.getHabitById);

router.put(
  '/:id',
  [
    check('frequency').optional().isIn(['daily', 'weekly', 'custom']),
  ],
  validate,
  habitController.updateHabit
);

router.delete('/:id', habitController.deleteHabit);

router.post(
  '/:id/checkin',
  [
    check('date').optional().isISO8601(),
    check('completed').optional().isBoolean(),
  ],
  validate,
  habitController.checkIn
);

router.get('/:id/logs', habitController.getHabitLogs);
router.get('/:id/stats', habitController.getHabitStats);

module.exports = router;
