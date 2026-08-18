const mongoose = require('mongoose');
const Task = require('../tasks/task.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Goal = require('../goals/goal.model');
const { Expense, Budget } = require('../expenses/expense.model');
const Pomodoro = require('../pomodoro/pomodoro.model');
const Journal = require('../journal/journal.model');
const Event = require('../calendar/event.model');
const { getProductivityScore } = require('../analytics/analytics.service');

const getDashboardSnapshot = async (userId) => {
  const uid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Parallel promises for speed
  const [
    tasksTotal, tasksCompleted, tasksOverdue,
    habitsTotal, habitsCompletedToday,
    goalsActive, goalsCompleted, goalsAvgProgress,
    expensesThisMonth, budgetDoc,
    focusMinutesToday, pomodoroSessionsToday,
    journalToday,
    prodScore,
    upcomingEvents
  ] = await Promise.all([
    Task.countDocuments({ userId: uid, isArchived: false }),
    Task.countDocuments({ userId: uid, status: 'done', isArchived: false }),
    Task.countDocuments({ userId: uid, status: { $ne: 'done' }, dueDate: { $lt: startOfDay }, isArchived: false }),
    
    Habit.countDocuments({ userId: uid, isArchived: false }),
    HabitLog.countDocuments({ userId: uid, date: { $gte: startOfDay, $lte: endOfDay }, completed: true }),
    
    Goal.countDocuments({ userId: uid, status: 'active' }),
    Goal.countDocuments({ userId: uid, status: 'completed' }),
    Goal.aggregate([
      { $match: { userId: uid, status: 'active' } },
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } }
    ]),
    
    Expense.aggregate([
      { $match: { userId: uid, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Budget.findOne({ userId: uid, month: now.getMonth() + 1, year: now.getFullYear() }),

    Pomodoro.aggregate([
      { $match: { userId: uid, type: 'focus', startTime: { $gte: startOfDay, $lte: endOfDay }, completed: true } },
      { $group: { _id: null, minutes: { $sum: '$duration' }, count: { $sum: 1 } } }
    ]),
    Promise.resolve(0), // Placeholder to maintain array alignment, actual count is from aggregate above

    Journal.findOne({ userId: uid, date: { $gte: startOfDay, $lte: endOfDay } }).select('mood moodScore'),
    
    getProductivityScore(userId),
    
    Event.find({ userId: uid, startTime: { $gte: now } }).sort({ startTime: 1 }).limit(3)
  ]);

  const spentThisMonth = expensesThisMonth[0]?.total || 0;
  const budgetTotal = budgetDoc?.totalBudget || 0;

  return {
    tasks: {
      total: tasksTotal,
      completed: tasksCompleted,
      pending: tasksTotal - tasksCompleted,
      overdue: tasksOverdue,
    },
    habits: {
      todayTotal: habitsTotal,
      todayCompleted: habitsCompletedToday,
    },
    goals: {
      active: goalsActive,
      completed: goalsCompleted,
      avgProgress: Math.round(goalsAvgProgress[0]?.avgProgress || 0),
    },
    expenses: {
      thisMonth: spentThisMonth,
      budget: budgetTotal,
      remaining: budgetTotal > 0 ? budgetTotal - spentThisMonth : 0,
    },
    pomodoro: {
      focusMinutesToday: focusMinutesToday[0]?.minutes || 0,
      sessionsToday: focusMinutesToday[0]?.count || 0,
    },
    journal: {
      todayEntry: !!journalToday,
      currentMood: journalToday?.mood || null,
    },
    productivityScore: prodScore.score,
    upcomingEvents,
  };
};

module.exports = {
  getDashboardSnapshot,
};
