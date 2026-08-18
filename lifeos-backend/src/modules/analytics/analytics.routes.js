const express = require('express');
const analyticsController = require('./analytics.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/productivity-score', analyticsController.getProductivityScore);
router.get('/tasks', analyticsController.getTasksAnalytics);
router.get('/habits', analyticsController.getHabitsAnalytics);

router.get('/weekly', analyticsController.getWeeklyReport);
router.get('/monthly', analyticsController.getMonthlyReport);
router.get('/yearly', analyticsController.getYearlyReport);

// Note: Mood and expenses analytics are partially handled by their respective modules, 
// but could also be aggregated here.

module.exports = router;
