const goalService = require('./goal.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { goal }, 'Goal created successfully'));
});

const getGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getGoals(req.user._id);
  res.status(200).json(new ApiResponse(200, { goals }, 'Goals fetched successfully'));
});

const getGoalById = asyncHandler(async (req, res) => {
  const goal = await goalService.getGoalById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { goal }, 'Goal fetched successfully'));
});

const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.updateGoal(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { goal }, 'Goal updated successfully'));
});

const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Goal deleted successfully'));
});

const updateProgress = asyncHandler(async (req, res) => {
  const goal = await goalService.updateProgress(req.user._id, req.params.id, req.body.progress);
  res.status(200).json(new ApiResponse(200, { goal }, 'Goal progress updated'));
});

const toggleMilestone = asyncHandler(async (req, res) => {
  const goal = await goalService.toggleMilestone(req.user._id, req.params.id, req.params.mid);
  res.status(200).json(new ApiResponse(200, { goal }, 'Milestone toggled successfully'));
});

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  updateProgress,
  toggleMilestone,
};
