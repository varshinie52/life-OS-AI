const Event = require('./event.model');
const ApiError = require('../../utils/ApiError');

const createEvent = async (userId, eventData) => {
  // Add some basic validation for dates
  if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
    throw new ApiError(400, 'End time must be after start time');
  }

  return await Event.create({ ...eventData, userId });
};

const getEvents = async (userId, queryOptions) => {
  const { start, end } = queryOptions;

  const query = { userId };

  // Fetch events that overlap with the requested time window
  if (start && end) {
    query.$or = [
      { startTime: { $gte: new Date(start), $lte: new Date(end) } },
      { endTime: { $gte: new Date(start), $lte: new Date(end) } },
      { startTime: { $lte: new Date(start) }, endTime: { $gte: new Date(end) } }
    ];
  } else if (start) {
    query.startTime = { $gte: new Date(start) };
  } else if (end) {
    query.endTime = { $lte: new Date(end) };
  }

  return await Event.find(query).sort({ startTime: 1 });
};

const getEventById = async (userId, eventId) => {
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  return event;
};

const updateEvent = async (userId, eventId, updateData) => {
  // Validate times if they are being updated
  if (updateData.startTime || updateData.endTime) {
    const eventToUpdate = await Event.findOne({ _id: eventId, userId });
    if (!eventToUpdate) throw new ApiError(404, 'Event not found');
    
    const newStartTime = updateData.startTime ? new Date(updateData.startTime) : eventToUpdate.startTime;
    const newEndTime = updateData.endTime ? new Date(updateData.endTime) : eventToUpdate.endTime;

    if (newStartTime >= newEndTime) {
      throw new ApiError(400, 'End time must be after start time');
    }
  }

  const event = await Event.findOneAndUpdate(
    { _id: eventId, userId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  
  return event;
};

const deleteEvent = async (userId, eventId) => {
  const event = await Event.findOneAndDelete({ _id: eventId, userId });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  return event;
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
