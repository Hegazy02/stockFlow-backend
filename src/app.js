const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
require("dotenv").config();

// Initialize Express application
const app = express();

// Apply CORS middleware for cross-origin requests
// Configure CORS to work properly with Vercel serverless functions
const corsOptions = {
  origin: '*', // Allow all origins (use specific origins in production)
  credentials: false, // Set to true if you need to send cookies (cannot use '*' with credentials)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors());


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Apply custom logger middleware
app.use(logger);

// Mount API routes at /api prefix
app.use('/api', routes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Apply global error handler middleware
// app.use(errorHandler);

// Export app for Vercel compatibility
module.exports = app;
