const { Habit, HabitLog } = require('./habit.model');
const ApiError = require('../../utils/ApiError');
const { calculateHabitStats } = require('../../utils/streakCalculator');

const createHabit = async (userId, habitData) => {
  return await Habit.create({ ...habitData, userId });
};

const getHabits = async (userId) => {
  return await Habit.find({ userId, isArchived: false }).sort({ createdAt: -1 });
};

const getHabitById = async (userId, habitId) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }
  return habit;
};

const updateHabit = async (userId, habitId, updateData) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: habitId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }
  return habit;
};

const deleteHabit = async (userId, habitId) => {
  const habit = await Habit.findOneAndDelete({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }
  
  // Cascade delete logs
  await HabitLog.deleteMany({ habitId });
  return habit;
};

const checkIn = async (userId, habitId, logData) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }

  // Normalize date to start of day (UTC)
  let date = new Date();
  if (logData.date) {
    date = new Date(logData.date);
  }
  const dateStr = date.toISOString().split('T')[0];
  const startOfDay = new Date(dateStr);

  const log = await HabitLog.findOneAndUpdate(
    { habitId, userId, date: startOfDay },
    { completed: logData.completed ?? true, note: logData.note },
    { new: true, upsert: true, runValidators: true }
  );

  return log;
};

const getHabitLogs = async (userId, habitId) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }

  return await HabitLog.find({ habitId, userId }).sort({ date: -1 });
};

const getHabitStats = async (userId, habitId) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }

  const logs = await HabitLog.find({ habitId, userId, completed: true }).select('date').lean();
  const logDates = logs.map(l => l.date);

  const stats = calculateHabitStats(logDates, habit.createdAt);
  
  return {
    ...stats,
    totalLogs: logs.length
  };
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  checkIn,
  getHabitLogs,
  getHabitStats,
};
