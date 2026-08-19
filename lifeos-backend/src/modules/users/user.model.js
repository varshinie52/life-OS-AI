const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true, // Allow multiple users without username initially
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    avatar: {
      url: String,
      publicId: String,
    },
    bio: String,
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      weekStartsOn: { type: Number, default: 1 }, // 0=Sun, 1=Mon
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    passwordResetOtpHash: String,
    passwordResetOtpExpiresAt: Date,
    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
    },
    passwordResetOtpVerifiedAt: Date,
    refreshToken: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Generate 6-digit password reset OTP
userSchema.methods.createPasswordResetOtp = function () {
  const otp = crypto.randomInt(100000, 1000000).toString();

  this.passwordResetOtpHash = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  this.passwordResetOtpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.passwordResetOtpAttempts = 0;
  this.passwordResetOtpVerifiedAt = undefined;

  return otp;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
