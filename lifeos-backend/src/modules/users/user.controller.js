const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile fetched successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Profile updated successfully'));
});

const updatePreferences = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { user }, 'Preferences updated successfully'));
});

const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image file');
  }

  const user = await userService.uploadAvatar(req.user._id, req.file.buffer);
  res.status(200).json(new ApiResponse(200, { user }, 'Avatar uploaded successfully'));
});

const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await userService.deleteAvatar(req.user._id);
  res.status(200).json(new ApiResponse(200, { user }, 'Avatar deleted successfully'));
});

const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id);

  // Clear cookie
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json(new ApiResponse(200, null, 'Account and all data deleted successfully'));
});

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  uploadAvatar,
  deleteAvatar,
  deleteAccount,
};
