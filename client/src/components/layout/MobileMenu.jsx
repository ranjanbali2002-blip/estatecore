import Sidebar from './Sidebar';

export default function MobileMenu({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-64 h-full animate-[toast-in_0.2s_ease-out]">
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
