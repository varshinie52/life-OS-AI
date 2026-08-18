const calendarService = require('./calendar.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createEvent = asyncHandler(async (req, res) => {
  const event = await calendarService.createEvent(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { event }, 'Event created successfully'));
});

const getEvents = asyncHandler(async (req, res) => {
  const events = await calendarService.getEvents(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, { events }, 'Events fetched successfully'));
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await calendarService.getEventById(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, { event }, 'Event fetched successfully'));
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await calendarService.updateEvent(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, { event }, 'Event updated successfully'));
});

const deleteEvent = asyncHandler(async (req, res) => {
  await calendarService.deleteEvent(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Event deleted successfully'));
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
