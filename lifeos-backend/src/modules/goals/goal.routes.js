const express = require('express');
const { check } = require('express-validator');
const goalController = require('./goal.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('status').optional().isIn(['active', 'completed', 'abandoned']),
  ],
  validate,
  goalController.createGoal
);

router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoalById);

router.put(
  '/:id',
  [
    check('status').optional().isIn(['active', 'completed', 'abandoned']),
  ],
  validate,
  goalController.updateGoal
);

router.delete('/:id', goalController.deleteGoal);

router.patch(
  '/:id/progress',
  [
    check('progress', 'Progress must be a number between 0 and 100').isNumeric({ min: 0, max: 100 }),
  ],
  validate,
  goalController.updateProgress
);

router.patch('/:id/milestones/:mid', goalController.toggleMilestone);

module.exports = router;
