const AppError = require('../utils/AppError');

/** Returns 503 when the Meta integration is not enabled. Guards connect routes. */
function requireMetaEnabled(req, res, next) {
  if (process.env.META_ENABLED !== 'true') {
    return next(new AppError('Meta integration is not currently enabled', 503, 'META_DISABLED'));
  }
  return next();
}

module.exports = { requireMetaEnabled };
