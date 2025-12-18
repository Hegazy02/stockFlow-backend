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
const allowedOrigins = ["http://localhost:4200", process.env.CLIENT_URL];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
};
app.use(cors(corsOptions));

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
app.use(errorHandler);

// Export app for Vercel compatibility
module.exports = app;
