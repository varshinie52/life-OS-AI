const aiService = require('./ai.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

// ─── Chat ─────────────────────────────────────
const chatWithAI = asyncHandler(async (req, res) => {
  const { message, history, context } = req.body;
  if (!message || !message.trim()) {
    throw new ApiError(400, 'Message is required');
  }

  const userName = req.user.name || req.user.username || 'there';
  const reply = await aiService.chatWithAI(
    req.user._id,
    userName,
    message.trim(),
    history || [],
    context || null
  );

  res.status(200).json(new ApiResponse(200, { reply }, 'AI response generated'));
});

// ─── Execute Action ───────────────────────────
const executeAction = asyncHandler(async (req, res) => {
  const { action, payload } = req.body;
  if (!action) throw new ApiError(400, 'Action type is required');

  const result = await aiService.executeAIAction(req.user._id, action, payload || {});
  res.status(200).json(new ApiResponse(200, result, result.message || 'Action executed'));
});

// ─── Daily Brief ──────────────────────────────
const getDailyBriefing = asyncHandler(async (req, res) => {
  const context = req.body?.context || null;
  const userName = req.user.name || req.user.username || 'there';
  const briefing = await aiService.getDailyBriefing(req.user._id, userName, context);
  res.status(200).json(new ApiResponse(200, { briefing }, 'Daily brief generated'));
});

// ─── Weekly Review ────────────────────────────
const getWeeklyReview = asyncHandler(async (req, res) => {
  const context = req.body?.context || null;
  const userName = req.user.name || req.user.username || 'there';
  const review = await aiService.getWeeklyReview(req.user._id, userName, context);
  res.status(200).json(new ApiResponse(200, { review }, 'Weekly review generated'));
});

// ─── AI Insights ──────────────────────────────
const getAIInsights = asyncHandler(async (req, res) => {
  const context = req.body?.context || null;
  const insights = await aiService.getAIInsights(req.user._id, context);
  res.status(200).json(new ApiResponse(200, { insights }, 'Insights fetched'));
});

// ─── Legacy compatibility handlers ────────────
const analyzeContent = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const analysis = await aiService.analyzeContent(req.user._id, content);
  res.status(200).json(new ApiResponse(200, { analysis }, 'Analysis complete'));
});

const summarizeContent = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const summary = await aiService.summarizeContent(req.user._id, content);
  res.status(200).json(new ApiResponse(200, { summary }, 'Summary generated'));
});

const suggestPriorities = asyncHandler(async (req, res) => {
  const suggestions = await aiService.suggestPriorities(req.user._id);
  res.status(200).json(new ApiResponse(200, { suggestions }, 'Priorities suggested'));
});

const generateGoalBreakdown = asyncHandler(async (req, res) => {
  const { goalTitle } = req.body;
  if (!goalTitle) throw new ApiError(400, 'Goal title is required');
  const breakdown = await aiService.generateGoalBreakdown(req.user._id, goalTitle);
  res.status(200).json(new ApiResponse(200, { breakdown }, 'Goal breakdown generated'));
});

module.exports = {
  chatWithAI,
  executeAction,
  getDailyBriefing,
  getWeeklyReview,
  getAIInsights,
  analyzeContent,
  summarizeContent,
  suggestPriorities,
  generateGoalBreakdown,
  // legacy aliases
  generateDailyPlan: getDailyBriefing,
  analyzeJournal: analyzeContent,
};
