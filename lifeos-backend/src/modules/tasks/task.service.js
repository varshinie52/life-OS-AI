const Task = require('./task.model');
const ApiError = require('../../utils/ApiError');

const createTask = async (userId, taskData) => {
  const title = taskData.title || taskData.name;
  if (!title) {
    throw new ApiError(400, 'Task title is required');
  }

  const task = await Task.create({
    ...taskData,
    title,
    userId,
    status: taskData.status || 'todo',
    completedAt: taskData.status === 'done' ? new Date() : undefined,
  });

  return task;
};

const getTasks = async (userId, queryOptions = {}) => {
  const {
    status,
    priority,
    category,
    tag,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    archived = 'false',
  } = queryOptions;

  const query = { userId };
  query.isArchived = archived === 'true';

  if (status && status !== 'all') {
    query.status = status;
  }
  if (priority && priority !== 'all') {
    query.priority = priority;
  }
  if (category && category !== 'all') {
    query.category = category;
  }
  if (tag) {
    query.tags = { $in: [tag] };
  }

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder;

  const tasks = await Task.find(query).sort(sort).lean();

  return {
    tasks: tasks.map(t => ({ ...t, id: t._id })),
    total: tasks.length,
  };
};

const getTodayTasks = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const tasks = await Task.find({
    userId,
    isArchived: false,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ priority: -1, createdAt: -1 }).lean();

  return tasks.map(t => ({ ...t, id: t._id }));
};

const getUpcomingTasks = async (userId) => {
  const now = new Date();
  const startOfTomorrow = new Date(now);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setUTCHours(0, 0, 0, 0);

  const tasks = await Task.find({
    userId,
    isArchived: false,
    status: { $ne: 'done' },
    dueDate: { $gte: startOfTomorrow },
  }).sort({ dueDate: 1, priority: -1 }).lean();

  return tasks.map(t => ({ ...t, id: t._id }));
};

const getOverdueTasks = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const tasks = await Task.find({
    userId,
    isArchived: false,
    status: { $ne: 'done' },
    dueDate: { $lt: startOfDay },
  }).sort({ dueDate: 1 }).lean();

  return tasks.map(t => ({ ...t, id: t._id }));
};

const getTaskAnalytics = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [total, completed, pending, overdue, urgentAndHigh] = await Promise.all([
    Task.countDocuments({ userId, isArchived: false }),
    Task.countDocuments({ userId, isArchived: false, status: 'done' }),
    Task.countDocuments({ userId, isArchived: false, status: { $ne: 'done' } }),
    Task.countDocuments({ userId, isArchived: false, status: { $ne: 'done' }, dueDate: { $lt: startOfDay } }),
    Task.countDocuments({ userId, isArchived: false, priority: { $in: ['high', 'urgent'] } }),
  ]);

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending,
    overdue,
    urgentAndHigh,
    completionRate,
  };
};

const getTaskById = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, userId }).lean();
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return { ...task, id: task._id };
};

const updateTask = async (userId, taskId, updateData) => {
  if (updateData.name && !updateData.title) {
    updateData.title = updateData.name;
  }

  if (updateData.status === 'done') {
    updateData.completedAt = new Date();
  } else if (updateData.status && updateData.status !== 'done') {
    updateData.completedAt = undefined;
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return task;
};

const deleteTask = async (userId, taskId) => {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return task;
};

const toggleTaskComplete = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const isDone = task.status === 'done';
  task.status = isDone ? 'todo' : 'done';
  task.completedAt = isDone ? undefined : new Date();

  await task.save();
  return task;
};

const toggleTaskArchive = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  task.isArchived = !task.isArchived;
  await task.save();
  return task;
};

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
