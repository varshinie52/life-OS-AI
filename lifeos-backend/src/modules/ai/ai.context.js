/**
 * LifeOS AI Context Builder
 * Builds minimal, relevant context for each AI request.
 * Only fetches data that is actually needed for the query type.
 */

const Task = require('../tasks/task.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Journal = require('../journal/journal.model');
const Note = require('../notes/note.model');
const Event = require('../calendar/event.model');

const toDateStr = (d) => new Date(d).toISOString().split('T')[0];

// ─────────────────────────────────────────────
// Individual Context Builders
// ─────────────────────────────────────────────

const buildHabitContext = async (userId) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const todayStr = toDateStr(now);
  const startOfDay = new Date(todayStr);

  const habits = await Habit.find({ userId, isArchived: false }).lean();
  if (habits.length === 0) return { habits: [], totalHabits: 0, completedToday: 0 };

  const habitIds = habits.map((h) => h._id);

  // Batch fetch all recent logs at once
  const [weekLogs, todayLogs, thirtyDayLogs] = await Promise.all([
    HabitLog.find({ userId, habitId: { $in: habitIds }, date: { $gte: sevenDaysAgo }, completed: true }).lean(),
    HabitLog.find({ userId, habitId: { $in: habitIds }, date: startOfDay, completed: true }).lean(),
    HabitLog.find({ userId, habitId: { $in: habitIds }, date: { $gte: thirtyDaysAgo }, completed: true }).lean(),
  ]);

  const completedTodayIds = new Set(todayLogs.map((l) => l.habitId.toString()));
  const weekLogsByHabit = {};
  weekLogs.forEach((l) => {
    const id = l.habitId.toString();
    weekLogsByHabit[id] = (weekLogsByHabit[id] || 0) + 1;
  });

  // Build 30-day daily completion map
  const thirtyDayMap = {};
  thirtyDayLogs.forEach((l) => {
    const d = toDateStr(l.date);
    thirtyDayMap[d] = (thirtyDayMap[d] || 0) + 1;
  });

  // Calculate streaks per habit efficiently
  const allLogs = await HabitLog.find({ userId, habitId: { $in: habitIds }, completed: true })
    .select('habitId date')
    .lean();

  const logsByHabit = {};
  allLogs.forEach((l) => {
    const id = l.habitId.toString();
    if (!logsByHabit[id]) logsByHabit[id] = new Set();
    logsByHabit[id].add(toDateStr(l.date));
  });

  const calcStreak = (dateSet) => {
    let streak = 0;
    let check = new Date();
    if (!dateSet.has(toDateStr(check))) check.setDate(check.getDate() - 1);
    while (dateSet.has(toDateStr(check))) {
      streak++;
      check.setDate(check.getDate() - 1);
    }
    return streak;
  };

  const calcBestStreak = (dateSet) => {
    if (!dateSet || dateSet.size === 0) return 0;
    const sorted = Array.from(dateSet).sort();
    let best = 0, current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }
    return Math.max(best, current);
  };

  const enriched = habits.map((h) => {
    const id = h._id.toString();
    const dateSet = logsByHabit[id] || new Set();
    return {
      id,
      name: h.name,
      category: h.category,
      frequency: h.frequency,
      completedToday: completedTodayIds.has(id),
      completionsThisWeek: weekLogsByHabit[id] || 0,
      weeklyTarget: h.frequency === 'daily' ? 7 : (h.customDays?.length || 5),
      currentStreak: calcStreak(dateSet),
      bestStreak: calcBestStreak(dateSet),
    };
  });

  return {
    totalHabits: habits.length,
    completedToday: completedTodayIds.size,
    habits: enriched,
    todayCompletionRate: habits.length > 0 ? Math.round((completedTodayIds.size / habits.length) * 100) : 0,
    thirtyDayDailyMap: thirtyDayMap,
  };
};

const buildTaskContext = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [tasks, overdueTasks] = await Promise.all([
    Task.find({ userId, isArchived: false }).lean(),
    Task.find({ userId, isArchived: false, status: { $ne: 'done' }, dueDate: { $lt: startOfDay } }).lean(),
  ]);

  const pending = tasks.filter((t) => t.status !== 'done');
  const done = tasks.filter((t) => t.status === 'done');
  const highPriority = pending.filter((t) => t.priority === 'high' || t.priority === 'urgent');

  return {
    total: tasks.length,
    completedCount: done.length,
    pendingCount: pending.length,
    overdueCount: overdueTasks.length,
    completionRate: tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0,
    overdueTasks: overdueTasks.slice(0, 5).map((t) => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
    })),
    highPriorityPending: highPriority.slice(0, 5).map((t) => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status,
    })),
    recentPending: pending.slice(0, 8).map((t) => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
    })),
  };
};

