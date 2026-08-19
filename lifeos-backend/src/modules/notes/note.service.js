const Note = require('./note.model');
const ApiError = require('../../utils/ApiError');

const createNote = async (userId, noteData) => {
  if (!noteData.title) {
    throw new ApiError(400, 'Note title is required');
  }

  const note = await Note.create({
    ...noteData,
    userId,
    folder: noteData.folder || 'General',
  });

  return note;
};

const getNotes = async (userId, queryOptions = {}) => {
  const {
    pinned,
    archived = 'false',
    folder,
    tag,
    color,
    search,
    sortBy = 'updatedAt',
    order = 'desc',
  } = queryOptions;

  const query = { userId };

  if (archived === 'true') {
    query.isArchived = true;
  } else {
    query.isArchived = false;
  }

  if (pinned === 'true') {
    query.isPinned = true;
  } else if (pinned === 'false') {
    query.isPinned = false;
  }

  if (folder && folder !== 'all' && folder !== 'All Notes') {
    query.folder = folder;
  }

  if (tag) {
    query.tags = { $in: [tag] };
  }

  if (color) {
    query.color = color;
  }

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { content: { $regex: search.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(search.trim(), 'i')] } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = { isPinned: -1 };
  sort[sortBy] = sortOrder;

  const notes = await Note.find(query).sort(sort).lean();

  return notes.map(n => ({ ...n, id: n._id }));
};

const searchNotes = async (userId, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    return await getNotes(userId);
  }

  const notes = await Note.find({
    userId,
    isArchived: false,
    $or: [
      { title: { $regex: searchQuery.trim(), $options: 'i' } },
      { content: { $regex: searchQuery.trim(), $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery.trim(), 'i')] } },
    ],
  }).sort({ isPinned: -1, updatedAt: -1 }).lean();

  return notes.map(n => ({ ...n, id: n._id }));
};

const getFolders = async (userId) => {
  const aggregateResult = await Note.aggregate([
    { $match: { userId, isArchived: false } },
    { $group: { _id: '$folder', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const totalNotes = await Note.countDocuments({ userId, isArchived: false });
  const archivedNotes = await Note.countDocuments({ userId, isArchived: true });

  const folders = aggregateResult.map(r => ({
    name: r._id || 'General',
    count: r.count,
  }));

  return {
    totalNotes,
    archivedNotes,
    folders,
  };
};

const getNoteById = async (userId, noteId) => {
  const note = await Note.findOne({ _id: noteId, userId }).lean();
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  return { ...note, id: note._id };
};

const updateNote = async (userId, noteId, updateData) => {
  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  return note;
};

const deleteNote = async (userId, noteId) => {
  const note = await Note.findOneAndDelete({ _id: noteId, userId });
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  return note;
};

const togglePin = async (userId, noteId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  note.isPinned = !note.isPinned;
  await note.save();
  return note;
};

const toggleArchive = async (userId, noteId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }

  note.isArchived = !note.isArchived;
  if (note.isArchived) {
    note.isPinned = false;
  }

  await note.save();
  return note;
};

module.exports = {
  createNote,
  getNotes,
  searchNotes,
  getFolders,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive,
};
