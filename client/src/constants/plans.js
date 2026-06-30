// Mirror of server/utils/plans.js for client-side gating + pricing UI.
export const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    agentLimit: 2,
    priceMonthly: 999,
    tagline: 'For solo agents getting started',
    features: ['leads', 'deals', 'properties', 'tasks', 'basic_analytics', 'csv_export'],
    featureList: [
      'Up to 2 agents',
      'Lead & deal management',
      'Property listings',
      'Task tracking',
      'Basic analytics',
      'CSV export',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    agentLimit: 10,
    priceMonthly: 2999,
    recommended: true,
    tagline: 'For growing real estate teams',
    features: [
      'leads', 'deals', 'properties', 'tasks', 'basic_analytics',
      'csv_export', 'csv_import', 'advanced_analytics', 'whatsapp_templates', 'subdomain',
    ],
    featureList: [
      'Up to 10 agents',
      'Everything in Starter',
      'CSV import',
      'Advanced analytics & funnels',
      'WhatsApp follow-up templates',
      'Custom subdomain',
    ],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    agentLimit: 50,
    priceMonthly: 7999,
    tagline: 'For brokerages that need it all',
    features: [
      'leads', 'deals', 'properties', 'tasks', 'basic_analytics',
      'csv_export', 'csv_import', 'advanced_analytics', 'whatsapp_templates',
      'subdomain', 'client_portal', 'leaderboard', 'revenue_forecast',
    ],
    featureList: [
      'Up to 50 agents',
      'Everything in Pro',
      'Client portal for buyers',
      'Agent leaderboard',
      'Revenue forecasting',
      'Priority support',
    ],
  },
};

export const PLAN_ORDER = ['starter', 'pro', 'enterprise'];

export function planHasFeature(planKey, feature) {
  return PLANS[planKey]?.features.includes(feature) ?? false;
}

export function minPlanForFeature(feature) {
  return PLAN_ORDER.find((p) => planHasFeature(p, feature)) || 'enterprise';
}
