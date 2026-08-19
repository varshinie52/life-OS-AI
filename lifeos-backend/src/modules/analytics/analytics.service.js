const mongoose = require('mongoose');
const Task = require('../tasks/task.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Journal = require('../journal/journal.model');
const Note = require('../notes/note.model');
const Event = require('../calendar/event.model');

const getOverview = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [
    totalTasks,
    completedTasks,
    totalHabits,
    habitsCompletedToday,
    totalJournalEntries,
    totalNotes,
  ] = await Promise.all([
    Task.countDocuments({ userId, isArchived: false }),
    Task.countDocuments({ userId, isArchived: false, status: 'done' }),
    Habit.countDocuments({ userId, isArchived: false }),
    HabitLog.countDocuments({ userId, date: { $gte: startOfDay }, completed: true }),
    Journal.countDocuments({ userId }),
    Note.countDocuments({ userId, isArchived: false }),
  ]);

  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const habitSuccessRate = totalHabits > 0 ? Math.round((habitsCompletedToday / totalHabits) * 100) : 0;

  // Productivity score 0-100 formula
  const score = Math.min(100, Math.round(taskCompletionRate * 0.5 + habitSuccessRate * 0.3 + (totalJournalEntries > 0 ? 20 : 0)));

  return {
    productivityScore: score,
    totalTasks,
    completedTasks,
    taskCompletionRate,
    totalHabits,
    habitsCompletedToday,
    habitSuccessRate,
    totalJournalEntries,
    totalNotes,
  };
};

const getHabitsAnalytics = async (userId) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const habits = await Habit.find({ userId, isArchived: false }).lean();
  const logs = await HabitLog.find({
    userId,
    date: { $gte: startOfWeek },
    completed: true,
  }).lean();

  const habitPerformance = habits.map((h) => {
    const count = logs.filter((l) => l.habitId.toString() === h._id.toString()).length;
    return {
      id: h._id,
      name: h.name || h.title,
      icon: h.icon || '🎯',
      color: h.color || '#0F8B8D',
      streak: h.currentStreak || 0,
      completionsPastWeek: count,
    };
  });

  return {
    totalHabits: habits.length,
    performance: habitPerformance,
  };
};

const getTasksAnalytics = async (userId) => {
  const statusBreakdown = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isArchived: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const priorityBreakdown = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isArchived: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);

  // Last 7 days task completion curve
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const endD = new Date(d);
    endD.setUTCHours(23, 59, 59, 999);

    const count = await Task.countDocuments({
      userId,
      status: 'done',
      completedAt: { $gte: d, $lte: endD },
    });

    last7Days.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completed: count,
    });
  }

  return {
    statusBreakdown: statusBreakdown.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    priorityBreakdown: priorityBreakdown.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    weeklyCompletionCurve: last7Days,
  };
};

const getJournalAnalytics = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const entries = await Journal.find({
    userId,
    date: { $gte: thirtyDaysAgo },
  })
    .sort({ date: 1 })
    .lean();

  const moodTrend = entries.map((e) => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: e.moodScore || 4,
    mood: e.mood,
  }));

  const moodDistribution = await Journal.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$mood', count: { $sum: 1 } } },
  ]);

  return {
    moodTrend,
    moodDistribution: moodDistribution.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
  };
};

const getProductivityAnalytics = async (userId, timeframe = '30') => {
  const days = parseInt(timeframe) || 30;
  const trend = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const endD = new Date(d);
    endD.setUTCHours(23, 59, 59, 999);

    const [tasksCompleted, habitsCompleted, journalDone] = await Promise.all([
      Task.countDocuments({ userId, status: 'done', completedAt: { $gte: d, $lte: endD } }),
      HabitLog.countDocuments({ userId, date: { $gte: d, $lte: endD }, completed: true }),
      Journal.countDocuments({ userId, date: { $gte: d, $lte: endD } }),
    ]);

    const dailyScore = Math.min(100, (tasksCompleted * 20) + (habitsCompleted * 15) + (journalDone * 25));

    trend.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: dailyScore,
      tasks: tasksCompleted,
      habits: habitsCompleted,
    });
  }

  return { timeframe: days, trend };
};

const getStreaksAnalytics = async (userId) => {
  const habits = await Habit.find({ userId, isArchived: false }).lean();
  const maxHabitStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  // Journal streak
  const journalEntries = await Journal.find({ userId }).select('date').sort({ date: -1 }).lean();
  let journalStreak = 0;
  if (journalEntries.length > 0) {
    const datesSet = new Set(
      journalEntries.map((e) => new Date(e.date).toISOString().split('T')[0])
    );
    let checkDate = new Date();
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!datesSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (datesSet.has(dStr)) {
        journalStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    bestHabitStreak: maxHabitStreak,
    journalStreak,
  };
};

const getHeatmapAnalytics = async (userId) => {
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);

  const [taskLogs, habitLogs, journalLogs] = await Promise.all([
    Task.find({ userId, status: 'done', completedAt: { $gte: oneYearAgo } }).select('completedAt').lean(),
    HabitLog.find({ userId, date: { $gte: oneYearAgo }, completed: true }).select('date').lean(),
    Journal.find({ userId, date: { $gte: oneYearAgo } }).select('date').lean(),
  ]);

  const activityMap = {};

  const addDate = (dStr) => {
    if (!dStr) return;
    activityMap[dStr] = (activityMap[dStr] || 0) + 1;
  };

  taskLogs.forEach((t) => t.completedAt && addDate(new Date(t.completedAt).toISOString().split('T')[0]));
  habitLogs.forEach((h) => h.date && addDate(new Date(h.date).toISOString().split('T')[0]));
  journalLogs.forEach((j) => j.date && addDate(new Date(j.date).toISOString().split('T')[0]));

  const heatmap = Object.keys(activityMap).map((date) => {
    const count = activityMap[date];
    let level = 0;
    if (count > 0) level = 1;
    if (count > 2) level = 2;
    if (count > 4) level = 3;
    if (count > 6) level = 4;
    return { date, count, level };
  });

  return { heatmap };
};

module.exports = {
  getOverview,
  getHabitsAnalytics,
  getTasksAnalytics,
  getJournalAnalytics,
  getProductivityAnalytics,
  getProductivityScore: getOverview,
  getStreaksAnalytics,
  getHeatmapAnalytics,
};
