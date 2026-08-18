const Goal = require('./goal.model');
const ApiError = require('../../utils/ApiError');

const createGoal = async (userId, goalData) => {
  return await Goal.create({ ...goalData, userId });
};

const getGoals = async (userId) => {
  return await Goal.find({ userId }).sort({ deadline: 1, createdAt: -1 });
};

const getGoalById = async (userId, goalId) => {
  const goal = await Goal.findOne({ _id: goalId, userId }).populate('linkedHabits');
  if (!goal) {
    throw new ApiError(404, 'Goal not found');
  }
  return goal;
};

const updateGoal = async (userId, goalId, updateData) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!goal) {
    throw new ApiError(404, 'Goal not found');
  }
  return goal;
};

const deleteGoal = async (userId, goalId) => {
  const goal = await Goal.findOneAndDelete({ _id: goalId, userId });
  if (!goal) {
    throw new ApiError(404, 'Goal not found');
  }
  return goal;
};

const updateProgress = async (userId, goalId, progress) => {
  if (progress < 0 || progress > 100) {
    throw new ApiError(400, 'Progress must be between 0 and 100');
  }

  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    { progress },
    { new: true, runValidators: true }
  );

  if (!goal) {
    throw new ApiError(404, 'Goal not found');
  }

  return goal;
};

const toggleMilestone = async (userId, goalId, milestoneId) => {
  const goal = await Goal.findOne({ _id: goalId, userId });
  if (!goal) {
    throw new ApiError(404, 'Goal not found');
  }

  const milestone = goal.milestones.id(milestoneId);
  if (!milestone) {
    throw new ApiError(404, 'Milestone not found');
  }

  milestone.completed = !milestone.completed;
  if (milestone.completed) {
    milestone.completedAt = new Date();
  } else {
    milestone.completedAt = undefined;
  }

  // Automatically recalculate progress based on milestones if there are any
  if (goal.milestones.length > 0) {
    const completedCount = goal.milestones.filter(m => m.completed).length;
    goal.progress = Math.round((completedCount / goal.milestones.length) * 100);
  }

  await goal.save();
  return goal;
};

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  updateProgress,
  toggleMilestone,
};
