const express = require('express');
const { check } = require('express-validator');
const expenseController = require('./expense.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    check('amount', 'Amount is required and must be a number').isNumeric(),
    check('category', 'Valid category is required').isIn([
      'food', 'transport', 'shopping', 'health', 'entertainment', 'utilities', 'other'
    ]),
  ],
  validate,
  expenseController.addExpense
);

router.get('/summary/monthly', expenseController.getMonthlySummary);

router.get('/budget', expenseController.getBudgetVsActual);
router.put(
  '/budget',
  [
    check('month', 'Month (1-12) is required').isInt({ min: 1, max: 12 }),
    check('year', 'Year is required').isInt(),
    check('totalBudget', 'Total budget is required').isNumeric(),
  ],
  validate,
  expenseController.setBudget
);

router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
