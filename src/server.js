require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

// Get port from environment or use default
const PORT = process.env.PORT || 3000;

/**
 * Start the server
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

// Start the server
startServer();
