require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

// Check if running on Vercel (serverless)
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

// Get port from environment or use default
const PORT = process.env.PORT || 3000;

/**
 * Start the server (only for local development)
 */
const startServer = async () => {
  try {
    // Connect to MongoDB before starting server
    await connectDB();

    // Start Express server on configured port
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Closing server gracefully...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// For Vercel: export the app directly (serverless function)
// For local: start the server normally
if (isVercel) {
  // Connect to database (Vercel will reuse connections)
  let dbConnected = false;
  const connectDBOnce = async () => {
    if (!dbConnected) {
      try {
        await connectDB();
        dbConnected = true;
      } catch (error) {
        console.error('Database connection error:', error);
      }
    }
  };
  connectDBOnce().catch(console.error);
  
  // Export app for Vercel
  module.exports = app;
} else {
  // Start the server for local development
  startServer();
}
