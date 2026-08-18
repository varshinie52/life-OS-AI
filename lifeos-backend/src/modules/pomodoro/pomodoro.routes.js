const express = require('express');
const { check } = require('express-validator');
const pomodoroController = require('./pomodoro.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/sessions',
  [
    check('startTime', 'Valid start time is required').isISO8601(),
    check('endTime', 'Valid end time is required').isISO8601(),
    check('duration', 'Duration in minutes is required').isNumeric(),
    check('type', 'Type must be focus, short_break, or long_break').isIn(['focus', 'short_break', 'long_break']),
  ],
  validate,
  pomodoroController.saveSession
);

router.get('/sessions', pomodoroController.getSessions);

router.get('/stats/daily', pomodoroController.getDailyStats);
router.get('/stats/weekly', pomodoroController.getWeeklyStats);

module.exports = router;
