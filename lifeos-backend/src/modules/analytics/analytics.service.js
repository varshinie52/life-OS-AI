const mongoose = require('mongoose');
const Task = require('../tasks/task.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Pomodoro = require('../pomodoro/pomodoro.model');
const Journal = require('../journal/journal.model');
const Goal = require('../goals/goal.model');
const { Expense } = require('../expenses/expense.model');

// Helper to get start and end of day/week/month
const getTimeWindow = (type) => {
  const curr = new Date();
  const start = new Date(curr);
  const end = new Date(curr);
  
  if (type === 'day') {
    start.setUTCHours(0, 0, 0, 0);
  } else if (type === 'week') {
    start.setDate(curr.getDate() - curr.getDay());
    start.setUTCHours(0, 0, 0, 0);
  } else if (type === 'month') {
    start.setDate(1);
    start.setUTCHours(0, 0, 0, 0);
  } else if (type === 'year') {
    start.setMonth(0, 1);
    start.setUTCHours(0, 0, 0, 0);
  }
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
};

const getProductivityScore = async (userId) => {
  const { start, end } = getTimeWindow('day');
  
  // Tasks
  const tasksTotal = await Task.countDocuments({ userId, isArchived: false });
  const tasksCompleted = await Task.countDocuments({ userId, status: 'done', completedAt: { $gte: start, $lte: end } });
  
  // Habits
  const habitsTotal = await Habit.countDocuments({ userId, isArchived: false });
  const habitsCompleted = await HabitLog.countDocuments({ userId, date: { $gte: start, $lte: end }, completed: true });
  
  // Focus
  const focusStats = await Pomodoro.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'focus', startTime: { $gte: start, $lte: end }, completed: true } },
    { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
  ]);
  const focusMinutes = focusStats[0]?.totalMinutes || 0;
  
  // Journal
  const journalEntries = await Journal.countDocuments({ userId, date: { $gte: start, $lte: end } });
  
  // Goals (average progress of active goals)
  const goalsStats = await Goal.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'active' } },
    { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
  ]);
  const goalsProgress = goalsStats[0]?.avgProgress || 0;

  // Formula
  const taskScore = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 0.3 : 0;
  const habitScore = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 0.3 : 0;
  const focusScore = Math.min(1, focusMinutes / 240) * 0.2; // 240 = 4h target
  const journalScore = (journalEntries > 0 ? 1 : 0) * 0.1;
  const goalScore = (goalsProgress / 100) * 0.1;

  const score = Math.round((taskScore + habitScore + focusScore + journalScore + goalScore) * 100);

  return {
    score,
    breakdown: {
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      focusMinutes,
      journalEntries,
      goalsProgress: Math.round(goalsProgress),
    }
  };
};

const getTasksAnalytics = async (userId) => {
  const stats = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isArchived: false } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 }
    }}
  ]);

  const priorityStats = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isArchived: false, status: { $ne: 'done' } } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  return { statusBreakdown: stats, pendingByPriority: priorityStats };
};

const getHabitsAnalytics = async (userId) => {
  const { start, end } = getTimeWindow('week');
  
  const stats = await HabitLog.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end }, completed: true } },
    { $group: {
        _id: '$habitId',
        completionsThisWeek: { $sum: 1 }
    }}
  ]);
  
  return stats;
};

const getTimeReport = async (userId, timeframe) => {
  const { start, end } = getTimeWindow(timeframe); // 'week', 'month', 'year'
  
  // Combine stats from tasks, focus, expenses
  const focusStats = await Pomodoro.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'focus', startTime: { $gte: start, $lte: end }, completed: true } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
        minutes: { $sum: '$duration' }
    }},
    { $sort: { _id: 1 } }
  ]);
  
  const expenseStats = await Expense.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
    { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        amount: { $sum: '$amount' }
    }},
    { $sort: { _id: 1 } }
  ]);

  return {
    timeframe,
    focusTrend: focusStats,
    spendingTrend: expenseStats
  };
};

module.exports = {
  getProductivityScore,
  getTasksAnalytics,
  getHabitsAnalytics,
  getTimeReport,
};
