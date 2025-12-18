// Vercel serverless function handler
require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/database');

// Connect to database (Vercel will reuse connections between invocations)
let dbConnected = false;

const connectDBOnce = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('Database connected for Vercel function');
    } catch (error) {
      console.error('Database connection error:', error);
      // Don't exit in serverless - let the request continue
    }
  }
};

// Initialize database connection
connectDBOnce().catch(console.error);

// Export handler for Vercel
module.exports = app;

