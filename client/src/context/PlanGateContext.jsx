import { createContext, useCallback, useContext, useState } from 'react';
import PlanGateModal from '../components/ui/PlanGateModal';

const PlanGateContext = createContext(null);

export function PlanGateProvider({ children }) {
  const [gate, setGate] = useState(null); // { feature, requiredPlan }

  const openPlanGate = useCallback((feature, requiredPlan) => {
    setGate({ feature, requiredPlan });
  }, []);

  const close = useCallback(() => setGate(null), []);

  return (
    <PlanGateContext.Provider value={{ openPlanGate }}>
      {children}
      {gate && <PlanGateModal feature={gate.feature} requiredPlan={gate.requiredPlan} onClose={close} />}
    </PlanGateContext.Provider>
  );
}

export function usePlanGate() {
  const ctx = useContext(PlanGateContext);
  if (!ctx) throw new Error('usePlanGate must be used within PlanGateProvider');
  return ctx;
}
