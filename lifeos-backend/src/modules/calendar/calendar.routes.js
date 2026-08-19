const express = require('express');
const { check } = require('express-validator');
const calendarController = require('./calendar.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All calendar routes require authentication
router.use(protect);

router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('startTime', 'Valid start time is required').isISO8601(),
    check('endTime', 'Valid end time is required').isISO8601(),
  ],
  validate,
  calendarController.createEvent
);

router.get('/', calendarController.getEvents);
router.get('/events', calendarController.getEvents);
router.get('/month', calendarController.getMonthView);
router.get('/day', calendarController.getDayAgenda);
router.get('/agenda', calendarController.getAgenda);

router.get('/:id', calendarController.getEventById);

router.patch(
  '/:id',
  [
    check('startTime').optional().isISO8601(),
    check('endTime').optional().isISO8601(),
  ],
  validate,
  calendarController.updateEvent
);

router.put(
  '/:id',
  [
    check('startTime').optional().isISO8601(),
    check('endTime').optional().isISO8601(),
  ],
  validate,
  calendarController.updateEvent
);

router.delete('/:id', calendarController.deleteEvent);

module.exports = router;
