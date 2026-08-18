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
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
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
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 10 minutes expiry
  this.passwordResetExpiry = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // 24 hours expiry
  this.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
