const express = require('express');
const { check } = require('express-validator');
const taskController = require('./task.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('status').optional().isIn(['todo', 'in_progress', 'done']),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  taskController.createTask
);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);

router.put(
  '/:id',
  [
    check('status').optional().isIn(['todo', 'in_progress', 'done']),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  taskController.updateTask
);

router.delete('/:id', taskController.deleteTask);
router.patch('/:id/toggle', taskController.toggleTaskStatus);

module.exports = router;
