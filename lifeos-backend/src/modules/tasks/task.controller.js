const taskService = require('./task.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { task }, 'Task created successfully'));
});

const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getTasks(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Tasks fetched successfully'));
});

const getTodayTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTodayTasks(req.user._id);
  res.status(200).json(new ApiResponse(200, { tasks }, 'Today tasks fetched successfully'));
});

const getUpcomingTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getUpcomingTasks(req.user._id);
  res.status(200).json(new ApiResponse(200, { tasks }, 'Upcoming tasks fetched successfully'));
});

const getOverdueTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getOverdueTasks(req.user._id);
  res.status(200).json(new ApiResponse(200, { tasks }, 'Overdue tasks fetched successfully'));
});

const getTaskAnalytics = asyncHandler(async (req, res) => {
  const analytics = await taskService.getTaskAnalytics(req.user._id);
  res.status(200).json(new ApiResponse(200, { analytics }, 'Task analytics fetched successfully'));
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { task }, 'Task fetched successfully'));
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { task }, 'Task updated successfully'));
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Task deleted successfully'));
});

const toggleTaskComplete = asyncHandler(async (req, res) => {
  const task = await taskService.toggleTaskComplete(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { task }, 'Task status toggled successfully'));
});

const toggleTaskArchive = asyncHandler(async (req, res) => {
  const task = await taskService.toggleTaskArchive(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { task }, 'Task archive status toggled'));
});

module.exports = {
  createTask,
  getTasks,
  getTodayTasks,
  getUpcomingTasks,
  getOverdueTasks,
  getTaskAnalytics,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  toggleTaskStatus: toggleTaskComplete,
  toggleTaskArchive,
};
