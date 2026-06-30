const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Blocks agent creation when the workspace is at its agent limit.
 * Run before POST /api/agents.
 */
const checkAgentLimit = asyncHandler(async (req, res, next) => {
  const ws = req.workspace;
  if (!ws) throw AppError.forbidden('No workspace context');

  const count = await User.countDocuments({
    workspaceId: ws._id,
    role: 'agent',
  });

  if (count >= ws.agentLimit) {
    throw new AppError(
      'You have reached your plan agent limit',
      403,
      'PLAN_REQUIRED',
      { feature: 'more_agents', requiredPlan: 'pro', current: count, limit: ws.agentLimit }
    );
  }
  return next();
});

module.exports = { checkAgentLimit };
