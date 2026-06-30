import { useEffect, useRef } from 'react';

export default function Modal({ open = true, title, onClose, children, footer, size = 'md' }) {
  const ref = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    // focus trap entry
    const first = ref.current?.querySelector(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`glass w-full ${sizes[size]} sm:rounded-xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-card z-10">
            <h2 className="font-heading text-xl text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
