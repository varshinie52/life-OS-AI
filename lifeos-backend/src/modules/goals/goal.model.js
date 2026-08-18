const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['active', 'completed', 'abandoned'],
      default: 'active',
    },
    deadline: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        dueDate: Date,
      },
    ],
    category: {
      type: String,
      trim: true,
    },
    linkedHabits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ title: 'text', description: 'text' });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
