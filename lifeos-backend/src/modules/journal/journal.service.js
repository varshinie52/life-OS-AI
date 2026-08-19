const Journal = require('./journal.model');
const ApiError = require('../../utils/ApiError');

const createEntry = async (userId, entryData) => {
  const date = entryData.date ? new Date(entryData.date) : new Date();

  // Parse arrays if sent as comma/newline separated strings
  const sanitizeArray = (val) => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const entry = await Journal.create({
    ...entryData,
    userId,
    date,
    gratitude: sanitizeArray(entryData.gratitude),
    wins: sanitizeArray(entryData.wins),
    challenges: sanitizeArray(entryData.challenges),
    tomorrowGoals: sanitizeArray(entryData.tomorrowGoals),
    tags: sanitizeArray(entryData.tags),
  });

  return entry;
};

const getEntries = async (userId, queryOptions = {}) => {
  const { search, mood, page = 1, limit = 20, sortBy = 'date', order = 'desc' } = queryOptions;

  const query = { userId };

  if (mood && mood !== 'all') {
    query.mood = mood;
  }

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { content: { $regex: search.trim(), $options: 'i' } },
      { reflections: { $regex: search.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(search.trim(), 'i')] } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder;

  const skip = (page - 1) * limit;

  const entries = await Journal.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Journal.countDocuments(query);

  return {
    entries: entries.map(e => ({ ...e, id: e._id })),
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const getTodayEntry = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const entry = await Journal.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  if (entry) {
    return { ...entry, id: entry._id };
  }
  return null;
};

const getCalendarData = async (userId) => {
  const entries = await Journal.find({ userId })
    .select('date mood moodScore title')
    .sort({ date: -1 })
    .lean();

  return entries.map(e => ({
    id: e._id,
    date: new Date(e.date).toISOString().split('T')[0],
    mood: e.mood,
    moodScore: e.moodScore,
    title: e.title || 'Journal Entry',
  }));
};

const getMoodsAnalytics = async (userId) => {
  const aggregateResult = await Journal.aggregate([
    { $match: { userId } },
    { $group: { _id: '$mood', count: { $sum: 1 } } },
  ]);

  const moods = {
    great: 0,
    good: 0,
    okay: 0,
    bad: 0,
    awful: 0,
  };

  aggregateResult.forEach(item => {
    if (item._id && moods[item._id] !== undefined) {
      moods[item._id] = item.count;
    }
  });

  return moods;
};

const getStats = async (userId) => {
  const entries = await Journal.find({ userId })
    .select('date moodScore')
    .sort({ date: -1 })
    .lean();

  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return {
      totalEntries: 0,
      streak: 0,
      averageMoodScore: 0,
      hasJournaledToday: false,
    };
  }

  // Calculate Streak
  let streak = 0;
  const now = new Date();
  const todayStr = new Date(now).toISOString().split('T')[0];

  const datesSet = new Set(
    entries.map(e => new Date(e.date).toISOString().split('T')[0])
  );

  const hasJournaledToday = datesSet.has(todayStr);

  let checkDate = new Date(now);
  if (!hasJournaledToday) {
    // Check if journaled yesterday to maintain active streak
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (datesSet.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate Average Mood
  const sumScores = entries.reduce((acc, curr) => acc + (curr.moodScore || 4), 0);
  const averageMoodScore = Number((sumScores / totalEntries).toFixed(1));

  return {
    totalEntries,
    streak,
    averageMoodScore,
    hasJournaledToday,
  };
};

const getEntryById = async (userId, entryId) => {
  const entry = await Journal.findOne({ _id: entryId, userId }).lean();
  if (!entry) {
    throw new ApiError(404, 'Journal entry not found');
  }
  return { ...entry, id: entry._id };
};

const updateEntry = async (userId, entryId, updateData) => {
  const sanitizeArray = (val) => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
    return undefined;
  };

  const payload = { ...updateData };
  if (updateData.gratitude !== undefined) payload.gratitude = sanitizeArray(updateData.gratitude);
  if (updateData.wins !== undefined) payload.wins = sanitizeArray(updateData.wins);
  if (updateData.challenges !== undefined) payload.challenges = sanitizeArray(updateData.challenges);
  if (updateData.tomorrowGoals !== undefined) payload.tomorrowGoals = sanitizeArray(updateData.tomorrowGoals);
  if (updateData.tags !== undefined) payload.tags = sanitizeArray(updateData.tags);

  const entry = await Journal.findOneAndUpdate(
    { _id: entryId, userId },
    payload,
    { new: true, runValidators: true }
  );

  if (!entry) {
    throw new ApiError(404, 'Journal entry not found');
  }

  await entry.save();
  return entry;
};

const deleteEntry = async (userId, entryId) => {
  const entry = await Journal.findOneAndDelete({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(404, 'Journal entry not found');
  }
  return entry;
};

module.exports = {
  createEntry,
  getEntries,
  getTodayEntry,
  getCalendarData,
  getMoodsAnalytics,
  getStats,
  getEntryById,
  updateEntry,
  deleteEntry,
  getMoodHistory: getCalendarData,
};
