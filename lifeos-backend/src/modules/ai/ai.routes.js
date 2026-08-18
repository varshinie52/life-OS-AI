const express = require('express');
const { check } = require('express-validator');
const aiController = require('./ai.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');
const { aiLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(aiLimiter); // Apply stricter rate limit for AI routes

router.get('/daily-plan', aiController.generateDailyPlan);

router.post(
  '/analyze-journal',
  [check('content', 'Journal content is required').not().isEmpty()],
  validate,
  aiController.analyzeJournal
);

module.exports = router;
