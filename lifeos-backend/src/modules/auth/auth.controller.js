const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, null, result.message));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  // Set refresh token in HTTP-only cookie
  res.cookie('jwt', result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json(new ApiResponse(200, {
    user: result.user,
    accessToken: result.accessToken,
  }, 'Login successful'));
});

const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB if user is authenticated
  if (req.user) {
    await authService.logout(req.user._id);
  }

  // Clear cookie
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

const refreshToken = asyncHandler(async (req, res) => {
  // Can get refresh token from body or cookie
  const token = req.cookies?.jwt || req.body.refreshToken;

  if (!token) {
    throw new ApiError(401, 'Not authenticated. No refresh token provided.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(403, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  
  if (!user || user.refreshToken !== token) {
    throw new ApiError(403, 'Refresh token has expired or is invalid. Please login again.');
  }

  // Generate new tokens
  const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('jwt', newRefreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed successfully'));
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.status(200).json(new ApiResponse(200, null, 'Email verified successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  res.status(200).json(new ApiResponse(200, null, 'Password reset token sent to email!'));
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  res.status(200).json(new ApiResponse(200, null, 'Password reset successful! Please login with your new password.'));
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    throw new ApiError(401, 'Your current password is wrong');
  }

  user.password = req.body.newPassword;
  await user.save(); // pre save hook hashes the new password

  // Generate new tokens to keep user logged in
  const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('jwt', newRefreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, 'Password changed successfully'));
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user }, 'Current user data fetched'));
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
};
