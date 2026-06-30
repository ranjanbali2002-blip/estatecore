import { useAuth } from '../../context/AuthContext';
import Dropdown from '../ui/Dropdown';

export default function Header({ title, onMenu }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-white"
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 className="font-heading text-xl text-white">{title}</h1>
      </div>
      <Dropdown
        align="right"
        trigger={
          <div className="flex items-center gap-2 hover:bg-white/5 rounded-xl px-2 py-1.5 transition-colors">
            <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm text-white leading-tight">{user?.name}</div>
              <div className="text-xs text-white/40 capitalize">{user?.role}</div>
            </div>
          </div>
        }
        items={[{ label: 'Log out', danger: true, onClick: logout }]}
      />
    </header>
  );
}
