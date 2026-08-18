const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    recurrence: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      endDate: Date,
      interval: {
        type: Number,
        default: 1,
      },
    },
    reminders: [
      {
        minutesBefore: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying of date ranges
eventSchema.index({ userId: 1, startTime: 1, endTime: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
