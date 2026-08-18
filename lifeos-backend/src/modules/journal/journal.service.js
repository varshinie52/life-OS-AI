const Journal = require('./journal.model');
const ApiError = require('../../utils/ApiError');

const createEntry = async (userId, entryData) => {
  return await Journal.create({ ...entryData, userId });
};

const getEntries = async (userId, queryOptions) => {
  const { search, page = 1, limit = 20 } = queryOptions;

  const query = { userId };

  if (search) {
    query.$text = { $search: search };
  }

  const sort = search ? { score: { $meta: 'textScore' } } : { date: -1 };
  const skip = (page - 1) * limit;

  const entries = await Journal.find(query)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Journal.countDocuments(query);

  return {
    entries,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getEntryById = async (userId, entryId) => {
  const entry = await Journal.findOne({ _id: entryId, userId });
  if (!entry) {
    throw new ApiError(404, 'Journal entry not found');
  }
  return entry;
};

const updateEntry = async (userId, entryId, updateData) => {
  const entry = await Journal.findOneAndUpdate(
    { _id: entryId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!entry) {
    throw new ApiError(404, 'Journal entry not found');
  }
  
  // Re-save to trigger pre-save hook for moodScore if mood was updated
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

const getMoodHistory = async (userId, queryOptions) => {
  const { startDate, endDate } = queryOptions;
  
  const query = { userId, moodScore: { $exists: true } };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const entries = await Journal.find(query).select('date mood moodScore').sort({ date: 1 });
  
  return entries;
};

module.exports = {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getMoodHistory,
};
