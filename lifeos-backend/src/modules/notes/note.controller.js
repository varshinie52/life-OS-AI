const noteService = require('./note.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createNote = asyncHandler(async (req, res) => {
  const note = await noteService.createNote(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { note }, 'Note created successfully'));
});

const getNotes = asyncHandler(async (req, res) => {
  const notes = await noteService.getNotes(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, { notes }, 'Notes fetched successfully'));
});

const getNoteById = asyncHandler(async (req, res) => {
  const note = await noteService.getNoteById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { note }, 'Note fetched successfully'));
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await noteService.updateNote(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { note }, 'Note updated successfully'));
});

const deleteNote = asyncHandler(async (req, res) => {
  await noteService.deleteNote(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Note deleted successfully'));
});

const togglePin = asyncHandler(async (req, res) => {
  const note = await noteService.togglePin(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { note }, 'Note pin toggled successfully'));
});

const toggleArchive = asyncHandler(async (req, res) => {
  const note = await noteService.toggleArchive(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { note }, 'Note archive toggled successfully'));
});

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive,
};
