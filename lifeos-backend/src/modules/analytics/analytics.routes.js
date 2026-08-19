const express = require('express');
const analyticsController = require('./analytics.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

router.get('/overview', analyticsController.getOverview);
router.get('/productivity-score', analyticsController.getOverview);
router.get('/habits', analyticsController.getHabitsAnalytics);
router.get('/tasks', analyticsController.getTasksAnalytics);
router.get('/journal', analyticsController.getJournalAnalytics);
router.get('/productivity', analyticsController.getProductivityAnalytics);
router.get('/streaks', analyticsController.getStreaksAnalytics);
router.get('/heatmap', analyticsController.getHeatmapAnalytics);

module.exports = router;
