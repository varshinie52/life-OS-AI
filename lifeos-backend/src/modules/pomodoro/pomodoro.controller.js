const pomodoroService = require('./pomodoro.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const saveSession = asyncHandler(async (req, res) => {
  const session = await pomodoroService.saveSession(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { session }, 'Pomodoro session saved'));
});

const getSessions = asyncHandler(async (req, res) => {
  const result = await pomodoroService.getSessions(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Pomodoro sessions fetched'));
});

const getDailyStats = asyncHandler(async (req, res) => {
  const stats = await pomodoroService.getDailyStats(req.user._id);
  res.status(200).json(new ApiResponse(200, { stats }, 'Daily pomodoro stats fetched'));
});

const getWeeklyStats = asyncHandler(async (req, res) => {
  const stats = await pomodoroService.getWeeklyStats(req.user._id);
  res.status(200).json(new ApiResponse(200, { stats }, 'Weekly pomodoro stats fetched'));
});

module.exports = {
  saveSession,
  getSessions,
  getDailyStats,
  getWeeklyStats,
};
