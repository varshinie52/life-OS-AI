const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const sendEmail = require('../../utils/sendEmail');
const { env } = require('../../config/env');

const register = async (userData) => {
  const { name, email, password } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already in use');
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationURL = `${env.CLIENT_URL}/verify-email/${verificationToken}`;
  const message = `Welcome to LifeOS! Please verify your email by clicking the link: \n\n${verificationURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your email address - LifeOS',
      message,
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'There was an error sending the email. Try again later!');
  }

  return { user, message: 'Registration successful. Please verify your email.' };
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new ApiError(401, 'Incorrect email or password');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Remove password from output
  user.password = undefined;

  return { user, accessToken, refreshToken };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

const verifyEmail = async (token) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Token is invalid or has expired');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'There is no user with email address.');
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${env.CLIENT_URL}/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password to: \n${resetURL}\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'There was an error sending the email. Try again later!');
  }
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  return user;
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
