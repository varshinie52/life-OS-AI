const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'dark',
    },
    accentColor: {
      type: String,
      default: '#0F8B8D',
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
      trim: true,
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    dateFormat: {
      type: String,
      default: 'YYYY-MM-DD',
      trim: true,
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
      habitReminders: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
    },
    privacy: {
      publicProfile: { type: Boolean, default: false },
      shareAnalytics: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
