import { planHasFeature, minPlanForFeature, PLANS } from '../constants/plans';
import getEffectivePlan from './getEffectivePlan';

export function hasFeature(workspace, feature) {
  return planHasFeature(getEffectivePlan(workspace), feature);
}

export function requiredPlanName(feature) {
  return PLANS[minPlanForFeature(feature)]?.name || 'Pro';
}

export { minPlanForFeature };
