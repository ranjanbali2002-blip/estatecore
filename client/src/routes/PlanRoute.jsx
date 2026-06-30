import { useAuth } from '../context/AuthContext';
import { hasFeature, requiredPlanName, minPlanForFeature } from '../utils/planGates';
import PageWrapper from '../components/layout/PageWrapper';
import PlanGateModal from '../components/ui/PlanGateModal';
import { useState } from 'react';
import EmptyState from '../components/ui/EmptyState';

/**
 * Gates a whole page behind a feature. Shows a blurred placeholder with
 * an upgrade CTA (PlanGateModal) rather than hiding the page entirely.
 */
export default function PlanRoute({ feature, title, children }) {
  const { workspace } = useAuth();
  const [showModal, setShowModal] = useState(true);

  if (hasFeature(workspace, feature)) return children;

  return (
    <PageWrapper title={title}>
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none opacity-60">
          <EmptyState
            icon="🔒"
            title={`${requiredPlanName(feature)} feature`}
            subtext="Upgrade your plan to access this section."
          />
        </div>
        {showModal && (
          <PlanGateModal
            feature={feature}
            requiredPlan={minPlanForFeature(feature)}
            onClose={() => setShowModal(false)}
          />
        )}
        {!showModal && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-xl bg-accent text-[#0B0F1A] font-semibold">
              View upgrade options
            </button>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
