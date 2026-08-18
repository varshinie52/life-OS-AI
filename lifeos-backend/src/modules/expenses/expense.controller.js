const expenseService = require('./expense.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const addExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.addExpense(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { expense }, 'Expense added successfully'));
});

const getExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.getExpenses(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Expenses fetched successfully'));
});

const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { expense }, 'Expense fetched successfully'));
});

const updateExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.updateExpense(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { expense }, 'Expense updated successfully'));
});

const deleteExpense = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Expense deleted successfully'));
});

const getMonthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currDate = new Date();
  const summary = await expenseService.getMonthlySummary(
    req.user._id,
    month || (currDate.getMonth() + 1),
    year || currDate.getFullYear()
  );
  res.status(200).json(new ApiResponse(200, summary, 'Monthly summary fetched successfully'));
});

const setBudget = asyncHandler(async (req, res) => {
  const budget = await expenseService.setBudget(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, { budget }, 'Budget set successfully'));
});

const getBudgetVsActual = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currDate = new Date();
  const data = await expenseService.getBudgetVsActual(
    req.user._id,
    month || (currDate.getMonth() + 1),
    year || currDate.getFullYear()
  );
  res.status(200).json(new ApiResponse(200, data, 'Budget vs Actual fetched successfully'));
});

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
