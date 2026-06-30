/** Returns the plan that drives feature gates (trial plan during active trial). */
export function getEffectivePlan(workspace) {
  if (!workspace) return 'starter';
  if (workspace.effectivePlan) return workspace.effectivePlan;
  if (workspace.trial?.enabled && workspace.trial.expiresAt && Date.now() < new Date(workspace.trial.expiresAt).getTime()) {
    return workspace.trial.plan;
  }
  return workspace.plan || 'starter';
}

export default getEffectivePlan;
