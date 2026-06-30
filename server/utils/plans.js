/**
 * Central plan definitions used for feature gating and agent limits.
 * Mirrored on the frontend in /client/src/constants/plans.js
 */
const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    agentLimit: 2,
    priceMonthly: 999,
    features: ['leads', 'deals', 'properties', 'tasks', 'basic_analytics', 'csv_export'],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    agentLimit: 10,
    priceMonthly: 2999,
    features: [
      'leads',
      'deals',
      'properties',
      'tasks',
      'basic_analytics',
      'csv_export',
      'csv_import',
      'advanced_analytics',
      'whatsapp_templates',
      'subdomain',
    ],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    agentLimit: 50,
    priceMonthly: 7999,
    features: [
      'leads',
      'deals',
      'properties',
      'tasks',
      'basic_analytics',
      'csv_export',
      'csv_import',
      'advanced_analytics',
      'whatsapp_templates',
      'subdomain',
      'client_portal',
      'leaderboard',
      'revenue_forecast',
    ],
  },
};

const PLAN_ORDER = ['starter', 'pro', 'enterprise'];

function getAgentLimit(planKey) {
  return PLANS[planKey]?.agentLimit ?? PLANS.starter.agentLimit;
}

function planHasFeature(planKey, feature) {
  return PLANS[planKey]?.features.includes(feature) ?? false;
}

/** Lowest plan that includes a given feature, for "requiredPlan" hints. */
function minPlanForFeature(feature) {
  return PLAN_ORDER.find((p) => planHasFeature(p, feature)) || 'enterprise';
}

module.exports = { PLANS, PLAN_ORDER, getAgentLimit, planHasFeature, minPlanForFeature };
