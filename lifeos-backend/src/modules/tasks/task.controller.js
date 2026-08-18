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

const toggleTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.toggleTaskStatus(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { task }, 'Task status toggled successfully'));
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskStatus,
};
