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
// This allows all origins by default (configure in production if needed)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

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
