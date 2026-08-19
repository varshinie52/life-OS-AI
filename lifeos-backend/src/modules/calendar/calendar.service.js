const Event = require('./event.model');
const Task = require('../tasks/task.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Journal = require('../journal/journal.model');
const ApiError = require('../../utils/ApiError');

const createEvent = async (userId, eventData) => {
  if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
    throw new ApiError(400, 'End time must be after start time');
  }
  return await Event.create({ ...eventData, userId });
};

const getUnifiedEvents = async (userId, queryOptions = {}) => {
  const { year, month, startDate, endDate, types = 'event,task,habit,journal' } = queryOptions;

  let start = startDate ? new Date(startDate) : new Date();
  let end = endDate ? new Date(endDate) : new Date();

  if (year && month) {
    const y = parseInt(year);
    const m = parseInt(month) - 1;
    start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
  } else if (!startDate && !endDate) {
    // Default to current month window
    const now = new Date();
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
    end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
  }

  const allowedTypes = types.split(',').map(t => t.trim().toLowerCase());
  const unifiedList = [];

  // 1. Fetch Custom Events
  if (allowedTypes.includes('event')) {
    const events = await Event.find({
      userId,
      $or: [
        { startTime: { $gte: start, $lte: end } },
        { endTime: { $gte: start, $lte: end } },
      ],
    }).lean();

    events.forEach(ev => {
      const dateStr = new Date(ev.startTime).toISOString().split('T')[0];
      unifiedList.push({
        id: ev._id,
        title: ev.title,
        description: ev.description || '',
        date: dateStr,
        startTime: ev.startTime,
        endTime: ev.endTime,
        allDay: ev.allDay || false,
        type: 'event',
        color: ev.color || '#3b82f6',
        location: ev.location || '',
        originalData: ev,
      });
    });
  }

  // 2. Fetch Tasks with due dates
  if (allowedTypes.includes('task')) {
    const tasks = await Task.find({
      userId,
      isArchived: false,
      dueDate: { $gte: start, $lte: end },
    }).lean();

    tasks.forEach(t => {
      const dateStr = new Date(t.dueDate).toISOString().split('T')[0];
      const priorityColorMap = {
        urgent: '#ef4444',
        high: '#f97316',
        medium: '#f59e0b',
        low: '#3b82f6',
      };
      unifiedList.push({
        id: `task-${t._id}`,
        taskId: t._id,
        title: `Task: ${t.title}`,
        description: t.description || `Priority: ${t.priority}`,
        date: dateStr,
        startTime: t.dueDate,
        endTime: t.dueDate,
        allDay: true,
        type: 'task',
        status: t.status,
        priority: t.priority,
        color: priorityColorMap[t.priority] || '#3b82f6',
        originalData: t,
      });
    });
  }

  // 3. Fetch Habit Logs & Habits
  if (allowedTypes.includes('habit')) {
    const habitLogs = await HabitLog.find({
      userId,
      date: { $gte: start, $lte: end },
      completed: true,
    }).populate('habitId').lean();

    habitLogs.forEach(hl => {
      if (!hl.habitId) return;
      const dateStr = new Date(hl.date).toISOString().split('T')[0];
      unifiedList.push({
        id: `habit-${hl._id}`,
        habitId: hl.habitId._id,
        title: `${hl.habitId.icon || '🎯'} ${hl.habitId.name || hl.habitId.title}`,
        description: `Completed habit (${hl.habitId.category || 'general'})`,
        date: dateStr,
        startTime: hl.date,
        endTime: hl.date,
        allDay: true,
        type: 'habit',
        color: hl.habitId.color || '#10b981',
        originalData: hl,
      });
    });
  }

  // 4. Fetch Journal Entries
  if (allowedTypes.includes('journal')) {
    const journals = await Journal.find({
      userId,
      date: { $gte: start, $lte: end },
    }).lean();

    journals.forEach(j => {
      const dateStr = new Date(j.date).toISOString().split('T')[0];
      const moodEmojiMap = {
        great: '😃',
        good: '😊',
        okay: '😐',
        bad: '😔',
        awful: '😢',
      };
      unifiedList.push({
        id: `journal-${j._id}`,
        journalId: j._id,
        title: `Journal: ${moodEmojiMap[j.mood] || '📖'} ${j.title || 'Daily Entry'}`,
        description: j.content || '',
        date: dateStr,
        startTime: j.date,
        endTime: j.date,
        allDay: true,
        type: 'journal',
        color: '#8b5cf6',
        originalData: j,
      });
    });
  }

  // Sort unified events by startTime
  unifiedList.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return unifiedList;
};

const getMonthView = async (userId, queryOptions = {}) => {
  const events = await getUnifiedEvents(userId, queryOptions);

  const monthMap = {};
  events.forEach(ev => {
    if (!monthMap[ev.date]) {
      monthMap[ev.date] = [];
    }
    monthMap[ev.date].push(ev);
  });

  return {
    events,
    eventsByDate: monthMap,
  };
};

const getDayAgenda = async (userId, queryOptions = {}) => {
  const { date = new Date().toISOString().split('T')[0] } = queryOptions;

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const events = await getUnifiedEvents(userId, {
    startDate: startOfDay.toISOString(),
    endDate: endOfDay.toISOString(),
    types: queryOptions.types || 'event,task,habit,journal',
  });

  return {
    date,
    events,
    total: events.length,
  };
};

const getAgenda = async (userId, queryOptions = {}) => {
  const { days = 7 } = queryOptions;
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + parseInt(days));

  const events = await getUnifiedEvents(userId, {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });

  return {
    days: parseInt(days),
    events,
  };
};

const getEventById = async (userId, eventId) => {
  const event = await Event.findOne({ _id: eventId, userId }).lean();
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  return { ...event, id: event._id };
};

const updateEvent = async (userId, eventId, updateData) => {
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
  getEvents: getUnifiedEvents,
  getUnifiedEvents,
  getMonthView,
  getDayAgenda,
  getAgenda,
  getEventById,
  updateEvent,
  deleteEvent,
};
