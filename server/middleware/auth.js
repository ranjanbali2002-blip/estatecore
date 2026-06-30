const mongoose = require('mongoose');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAnyAccessToken } = require('../utils/tokens');

/**
 * Authenticates the request via Bearer access token.
 * Attaches req.user (Mongoose doc) and, for admin/agent, req.workspace.
 * Enforces: user active, workspace status (trial / inactive).
 */
const authenticateJWT = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw AppError.unauthorized('Missing access token');

  let payload;
  try {
    payload = verifyAnyAccessToken(token);
  } catch (err) {
    throw AppError.unauthorized('Invalid or expired access token');
  }

  if (!mongoose.Types.ObjectId.isValid(payload.sub)) {
    throw AppError.unauthorized('Invalid token subject');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw AppError.unauthorized('User no longer exists');
  if (!user.isActive) throw AppError.forbidden('Your account has been deactivated');

  req.user = user;

  // Architect bypasses workspace checks entirely
  if (user.role === 'architect') {
    return next();
  }

  // admin/agent must have a workspace
  const workspace = await Workspace.findById(user.workspaceId);
  if (!workspace) throw AppError.forbidden('Workspace not found');

  const effectiveStatus = workspace.getEffectiveStatus();
  if (effectiveStatus === 'trial_expired') {
    throw AppError.forbidden('Your free trial has ended', 'TRIAL_EXPIRED');
  }
  if (effectiveStatus === 'inactive' || effectiveStatus === 'payment_failed') {
    throw AppError.forbidden('Workspace is not active', 'WORKSPACE_INACTIVE');
  }

  req.workspace = workspace;
  return next();
});

/** Restricts a route to the given roles. */
function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { authenticateJWT, requireRole };
