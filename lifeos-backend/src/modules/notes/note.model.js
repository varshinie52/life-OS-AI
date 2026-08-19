const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
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
    content: {
      type: String,
      default: '',
    },
    folder: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    color: {
      type: String,
      default: '#0F8B8D',
      trim: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
noteSchema.index({ userId: 1, folder: 1, isArchived: 1 });
noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