const buildJournalContext = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentEntries = await Journal.find({ userId })
    .sort({ date: -1 })
    .limit(5)
    .lean();

  const moodCounts = {};
  recentEntries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  const avgMoodScore = recentEntries.length > 0
    ? Math.round(recentEntries.reduce((s, e) => s + (e.moodScore || 3), 0) / recentEntries.length * 10) / 10
    : null;

  return {
    entryCount: recentEntries.length,
    avgMoodScore,
    moodCounts,
    recentEntries: recentEntries.slice(0, 3).map((e) => ({
      date: e.date,
      title: e.title,
      mood: e.mood,
      moodScore: e.moodScore,
      // Truncate content to avoid prompt injection risk
      contentPreview: e.content ? `[USER_CONTENT]${e.content.slice(0, 200)}[/USER_CONTENT]` : '',
    })),
  };
};

const buildAnalyticsContext = async (userId) => {
  const now = new Date();

  // Build 7-day productivity data
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const endD = new Date(d);
    endD.setUTCHours(23, 59, 59, 999);

    const [tasksCompleted, habitsCompleted] = await Promise.all([
      Task.countDocuments({ userId, status: 'done', completedAt: { $gte: d, $lte: endD } }),
      HabitLog.countDocuments({ userId, date: { $gte: d, $lte: endD }, completed: true }),
    ]);

    last7Days.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: toDateStr(d),
      tasksCompleted,
      habitsCompleted,
    });
  }

  // This week vs last week comparison
  const thisWeekHabits = last7Days.reduce((s, d) => s + d.habitsCompleted, 0);
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 14);
  lastWeekStart.setUTCHours(0, 0, 0, 0);
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  lastWeekEnd.setUTCHours(23, 59, 59, 999);

  const lastWeekHabits = await HabitLog.countDocuments({
    userId,
    date: { $gte: lastWeekStart, $lte: lastWeekEnd },
    completed: true,
  });

  return {
    last7Days,
    thisWeekHabitCompletions: thisWeekHabits,
    lastWeekHabitCompletions: lastWeekHabits,
    weeklyTrend: lastWeekHabits > 0
      ? Math.round(((thisWeekHabits - lastWeekHabits) / lastWeekHabits) * 100)
      : null,
  };
};

const buildCalendarContext = async (userId) => {
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const events = await Event.find({
    userId,
    startTime: { $gte: now, $lte: weekFromNow },
  }).limit(10).lean();

  return {
    upcomingEventsCount: events.length,
    upcomingEvents: events.map((e) => ({
      title: e.title,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
  };
};

// ─────────────────────────────────────────────
// Intent Detector
// ─────────────────────────────────────────────

const INTENT_PATTERNS = {
  habits: [/habit/i, /streak/i, /consistent/i, /complet/i, /check.?in/i, /track/i, /daily/i, /fitness/i, /exercise/i, /meditat/i],
  tasks: [/task/i, /todo/i, /due/i, /overdue/i, /priorit/i, /finish/i, /complet/i, /work/i, /project/i, /urgent/i, /deadline/i],
  journal: [/journal/i, /mood/i, /feel/i, /reflect/i, /entry/i, /emotion/i, /mental/i, /well.?being/i],
  analytics: [/analyz/i, /productiv/i, /progress/i, /week/i, /month/i, /trend/i, /pattern/i, /statistic/i, /insight/i, /perform/i],
  calendar: [/event/i, /calendar/i, /schedul/i, /appointment/i, /meeting/i, /plan/i, /upcoming/i],
  general: [/how am i/i, /overview/i, /summar/i, /brief/i, /today/i, /focus/i, /help/i],
};

const detectIntent = (message) => {
  const lower = message.toLowerCase();
  const scores = {};
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    scores[intent] = patterns.filter((p) => p.test(lower)).length;
  }
  const primary = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const topIntents = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([intent]) => intent);

  return {
    primary: primary[1] > 0 ? primary[0] : 'general',
    all: topIntents,
  };
};

// ─────────────────────────────────────────────
// Main Context Builder
// ─────────────────────────────────────────────

const buildContextForMessage = async (userId, message) => {
  const intent = detectIntent(message);
  const contexts = {};

  const fetchMap = {
    habits: buildHabitContext,
    tasks: buildTaskContext,
    journal: buildJournalContext,
    analytics: buildAnalyticsContext,
    calendar: buildCalendarContext,
    general: null,
  };

  // Always fetch at least habits + tasks for general queries
  const toFetch = new Set(intent.all.length > 0 ? intent.all : ['habits', 'tasks']);
  if (intent.primary === 'general' || intent.primary === 'analytics') {
    toFetch.add('habits');
    toFetch.add('tasks');
    toFetch.add('analytics');
  }

  // Cap at 3 context types to keep prompts lean
  const limited = Array.from(toFetch).slice(0, 3);
  await Promise.all(
    limited.map(async (key) => {
      if (fetchMap[key]) {
        contexts[key] = await fetchMap[key](userId);
      }
    })
  );

  return { intent, contexts };
};

// Full context for daily brief / weekly review
const buildFullContext = async (userId) => {
  const [habits, tasks, journal, analytics] = await Promise.all([
    buildHabitContext(userId),
    buildTaskContext(userId),
    buildJournalContext(userId),
    buildAnalyticsContext(userId),
  ]);
  return { habits, tasks, journal, analytics };
};

module.exports = {
  buildContextForMessage,
  buildFullContext,
  buildHabitContext,
  buildTaskContext,
  buildJournalContext,
  buildAnalyticsContext,
  buildCalendarContext,
  detectIntent,
};
