const Settings = require('./settings.model');
const User = require('../users/user.model');
const Task = require('../tasks/task.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Note = require('../notes/note.model');
const Journal = require('../journal/journal.model');
const Event = require('../calendar/event.model');
const ApiError = require('../../utils/ApiError');

const getSettings = async (userId) => {
  let settings = await Settings.findOne({ userId });
  if (!settings) {
    settings = await Settings.create({ userId });
  }
  return settings;
};

const updateSettings = async (userId, updateData) => {
  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

const getPreferences = async (userId) => {
  const settings = await getSettings(userId);
  return {
    language: settings.language,
    timeZone: settings.timeZone,
    dateFormat: settings.dateFormat,
    privacy: settings.privacy,
  };
};

const updatePreferences = async (userId, preferenceData) => {
  const settings = await Settings.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...(preferenceData.language && { language: preferenceData.language }),
        ...(preferenceData.timeZone && { timeZone: preferenceData.timeZone }),
        ...(preferenceData.dateFormat && { dateFormat: preferenceData.dateFormat }),
        ...(preferenceData.privacy && { privacy: preferenceData.privacy }),
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

const getAppearance = async (userId) => {
  const settings = await getSettings(userId);
  return {
    theme: settings.theme,
    accentColor: settings.accentColor,
  };
};

const updateAppearance = async (userId, appearanceData) => {
  const settings = await Settings.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...(appearanceData.theme && { theme: appearanceData.theme }),
        ...(appearanceData.accentColor && { accentColor: appearanceData.accentColor }),
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
};

const getNotifications = async (userId) => {
  const settings = await getSettings(userId);
  return settings.notifications;
};

const updateNotifications = async (userId, notificationData) => {
  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set: { notifications: notificationData } },
    { new: true, upsert: true, runValidators: true }
  );
  return settings.notifications;
};

const exportUserData = async (userId) => {
  const [user, settings, tasks, habits, habitLogs, notes, journalEntries, events] = await Promise.all([
    User.findById(userId).select('-password'),
    Settings.findOne({ userId }),
    Task.find({ userId }),
    Habit.find({ userId }),
    HabitLog.find({ userId }),
    Note.find({ userId }),
    Journal.find({ userId }),
    Event.find({ userId }),
  ]);

  return {
    exportDate: new Date().toISOString(),
    user,
    settings,
    tasks,
    habits,
    habitLogs,
    notes,
    journalEntries,
    events,
  };
};

const deleteAccount = async (userId) => {
  await Promise.all([
    User.findByIdAndDelete(userId),
    Settings.findOneAndDelete({ userId }),
    Task.deleteMany({ userId }),
    Habit.deleteMany({ userId }),
    HabitLog.deleteMany({ userId }),
    Note.deleteMany({ userId }),
    Journal.deleteMany({ userId }),
    Event.deleteMany({ userId }),
  ]);

  return { success: true };
};

module.exports = {
  getSettings,
  updateSettings,
  getPreferences,
  updatePreferences,
  getAppearance,
  updateAppearance,
  getNotifications,
  updateNotifications,
  exportUserData,
  deleteAccount,
};
