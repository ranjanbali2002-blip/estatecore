/** Wraps an async route handler so rejections are forwarded to next(). */
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
