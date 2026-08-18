const mongoose = require('mongoose');
const dns = require('dns');
const { env } = require('./env');

const connectDB = async () => {
  try {
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
    } catch {
      // Ignore if cloud environment overrides DNS settings
    }
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
