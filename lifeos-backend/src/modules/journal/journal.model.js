const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ['great', 'good', 'okay', 'bad', 'awful'],
    },
    moodScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPrivate: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
journalSchema.index({ userId: 1, date: -1 });
journalSchema.index({ title: 'text', content: 'text' });

// Pre-save to auto-calculate moodScore from mood string if not provided
journalSchema.pre('save', function(next) {
  if (this.isModified('mood') && !this.isModified('moodScore')) {
    const moodMap = {
      great: 5,
      good: 4,
      okay: 3,
      bad: 2,
      awful: 1,
    };
    if (this.mood) {
      this.moodScore = moodMap[this.mood];
    }
  }
  next();
});

const Journal = mongoose.model('Journal', journalSchema);

module.exports = Journal;
