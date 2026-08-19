const express = require('express');
const { check } = require('express-validator');
const aiController = require('./ai.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// ─── Chat ─────────────────────────────────────
router.post(
  '/chat',
  [check('message', 'Message is required').not().isEmpty()],
  validate,
  aiController.chatWithAI
);

// ─── Action Execution (create/update/delete) ──
router.post('/action', aiController.executeAction);

// ─── Insights & Reviews ───────────────────────
router.all('/insights', aiController.getAIInsights);
router.all('/daily-brief', aiController.getDailyBriefing);
router.all('/daily-plan', aiController.getDailyBriefing);
router.all('/weekly-review', aiController.getWeeklyReview);

// ─── Legacy / Content Analysis ────────────────
router.post('/analyze', aiController.analyzeContent);
router.post('/analyze-journal', aiController.analyzeContent);
router.post('/summarize', aiController.summarizeContent);
router.post('/suggest', aiController.suggestPriorities);

router.post(
  '/goals',
  [check('goalTitle', 'Goal title is required').not().isEmpty()],
  validate,
  aiController.generateGoalBreakdown
);

module.exports = router;
