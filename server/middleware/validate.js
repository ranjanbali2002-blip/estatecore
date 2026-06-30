const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/** Collects express-validator results into a 422 with field errors. */
function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const fields = result.array().map((e) => ({
    field: e.path || e.param,
    message: e.msg,
  }));
  return next(AppError.badRequest('Validation failed', 'VALIDATION_ERROR', fields));
}

/** Validates that the given route param(s) are valid ObjectIds. */
function validateObjectId(...params) {
  const names = params.length ? params : ['id'];
  return (req, res, next) => {
    for (const name of names) {
      const val = req.params[name];
      if (val !== undefined && !mongoose.Types.ObjectId.isValid(val)) {
        return next(AppError.badRequest(`Invalid id: ${name}`, 'VALIDATION_ERROR'));
      }
    }
    return next();
  };
}

module.exports = { validateRequest, validateObjectId };
