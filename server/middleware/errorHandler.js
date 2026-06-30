const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = new AppError(`${field} already exists`, 422, 'VALIDATION_ERROR', [
      { field, message: `${field} already in use` },
    ]);
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const fields = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new AppError('Validation failed', 422, 'VALIDATION_ERROR', fields);
  }

  // Mongoose cast (bad ObjectId etc.)
  if (err.name === 'CastError') {
    error = new AppError('Invalid identifier', 422, 'VALIDATION_ERROR');
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'SERVER_ERROR';

  // Always log
  const logPayload = {
    code,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    message: error.message,
  };
  if (statusCode >= 500) {
    logger.error('Unhandled error', { ...logPayload, stack: err.stack });
  } else {
    logger.warn('Handled error', logPayload);
  }

  const body = {
    success: false,
    error: {
      code,
      message:
        statusCode >= 500 && process.env.NODE_ENV === 'production'
          ? 'Something went wrong. Please try again.'
          : error.message,
    },
  };
  if (error.fields) body.error.fields = error.fields;

  res.status(statusCode).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.originalUrl} not found` },
  });
}

module.exports = { errorHandler, notFoundHandler };
