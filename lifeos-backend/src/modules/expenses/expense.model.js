const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['food', 'transport', 'shopping', 'health', 'entertainment', 'utilities', 'other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'other'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster aggregation and querying
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number, // 1-12
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    categoryBudgets: [
      {
        category: {
          type: String,
          enum: ['food', 'transport', 'shopping', 'health', 'entertainment', 'utilities', 'other'],
        },
        limit: {
          type: Number,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

const Expense = mongoose.model('Expense', expenseSchema);
const Budget = mongoose.model('Budget', budgetSchema);

module.exports = { Expense, Budget };
