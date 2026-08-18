const Pomodoro = require('./pomodoro.model');

const saveSession = async (userId, sessionData) => {
  return await Pomodoro.create({ ...sessionData, userId });
};

const getSessions = async (userId, queryOptions) => {
  const { page = 1, limit = 50 } = queryOptions;

  const query = { userId };
  const skip = (page - 1) * limit;

  const sessions = await Pomodoro.find(query)
    .sort({ startTime: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('taskId', 'title');

  const total = await Pomodoro.countDocuments(query);

  return {
    sessions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getDailyStats = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const stats = await Pomodoro.aggregate([
    {
      $match: {
        userId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        type: 'focus',
        completed: true,
      }
    },
    {
      $group: {
        _id: null,
        totalFocusMinutes: { $sum: '$duration' },
        sessionsCount: { $sum: 1 },
      }
    }
  ]);

  return stats[0] || { totalFocusMinutes: 0, sessionsCount: 0 };
};

const getWeeklyStats = async (userId) => {
  const curr = new Date();
  const firstDay = new Date(curr.setDate(curr.getDate() - curr.getDay()));
  firstDay.setUTCHours(0, 0, 0, 0);

  const lastDay = new Date(curr.setDate(curr.getDate() - curr.getDay() + 6));
  lastDay.setUTCHours(23, 59, 59, 999);

  const stats = await Pomodoro.aggregate([
    {
      $match: {
        userId,
        startTime: { $gte: firstDay, $lte: lastDay },
        type: 'focus',
        completed: true,
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$startTime" }
        },
        dailyMinutes: { $sum: '$duration' },
        sessions: { $sum: 1 },
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const totalWeeklyMinutes = stats.reduce((acc, curr) => acc + curr.dailyMinutes, 0);

  return {
    totalWeeklyMinutes,
    dailyBreakdown: stats,
  };
};

module.exports = {
  saveSession,
  getSessions,
  getDailyStats,
  getWeeklyStats,
};
