const express = require('express');
const { check } = require('express-validator');
const taskController = require('./task.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All task routes require authentication
router.use(protect);

router.post(
  '/',
  [
    check('title', 'Title or name is required').optional().not().isEmpty(),
    check('name', 'Title or name is required').optional().not().isEmpty(),
    check('status').optional().isIn(['todo', 'in_progress', 'done']),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  taskController.createTask
);

router.get('/', taskController.getTasks);
router.get('/today', taskController.getTodayTasks);
router.get('/upcoming', taskController.getUpcomingTasks);
router.get('/overdue', taskController.getOverdueTasks);
router.get('/analytics', taskController.getTaskAnalytics);

router.get('/:id', taskController.getTaskById);

router.patch(
  '/:id',
  [
    check('status').optional().isIn(['todo', 'in_progress', 'done']),
    check('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  taskController.updateTask
);

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

router.post('/:id/complete', taskController.toggleTaskComplete);
router.post('/:id/archive', taskController.toggleTaskArchive);
router.patch('/:id/toggle', taskController.toggleTaskComplete);

module.exports = router;
