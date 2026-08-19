const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: 'Daily Reflection',
    },
    content: {
      type: String,
      required: [true, 'Journal content is required'],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad', 'awful'],
      default: 'good',
    },
    moodScore: {
      type: Number,
      default: 4,
    },
    gratitude: [
      {
        type: String,
        trim: true,
      },
    ],
    wins: [
      {
        type: String,
        trim: true,
      },
    ],
    challenges: [
      {
        type: String,
        trim: true,
      },
    ],
    reflections: {
      type: String,
      trim: true,
    },
    tomorrowGoals: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    writingStreak: {
      type: Number,
      default: 1,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user entries by date
journalSchema.index({ userId: 1, date: -1 });
journalSchema.index({ title: 'text', content: 'text', reflections: 'text' });

// Sync moodScore mapping without next() callback
journalSchema.pre('save', function () {
  const moodMap = {
    great: 5,
    good: 4,
    okay: 3,
    bad: 2,
    awful: 1,
  };
  if (this.mood && moodMap[this.mood]) {
    this.moodScore = moodMap[this.mood];
  }
});

const Journal = mongoose.model('Journal', journalSchema);

module.exports = Journal;
