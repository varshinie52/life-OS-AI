const { Expense, Budget } = require('./expense.model');
const ApiError = require('../../utils/ApiError');
const mongoose = require('mongoose');

const addExpense = async (userId, expenseData) => {
  return await Expense.create({ ...expenseData, userId });
};

const getExpenses = async (userId, queryOptions) => {
  const { month, year, category, startDate, endDate, page = 1, limit = 50 } = queryOptions;

  const query = { userId };

  if (category) {
    query.category = category;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  } else if (month && year) {
    // If exact month/year provided, fetch for that month
    const m = parseInt(month);
    const y = parseInt(year);
    const firstDay = new Date(Date.UTC(y, m - 1, 1));
    const lastDay = new Date(Date.UTC(y, m, 0, 23, 59, 59));
    query.date = { $gte: firstDay, $lte: lastDay };
  }

  const skip = (page - 1) * limit;

  const expenses = await Expense.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Expense.countDocuments(query);

  return {
    expenses,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getExpenseById = async (userId, expenseId) => {
  const expense = await Expense.findOne({ _id: expenseId, userId });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }
  return expense;
};

const updateExpense = async (userId, expenseId, updateData) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }
  return expense;
};

const deleteExpense = async (userId, expenseId) => {
  const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }
  return expense;
};

const getMonthlySummary = async (userId, month, year) => {
  const m = parseInt(month);
  const y = parseInt(year);
  
  const firstDay = new Date(Date.UTC(y, m - 1, 1));
  const lastDay = new Date(Date.UTC(y, m, 0, 23, 59, 59));

  const summary = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: firstDay, $lte: lastDay }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);

  const total = summary.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return { summary, totalMonthAmount: total };
};

const setBudget = async (userId, budgetData) => {
  const { month, year, totalBudget, categoryBudgets } = budgetData;

  const budget = await Budget.findOneAndUpdate(
    { userId, month, year },
    { totalBudget, categoryBudgets },
    { new: true, upsert: true, runValidators: true }
  );

  return budget;
};

const getBudgetVsActual = async (userId, month, year) => {
  const budget = await Budget.findOne({ userId, month, year });
  const { summary, totalMonthAmount } = await getMonthlySummary(userId, month, year);

  return {
    budget: budget || null,
    actual: {
      categoryBreakdown: summary,
      totalAmount: totalMonthAmount
    }
  };
};

module.exports = {
  addExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getMonthlySummary,
  setBudget,
  getBudgetVsActual,
};
