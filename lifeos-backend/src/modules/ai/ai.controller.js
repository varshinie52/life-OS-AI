const aiService = require('./ai.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { getDashboardSnapshot } = require('../dashboard/dashboard.service');

const generateDailyPlan = asyncHandler(async (req, res) => {
  // Fetch user's current state to provide context to AI
  const snapshot = await getDashboardSnapshot(req.user._id);
  
  const plan = await aiService.getDailyPlan(req.user._id, {
    tasks: snapshot.tasks,
    habits: snapshot.habits,
    goals: snapshot.goals,
    upcomingEvents: snapshot.upcomingEvents,
  });

  res.status(200).json(new ApiResponse(200, { plan }, 'AI daily plan generated successfully'));
});

const analyzeJournal = asyncHandler(async (req, res) => {
  const analysis = await aiService.analyzeJournal(req.user._id, req.body.content);
  res.status(200).json(new ApiResponse(200, { analysis }, 'Journal analyzed successfully'));
});

module.exports = {
  generateDailyPlan,
  analyzeJournal,
};
