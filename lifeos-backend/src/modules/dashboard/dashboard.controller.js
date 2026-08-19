const dashboardService = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getDashboard = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user._id);
  res.status(200).json(new ApiResponse(200, summary, 'Dashboard summary fetched successfully'));
});

module.exports = {
  getDashboard,
};
