const calendarService = require('./calendar.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const createEvent = asyncHandler(async (req, res) => {
  const event = await calendarService.createEvent(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, { event }, 'Event created successfully'));
});

const getEvents = asyncHandler(async (req, res) => {
  const events = await calendarService.getUnifiedEvents(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, { events }, 'Unified calendar events fetched successfully'));
});

const getMonthView = asyncHandler(async (req, res) => {
  const monthData = await calendarService.getMonthView(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, monthData, 'Month view calendar events fetched successfully'));
});

const getDayAgenda = asyncHandler(async (req, res) => {
  const dayData = await calendarService.getDayAgenda(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, dayData, 'Day agenda calendar events fetched successfully'));
});

const getAgenda = asyncHandler(async (req, res) => {
  const agendaData = await calendarService.getAgenda(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, agendaData, 'Upcoming calendar agenda fetched successfully'));
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
  getMonthView,
  getDayAgenda,
  getAgenda,
  getEventById,
  updateEvent,
  deleteEvent,
};
