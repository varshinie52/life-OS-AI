const OpenAI = require('openai');
const { env } = require('../../config/env');
const ApiError = require('../../utils/ApiError');

// Initialize OpenAI conditionally
let openai;
if (env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

const getDailyPlan = async (userId, userContext) => {
  if (!openai) {
    throw new ApiError(500, 'AI features are not configured on this server');
  }

  // Generate a prompt using the user's tasks, habits, and goals
  const prompt = `
    You are an expert productivity coach. Based on the following user context, generate an optimized daily schedule and actionable advice for today.
    Context:
    ${JSON.stringify(userContext, null, 2)}
    
    Output format:
    Provide a brief motivational opening, a time-blocked schedule prioritizing the most important tasks and active goals, and 1-2 personalized productivity tips. Keep it concise.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new ApiError(500, 'Failed to generate AI plan: ' + error.message);
  }
};

const analyzeJournal = async (userId, journalContent) => {
  if (!openai) {
    throw new ApiError(500, 'AI features are not configured on this server');
  }

  const prompt = `
    You are an empathetic AI therapist/coach. Analyze the following journal entry for emotional tone, key themes, and provide a brief supportive reflection or thought-provoking question for the user.
    Journal Entry:
    "${journalContent}"
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (error) {
    throw new ApiError(500, 'Failed to analyze journal: ' + error.message);
  }
};

module.exports = {
  getDailyPlan,
  analyzeJournal,
};
