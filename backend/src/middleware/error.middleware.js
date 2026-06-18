// middleware/error.middleware.js
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL errors
  if (err.code === '23505') { statusCode = 409; message = 'A record with this information already exists.'; }
  if (err.code === '23503') { statusCode = 400; message = 'Referenced record does not exist.'; }
  if (err.code === '23514') { statusCode = 400; message = 'Data validation failed. Check amounts and constraints.'; }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token. Please log in again.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired. Please log in again.'; }

  if (!err.isOperational) {
    logger.error(`Unexpected error: ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
