const analyticsService = require('./analytics.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview(req.user._id);
  res.status(200).json(new ApiResponse(200, { overview: data }, 'Analytics overview fetched successfully'));
});

const getHabitsAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHabitsAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, { habits: data }, 'Habits analytics fetched successfully'));
});

const getTasksAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getTasksAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, { tasks: data }, 'Tasks analytics fetched successfully'));
});

const getJournalAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getJournalAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, { journal: data }, 'Journal analytics fetched successfully'));
});

const getProductivityAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getProductivityAnalytics(req.user._id, req.query.timeframe);
  res.status(200).json(new ApiResponse(200, { productivity: data }, 'Productivity analytics fetched successfully'));
});

const getStreaksAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getStreaksAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, { streaks: data }, 'Streaks analytics fetched successfully'));
});

const getHeatmapAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getHeatmapAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, data, 'Heatmap analytics fetched successfully'));
});

module.exports = {
  getOverview,
  getProductivityScore: getOverview,
  getHabitsAnalytics,
  getTasksAnalytics,
  getJournalAnalytics,
  getProductivityAnalytics,
  getStreaksAnalytics,
  getHeatmapAnalytics,
};
