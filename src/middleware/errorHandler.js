/**
 * Global error handler middleware
 * Centralized error processing with environment-aware responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error details with stack trace
  console.error('Error occurred:');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Prepare error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal server error'
  };

  // Include detailed error information only in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error = err.message;
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
