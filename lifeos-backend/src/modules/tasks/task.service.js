const Task = require('./task.model');
const ApiError = require('../../utils/ApiError');

const createTask = async (userId, taskData) => {
  const task = await Task.create({
    ...taskData,
    userId,
  });
  return task;
};

const getTasks = async (userId, queryOptions) => {
  const {
    status,
    priority,
    category,
    tag,
    search,
    sortBy = 'createdAt',
    order = 'desc',
    page = 1,
    limit = 20,
    dueBefore,
    dueAfter,
  } = queryOptions;

  const query = { userId, isArchived: false };

  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;
  if (tag) query.tags = { $in: [tag] };
  
  if (search) {
    query.$text = { $search: search };
  }

  if (dueBefore || dueAfter) {
    query.dueDate = {};
    if (dueBefore) query.dueDate.$lte = new Date(dueBefore);
    if (dueAfter) query.dueDate.$gte = new Date(dueAfter);
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  if (search && sortBy === 'createdAt') {
    // If searching, sort by text score by default unless another sort is specified
    sort.score = { $meta: 'textScore' };
  } else {
    sort[sortBy] = sortOrder;
  }

  const skip = (page - 1) * limit;

  const tasks = await Task.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Task.countDocuments(query);

  return {
    tasks,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getTaskById = async (userId, taskId) => {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  return task;
};

const updateTask = async (userId, taskId, updateData) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Handle automatic completedAt update
  if (updateData.status === 'done' && !task.completedAt) {
    task.completedAt = new Date();
    await task.save();
  } else if (updateData.status && updateData.status !== 'done' && task.completedAt) {
    task.completedAt = undefined;
    await task.save();
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

const toggleTaskStatus = async (userId, taskId) => {
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

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskStatus,
};
