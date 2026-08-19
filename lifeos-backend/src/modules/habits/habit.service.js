const { Habit, HabitLog } = require('./habit.model');
const ApiError = require('../../utils/ApiError');
const { calculateHabitStats } = require('../../utils/streakCalculator');

const createHabit = async (userId, habitData) => {
  const name = habitData.name || habitData.title;
  if (!name) {
    throw new ApiError(400, 'Habit name is required');
  }

  return await Habit.create({
    ...habitData,
    name,
    userId,
  });
};

const getHabits = async (userId, options = {}) => {
  const query = { userId };

  if (options.category && options.category !== 'all') {
    query.category = options.category;
  }

  if (options.archived === 'true') {
    query.isArchived = true;
  } else {
    query.isArchived = false;
  }

  if (options.search) {
    query.name = { $regex: options.search, $options: 'i' };
  }

  let sortOption = { createdAt: -1 };
  if (options.sort === 'alphabetical') {
    sortOption = { name: 1 };
  }

  const habits = await Habit.find(query).sort(sortOption).lean();

  // Attach today's completion state and streak stats to each habit
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfDay = new Date(todayStr);

  const habitsWithStats = await Promise.all(
    habits.map(async (h) => {
      const logs = await HabitLog.find({ habitId: h._id, userId, completed: true }).select('date').lean();
      const logDates = logs.map(l => l.date);
      const stats = calculateHabitStats(logDates, h.createdAt);

      const todayLog = await HabitLog.findOne({
        habitId: h._id,
        userId,
        date: startOfDay,
      }).lean();

      return {
        ...h,
        id: h._id,
        title: h.name,
        completedToday: !!(todayLog && todayLog.completed),
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        completionRate: stats.completionRate,
      };
    })
  );

  if (options.sort === 'streak') {
    habitsWithStats.sort((a, b) => b.currentStreak - a.currentStreak);
  } else if (options.sort === 'completion') {
    habitsWithStats.sort((a, b) => b.completionRate - a.completionRate);
  }

  return habitsWithStats;
};

const getHabitById = async (userId, habitId) => {
  const habit = await Habit.findOne({ _id: habitId, userId }).lean();
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }

  const logs = await HabitLog.find({ habitId, userId }).sort({ date: -1 }).lean();
  const completedLogs = logs.filter(l => l.completed);
  const stats = calculateHabitStats(completedLogs.map(l => l.date), habit.createdAt);

  return {
    ...habit,
    id: habit._id,
    title: habit.name,
    logs,
    stats,
  };
};

const updateHabit = async (userId, habitId, updateData) => {
  if (updateData.title && !updateData.name) {
    updateData.name = updateData.title;
  }

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

const toggleHabit = async (userId, habitId, targetDate, customCompleted) => {
  const habit = await Habit.findOne({ _id: habitId, userId });
  if (!habit) {
    throw new ApiError(404, 'Habit not found');
  }

  let dateObj = new Date();
  if (targetDate) {
    dateObj = new Date(targetDate);
  }

  const dateStr = dateObj.toISOString().split('T')[0];
  const startOfDay = new Date(dateStr);

  const existingLog = await HabitLog.findOne({ habitId, userId, date: startOfDay });

  let isCompleted = true;
  if (customCompleted !== undefined) {
    isCompleted = Boolean(customCompleted);
  } else if (existingLog) {
    isCompleted = !existingLog.completed;
  }

  const log = await HabitLog.findOneAndUpdate(
    { habitId, userId, date: startOfDay },
    { completed: isCompleted },
    { new: true, upsert: true, runValidators: true }
  );

  // Recalculate stats for habit
  const logs = await HabitLog.find({ habitId, userId, completed: true }).select('date').lean();
  const stats = calculateHabitStats(logs.map(l => l.date), habit.createdAt);

  return {
    log,
    completed: isCompleted,
    currentStreak: stats.currentStreak,
    bestStreak: stats.bestStreak,
  };
};

const getHabitAnalytics = async (userId) => {
  const habits = await Habit.find({ userId, isArchived: false }).lean();
  
  if (habits.length === 0) {
    return {
      totalHabits: 0,
      completedToday: 0,
      todayCompletionRate: 0,
      bestStreak: 0,
      habitsByCategory: {},
      dailyLogMap: {},
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startOfDay = new Date(todayStr);

  const todayLogs = await HabitLog.find({
    userId,
    date: startOfDay,
    completed: true,
  }).lean();

  const completedTodayCount = todayLogs.length;

  let globalBestStreak = 0;
  const categoryCounts = {};

  for (const h of habits) {
    const cat = h.category || 'productivity';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const logs = await HabitLog.find({ habitId: h._id, userId, completed: true }).select('date').lean();
    const stats = calculateHabitStats(logs.map(l => l.date), h.createdAt);
    if (stats.bestStreak > globalBestStreak) {
      globalBestStreak = stats.bestStreak;
    }
  }

  // Get last 30 days log history for monthly calendar / heatmap
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLogs = await HabitLog.find({
    userId,
    date: { $gte: thirtyDaysAgo },
    completed: true,
  }).lean();

  const dailyLogMap = {};
  recentLogs.forEach(l => {
    const dStr = new Date(l.date).toISOString().split('T')[0];
    dailyLogMap[dStr] = (dailyLogMap[dStr] || 0) + 1;
  });

  return {
    totalHabits: habits.length,
    completedToday: completedTodayCount,
    todayCompletionRate: habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0,
    bestStreak: globalBestStreak,
    habitsByCategory: categoryCounts,
    dailyLogMap,
  };
};

module.exports = {
  createHabit,
  getHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  checkIn: toggleHabit,
  toggleHabit,
  getHabitLogs: async (userId, habitId) => {
    return await HabitLog.find({ habitId, userId }).sort({ date: -1 });
  },
  getHabitStats: async (userId, habitId) => {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) throw new ApiError(404, 'Habit not found');
    const logs = await HabitLog.find({ habitId, userId, completed: true }).select('date').lean();
    return calculateHabitStats(logs.map(l => l.date), habit.createdAt);
  },
  getHabitAnalytics,
};
