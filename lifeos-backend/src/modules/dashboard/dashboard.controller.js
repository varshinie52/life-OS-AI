const dashboardService = require('./dashboard.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getDashboard = asyncHandler(async (req, res) => {
  const snapshot = await dashboardService.getDashboardSnapshot(req.user._id);
  res.status(200).json(new ApiResponse(200, snapshot, 'Dashboard snapshot fetched'));
});

module.exports = {
  getDashboard,
};
