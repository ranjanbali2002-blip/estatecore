const logger = require('../utils/logger');

/** Logs method, path, status, and response time for every request. */
module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
    });
  });
  next();
};
