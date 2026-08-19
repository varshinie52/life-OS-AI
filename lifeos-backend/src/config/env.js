require('dotenv').config();

const env = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/lifeos',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'fallback_access_secret',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  SMTP_HOST: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
  SMTP_PORT: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.SMTP_USER || 'LifeOS <noreply@lifeos.app>',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

module.exports = { env };

