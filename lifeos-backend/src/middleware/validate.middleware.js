const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().forEach(err => extractedErrors.push({ [err.path]: err.msg }));

  throw new ApiError(400, 'Validation Error', extractedErrors);
};

module.exports = { validate };
