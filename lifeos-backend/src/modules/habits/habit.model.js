const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily',
    },
    customDays: [
      {
        type: Number,
        min: 0,
        max: 6, // 0 = Sun
      },
    ],
    color: String,
    icon: String,
    reminderTime: String, // HH:MM
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const habitLogSchema = new mongoose.Schema(
  {
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    note: String,
  },
  { timestamps: true }
);

// Compound index to ensure 1 log per day per habit
habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

const Habit = mongoose.model('Habit', habitSchema);
const HabitLog = mongoose.model('HabitLog', habitLogSchema);

module.exports = { Habit, HabitLog };
