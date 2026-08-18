const Note = require('./note.model');
const ApiError = require('../../utils/ApiError');

const createNote = async (userId, noteData) => {
  return await Note.create({ ...noteData, userId });
};

const getNotes = async (userId, queryOptions = {}) => {
  const { pinned, archived, tag, search } = queryOptions;

  const query = { userId };

  if (pinned !== undefined) {
    query.isPinned = pinned === 'true';
  }
  
  // Default to non-archived unless specifically requested
  if (archived !== undefined) {
    query.isArchived = archived === 'true';
  } else {
    query.isArchived = false;
  }

  if (tag) {
    query.tags = { $in: [tag] };
  }

  if (search) {
    query.$text = { $search: search };
  }

  let sort = { isPinned: -1, updatedAt: -1 };
  if (search) {
    sort = { score: { $meta: 'textScore' } };
  }

  return await Note.find(query).sort(sort);
};

const getNoteById = async (userId, noteId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  return note;
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
  // If we archive, we probably want to unpin it
  if (note.isArchived) {
    note.isPinned = false;
  }
  
  await note.save();
  return note;
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive,
};
