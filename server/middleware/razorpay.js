const AppError = require('../utils/AppError');

/** Returns 503 when payments are disabled. Guards all billing action routes. */
function requirePaymentsEnabled(req, res, next) {
  if (process.env.PAYMENTS_ENABLED !== 'true') {
    return next(new AppError('Payments are not currently enabled', 503, 'PAYMENTS_DISABLED'));
  }
  return next();
}

module.exports = { requirePaymentsEnabled };
