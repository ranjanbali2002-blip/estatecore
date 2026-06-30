import { useEffect } from 'react';

export default function Drawer({ open = true, title, subtitle, onClose, children, headerExtra }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="glass h-full w-full sm:w-[480px] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-heading text-xl text-white">{title}</h2>
            {subtitle && <div className="text-sm text-white/50 mt-0.5">{subtitle}</div>}
            {headerExtra}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-5 flex-1">{children}</div>
      </div>
    </div>
  );
}
