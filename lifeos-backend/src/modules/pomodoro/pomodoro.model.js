const mongoose = require('mongoose');

const pomodoroSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    type: {
      type: String,
      enum: ['focus', 'short_break', 'long_break'],
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    completed: {
      type: Boolean,
      default: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

const Pomodoro = mongoose.model('Pomodoro', pomodoroSchema);

module.exports = Pomodoro;
