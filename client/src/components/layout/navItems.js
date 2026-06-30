import { hasFeature } from '../../utils/planGates';

export function navForRole(role, workspace) {
  if (role === 'architect') {
    return [
      { to: '/architect/dashboard', label: 'Dashboard', icon: '📊' },
      { to: '/architect/workspaces', label: 'Workspaces', icon: '🏢' },
      { to: '/architect/billing', label: 'Billing', icon: '💳' },
    ];
  }

  const base = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/leads', label: 'Leads', icon: '👥' },
    { to: '/deals', label: 'Deals', icon: '🤝' },
    { to: '/properties', label: 'Properties', icon: '🏠' },
    { to: '/tasks', label: 'Tasks', icon: '✓' },
  ];

  if (role === 'agent') return base;

  // admin
  const admin = [...base, { to: '/analytics', label: 'Analytics', icon: '📈' }];
  if (hasFeature(workspace, 'leaderboard')) {
    admin.push({ to: '/leaderboard', label: 'Leaderboard', icon: '🏆' });
  }
  admin.push(
    { to: '/agents', label: 'Agents', icon: '🧑‍💼' },
    { to: '/brand-settings', label: 'Brand', icon: '🎨' },
    { to: '/billing', label: 'Billing', icon: '💳' }
  );
  return admin;
}
