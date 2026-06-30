import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import TrialBanner from '../ui/TrialBanner';
import TrialExpiredScreen from './TrialExpiredScreen';
import WorkspaceInactiveScreen from './WorkspaceInactiveScreen';
import { useAuth } from '../../context/AuthContext';

export default function PageWrapper({ title, children, actions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { gate } = useAuth();

  if (gate?.code === 'TRIAL_EXPIRED') return <TrialExpiredScreen />;
  if (gate?.code === 'WORKSPACE_INACTIVE') return <WorkspaceInactiveScreen />;

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TrialBanner />
        <Header title={title} onMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
            {actions && <div className="flex justify-end mb-4">{actions}</div>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
