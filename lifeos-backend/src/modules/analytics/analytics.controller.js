const analyticsService = require('./analytics.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getProductivityScore = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProductivityScore(req.user._id);
  res.status(200).json(new ApiResponse(200, data, 'Productivity score fetched'));
});

const getTasksAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTasksAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, data, 'Tasks analytics fetched'));
});

const getHabitsAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHabitsAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, data, 'Habits analytics fetched'));
});

const getWeeklyReport = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTimeReport(req.user._id, 'week');
  res.status(200).json(new ApiResponse(200, data, 'Weekly report fetched'));
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTimeReport(req.user._id, 'month');
  res.status(200).json(new ApiResponse(200, data, 'Monthly report fetched'));
});

const getYearlyReport = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTimeReport(req.user._id, 'year');
  res.status(200).json(new ApiResponse(200, data, 'Yearly report fetched'));
});

module.exports = {
  getProductivityScore,
  getTasksAnalytics,
  getHabitsAnalytics,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
};
