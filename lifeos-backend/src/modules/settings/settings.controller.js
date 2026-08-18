const settingsService = require('./settings.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user._id);
  res.status(200).json(new ApiResponse(200, { settings }, 'User settings fetched successfully'));
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { settings }, 'User settings updated successfully'));
});

const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await settingsService.getPreferences(req.user._id);
  res.status(200).json(new ApiResponse(200, { preferences }, 'User preferences fetched successfully'));
});

const updatePreferences = asyncHandler(async (req, res) => {
  const settings = await settingsService.updatePreferences(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { settings }, 'User preferences updated successfully'));
});

const getAppearance = asyncHandler(async (req, res) => {
  const appearance = await settingsService.getAppearance(req.user._id);
  res.status(200).json(new ApiResponse(200, { appearance }, 'Appearance settings fetched successfully'));
});

const updateAppearance = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateAppearance(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { settings }, 'Appearance settings updated successfully'));
});

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await settingsService.getNotifications(req.user._id);
  res.status(200).json(new ApiResponse(200, { notifications }, 'Notification settings fetched successfully'));
});

const updateNotifications = asyncHandler(async (req, res) => {
  const notifications = await settingsService.updateNotifications(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { notifications }, 'Notification settings updated successfully'));
});

const exportUserData = asyncHandler(async (req, res) => {
  const exportData = await settingsService.exportUserData(req.user._id);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=lifeos-export-${req.user._id}.json`);
  res.status(200).json(new ApiResponse(200, { exportData }, 'User data exported successfully'));
});

const deleteAccount = asyncHandler(async (req, res) => {
  await settingsService.deleteAccount(req.user._id);
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json(new ApiResponse(200, null, 'Account and associated data deleted successfully'));
});

module.exports = {
  getSettings,
  updateSettings,
  getPreferences,
  updatePreferences,
  getAppearance,
  updateAppearance,
  getNotifications,
  updateNotifications,
  exportUserData,
  deleteAccount,
};
