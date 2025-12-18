const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

// Initialize Express application
const app = express();

// Apply CORS middleware for cross-origin requests
app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'https://your-frontend-domain.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);
app.options('*', cors());

// Apply JSON body parser with 10mb limit
app.use(express.json({ limit: '10mb' }));

// Apply URL-encoded body parser with extended syntax
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory (for API documentation)
app.use(express.static(path.join(__dirname, '../public')));

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
