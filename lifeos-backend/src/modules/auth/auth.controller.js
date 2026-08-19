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
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json(new ApiResponse(200, {
    user: result.user,
    accessToken: result.accessToken,
  }, 'Login successful! 🎉'));
});

const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await authService.logout(req.user._id);
  }

  res.cookie('jwt', '', {
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    secure: env.NODE_ENV === 'production',
  });

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.jwt || req.body?.refreshToken;

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

  const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('jwt', newRefreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, 'Token refreshed successfully'));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOtp(email, otp);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  const result = await authService.resetPassword(email, otp, password);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    throw new ApiError(401, 'Your current password is wrong');
  }

  user.password = req.body.newPassword;
  await user.save();

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

const testEmail = asyncHandler(async (req, res) => {
  const recipient = req.body.email || env.SMTP_USER;
  if (!recipient) {
    throw new ApiError(400, 'Please provide an email address in request body.');
  }

  const sendEmail = require('../../utils/sendEmail');
  await sendEmail({
    email: recipient,
    subject: 'LifeOS Email Delivery Test',
    message: 'LifeOS email delivery is working correctly.',
    html: `
      <div style="font-family: sans-serif; padding: 30px; background: #f4f6f8;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <h2 style="color: #0F8B8D; margin-top: 0;">LifeOS Email Delivery Test</h2>
          <p style="color: #374151; font-size: 16px;">LifeOS email delivery is working correctly.</p>
          <p style="color: #6b7280; font-size: 14px;">Dispatched at: ${new Date().toISOString()}</p>
        </div>
      </div>
    `,
  });

  res.status(200).json(new ApiResponse(200, { recipient }, `Test email sent successfully to ${recipient}`));
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getMe,
  testEmail,
};
