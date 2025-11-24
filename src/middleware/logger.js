/**
 * Request logger middleware
 * Logs HTTP method, URL, and response time for each request
 */
const logger = (req, res, next) => {
  const startTime = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = logger;
