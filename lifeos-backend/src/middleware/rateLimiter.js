const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

// Limit for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 500, // 500 in dev/test, 10 in prod
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again after 15 minutes'));
  },
});

// Limit for standard API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many API requests from this IP, please try again later'));
  },
});

// Limit for AI generation routes
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 20 : 500,
  handler: (req, res, next) => {
    next(new ApiError(429, 'You have exceeded your AI quota for the hour. Please try again later.'));
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
  aiLimiter,
};
