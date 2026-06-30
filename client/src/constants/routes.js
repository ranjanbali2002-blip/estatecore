export const ROUTES = {
  // public
  landing: '/',
  pricing: '/pricing',
  login: '/login',
  portal: (token = ':token') => `/portal/${token}`,
  // architect
  archDashboard: '/architect/dashboard',
  archWorkspaces: '/architect/workspaces',
  archBilling: '/architect/billing',
  // admin/agent shared
  dashboard: '/dashboard',
  leads: '/leads',
  deals: '/deals',
  properties: '/properties',
  tasks: '/tasks',
  analytics: '/analytics',
  leaderboard: '/leaderboard',
  // admin only
  agents: '/agents',
  brandSettings: '/brand-settings',
  billing: '/billing',
};
