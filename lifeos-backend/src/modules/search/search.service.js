const mongoose = require('mongoose');
const Task = require('../tasks/task.model');
const Note = require('../notes/note.model');
const Journal = require('../journal/journal.model');
const Goal = require('../goals/goal.model');

const globalSearch = async (userId, query) => {
  if (!query) return { tasks: [], notes: [], journal: [], goals: [] };

  const uid = new mongoose.Types.ObjectId(userId);
  const textQuery = { $text: { $search: query } };
  
  // Parallel execution of text searches across modules
  const [tasks, notes, journal, goals] = await Promise.all([
    Task.find({ userId: uid, ...textQuery })
      .select('title description status dueDate score')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10),
      
    Note.find({ userId: uid, ...textQuery })
      .select('title isPinned tags score')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10),
      
    Journal.find({ userId: uid, ...textQuery })
      .select('title date mood moodScore score')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10),
      
    Goal.find({ userId: uid, ...textQuery })
      .select('title status progress score')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
  ]);

  return {
    tasks,
    notes,
    journal,
    goals,
  };
};

module.exports = {
  globalSearch,
};
