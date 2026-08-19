const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500;
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'This email is already registered. Please use another email or log in.';
    error = new ApiError(400, message);
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new ApiError(400, message, Object.values(err.errors));
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token. Please log in again!');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Your token has expired. Please log in again!');
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
  };

  res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
