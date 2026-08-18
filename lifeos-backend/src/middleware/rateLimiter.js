const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');

// Limit for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per `window`
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests from this IP, please try again after 15 minutes'));
  },
});

// Limit for standard API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many API requests from this IP, please try again later'));
  },
});

// Limit for AI generation routes
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per hour
  handler: (req, res, next) => {
    next(new ApiError(429, 'You have exceeded your AI quota for the hour. Please try again later.'));
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
  aiLimiter,
};
