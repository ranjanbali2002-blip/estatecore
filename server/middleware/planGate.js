const AppError = require('../utils/AppError');
const { planHasFeature, minPlanForFeature } = require('../utils/plans');

/**
 * Gates a route behind a plan feature, using the workspace's EFFECTIVE plan
 * (trial plan during an active trial). Architect always passes.
 */
function checkPlanFeature(feature) {
  return (req, res, next) => {
    if (req.user?.role === 'architect') return next();
    if (!req.workspace) return next(AppError.forbidden('No workspace context'));

    const effectivePlan = req.workspace.getEffectivePlan();
    if (!planHasFeature(effectivePlan, feature)) {
      return next(
        new AppError(
          'Your current plan does not include this feature',
          403,
          'PLAN_REQUIRED',
          { feature, requiredPlan: minPlanForFeature(feature) }
        )
      );
    }
    return next();
  };
}

module.exports = { checkPlanFeature };
