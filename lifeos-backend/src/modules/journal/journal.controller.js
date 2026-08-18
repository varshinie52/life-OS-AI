const journalService = require('./journal.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createEntry = asyncHandler(async (req, res) => {
  const entry = await journalService.createEntry(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { entry }, 'Journal entry created successfully'));
});

const getEntries = asyncHandler(async (req, res) => {
  const result = await journalService.getEntries(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, result, 'Journal entries fetched successfully'));
});

const getEntryById = asyncHandler(async (req, res) => {
  const entry = await journalService.getEntryById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { entry }, 'Journal entry fetched successfully'));
});

const updateEntry = asyncHandler(async (req, res) => {
  const entry = await journalService.updateEntry(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { entry }, 'Journal entry updated successfully'));
});

const deleteEntry = asyncHandler(async (req, res) => {
  await journalService.deleteEntry(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Journal entry deleted successfully'));
});

const getMoodHistory = asyncHandler(async (req, res) => {
  const history = await journalService.getMoodHistory(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, { history }, 'Mood history fetched successfully'));
});

module.exports = {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getMoodHistory,
};
