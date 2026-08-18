const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../modules/users/user.model');
const { env } = require('../config/env');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new ApiError(401, 'You are not logged in! Please log in to get access.')
    );
  }

  try {
    const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new ApiError(401, 'The user belonging to this token does no longer exist.')
      );
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid token. Please log in again!'));
  }
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
