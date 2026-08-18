const Task = require('../tasks/task.model');
const Note = require('../notes/note.model');
const { Habit, HabitLog } = require('../habits/habit.model');
const Goal = require('../goals/goal.model');
const Journal = require('../journal/journal.model');
const Pomodoro = require('../pomodoro/pomodoro.model');
const { Expense } = require('../expenses/expense.model');
const Event = require('../calendar/event.model');

const exportUserData = async (userId) => {
  const [
    tasks,
    notes,
    habits,
    habitLogs,
    goals,
    journal,
    pomodoros,
    expenses,
    events
  ] = await Promise.all([
    Task.find({ userId }).select('-userId -__v'),
    Note.find({ userId }).select('-userId -__v'),
    Habit.find({ userId }).select('-userId -__v'),
    HabitLog.find({ userId }).select('-userId -__v'),
    Goal.find({ userId }).select('-userId -__v'),
    Journal.find({ userId }).select('-userId -__v'),
    Pomodoro.find({ userId }).select('-userId -__v'),
    Expense.find({ userId }).select('-userId -__v'),
    Event.find({ userId }).select('-userId -__v'),
  ]);

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      tasks,
      notes,
      habits,
      habitLogs,
      goals,
      journal,
      pomodoros,
      expenses,
      events,
    }
  };
};

module.exports = {
  exportUserData,
};
