/**
 * Operational error with an HTTP status, a machine code, and optional field errors.
 * The global error handler maps these to the standard response envelope.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'SERVER_ERROR', fields) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (fields) this.fields = fields;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'VALIDATION_ERROR', fields) {
    return new AppError(message, 422, code, fields);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access denied', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }
}

module.exports = AppError;
