const AppError = require('../utils/AppError');

/**
 * Builds req.scope — the mandatory query filter applied to every
 * workspace-scoped DB read/write. Isolation lives HERE, not in controllers.
 *
 *   - admin : { workspaceId }
 *   - agent : { workspaceId, assignedAgentId: self }  (overridable per-module)
 *   - architect: no scope (handled separately, should not hit these routes)
 */
function enforceWorkspace(req, res, next) {
  if (!req.user) return next(AppError.unauthorized());
  if (req.user.role === 'architect') {
    req.scope = {};
    return next();
  }
  if (!req.workspace) return next(AppError.forbidden('No workspace context'));

  req.workspaceId = req.workspace._id;
  req.scope = { workspaceId: req.workspace._id };
  req.isAgent = req.user.role === 'agent';
  return next();
}

/**
 * For modules where an agent is restricted to their own records.
 * Returns a filter merged with req.scope. `field` is the ownership field.
 * Admins see the whole workspace; agents see only their own.
 */
function agentScopedFilter(req, field = 'assignedAgentId', extra = {}) {
  const base = { ...req.scope, ...extra };
  if (req.isAgent) base[field] = req.user._id;
  return base;
}

module.exports = { enforceWorkspace, agentScopedFilter };
