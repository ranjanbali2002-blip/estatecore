import { NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { navForRole } from './navItems';

export default function Sidebar({ onNavigate }) {
  const { user, workspace } = useAuth();
  const items = navForRole(user?.role, workspace);

  return (
    <aside className="h-full w-64 glass border-r border-white/10 flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <BrandLogo />
        {user?.role === 'architect' && (
          <span className="block text-xs text-accent/80 mt-1">God Mode</span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all min-h-[44px] ${
                isActive ? 'bg-accent/15 text-accent font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-white/10 text-xs text-white/30">
        Powered by EstateCore
      </div>
    </aside>
  );
}
