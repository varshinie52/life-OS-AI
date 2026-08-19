const habitService = require('./habit.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.createHabit(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { habit }, 'Habit created successfully'));
});

const getHabits = asyncHandler(async (req, res) => {
  const habits = await habitService.getHabits(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, { habits }, 'Habits fetched successfully'));
});

const getHabitById = asyncHandler(async (req, res) => {
  const habit = await habitService.getHabitById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { habit }, 'Habit fetched successfully'));
});

const updateHabit = asyncHandler(async (req, res) => {
  const habit = await habitService.updateHabit(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { habit }, 'Habit updated successfully'));
});

const deleteHabit = asyncHandler(async (req, res) => {
  await habitService.deleteHabit(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Habit deleted successfully'));
});

const toggleHabit = asyncHandler(async (req, res) => {
  const { date, completed } = req.body;
  const result = await habitService.toggleHabit(req.user._id, req.params.id, date, completed);
  res.status(200).json(new ApiResponse(200, result, 'Habit toggled successfully'));
});

const getHabitAnalytics = asyncHandler(async (req, res) => {
  const analytics = await habitService.getHabitAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, { analytics }, 'Habit analytics fetched successfully'));
});

const getHabitLogs = asyncHandler(async (req, res) => {
  const logs = await habitService.getHabitLogs(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { logs }, 'Habit logs fetched successfully'));
});

const getHabitStats = asyncHandler(async (req, res) => {
  const stats = await habitService.getHabitStats(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { stats }, 'Habit stats fetched successfully'));
});

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabit,
  checkIn: toggleHabit,
  getHabitAnalytics,
  getHabitLogs,
  getHabitStats,
};
