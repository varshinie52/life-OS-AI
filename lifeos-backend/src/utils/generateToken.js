const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: env.ACCESS_TOKEN_EXPIRY,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRY,
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
