const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const sendEmail = require('../../utils/sendEmail');
const { env } = require('../../config/env');

const register = async (userData) => {
  const { name, email, password, username } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'This email is already registered. Please use another email or log in.');
  }

  const createData = { name, email, password, isEmailVerified: true };
  if (username) {
    createData.username = username;
  }

  const user = await User.create(createData);

  const message = 'Your LifeOS account has been created successfully. Welcome to LifeOS!';
  const html = `
    <div style="font-family: sans-serif; background-color: #f6f2ea; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0F8B8D, #0a6e70); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">LifeOS</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
          <p style="color: #555; line-height: 1.6; font-size: 16px;">Your LifeOS account has been created successfully. Welcome to LifeOS!</p>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">LifeOS — Master Your Habits, Tasks & Productivity</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Welcome to LifeOS 🎉',
      message,
      html,
    });
  } catch (error) {
    console.error(`[Welcome Email Error] Failed to send welcome email to ${user.email}:`, error.message);
  }

  return { user, message: 'Account created successfully! 🎉' };
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, 'Invalid email or password.');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  return { user, accessToken, refreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const forgotPassword = async (email) => {
  if (!email) {
    throw new ApiError(400, 'Please provide an email address.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Security: Do not reveal if email exists
    return { message: 'If an account with that email exists, a password reset OTP has been sent.' };
  }

  const otp = user.createPasswordResetOtp();
  await user.save({ validateBeforeSave: false });

  const message = `Your LifeOS password reset OTP is:\n\n${otp}\n\nThis OTP expires in 10 minutes.\n\nIf you did not request a password reset, ignore this email.`;

  const html = `
    <div style="font-family: sans-serif; background-color: #f6f2ea; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #0F8B8D, #0a6e70); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">LifeOS</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6; font-size: 16px;">Your LifeOS password reset OTP is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background-color: #0F8B8D; color: white; padding: 14px 32px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 6px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #777; font-size: 14px; text-align: center;">This OTP expires in 10 minutes.</p>
          <p style="color: #999; font-size: 13px; text-align: center; margin-bottom: 0;">If you did not request a password reset, ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'LifeOS Password Reset OTP',
      message,
      html,
    });
  } catch (error) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Unable to send verification email. Please try again.');
  }

  return { message: 'If an account with that email exists, a password reset OTP has been sent.' };
};

const verifyOtp = async (email, otp) => {
  if (!email || !otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordResetOtpHash) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  // Check expiration
  if (!user.passwordResetOtpExpiresAt || user.passwordResetOtpExpiresAt < Date.now()) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, 'OTP expired. Please request a new OTP.');
  }

  // Check attempts
  if (user.passwordResetOtpAttempts >= 5) {
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, 'OTP expired. Please request a new OTP.');
  }

  const hashedInputOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
  if (hashedInputOtp !== user.passwordResetOtpHash) {
    user.passwordResetOtpAttempts += 1;
    if (user.passwordResetOtpAttempts >= 5) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpiresAt = undefined;
    }
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  // Mark verified
  user.passwordResetOtpVerifiedAt = Date.now();
  await user.save({ validateBeforeSave: false });

  return { message: 'OTP verified successfully! ✅' };
};

const resetPassword = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Please provide email, OTP, and new password.');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters.');
  }

  const user = await User.findOne({ email });
  if (!user || !user.passwordResetOtpVerifiedAt) {
    throw new ApiError(400, 'OTP verification required before password reset.');
  }

  // Ensure OTP verification happened within last 15 minutes
  if (Date.now() - new Date(user.passwordResetOtpVerifiedAt).getTime() > 15 * 60 * 1000) {
    throw new ApiError(400, 'OTP verification expired. Please request a new OTP.');
  }

  // Verify OTP matches
  const hashedInputOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
  if (hashedInputOtp !== user.passwordResetOtpHash) {
    throw new ApiError(400, 'Invalid OTP. Please try again.');
  }

  user.password = newPassword;
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiresAt = undefined;
  user.passwordResetOtpAttempts = 0;
  user.passwordResetOtpVerifiedAt = undefined;
  await user.save();

  return { user, message: 'Password changed successfully! 🎉' };
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
