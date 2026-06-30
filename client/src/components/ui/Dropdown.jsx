import { useEffect, useRef, useState } from 'react';

/**
 * Accessible dropdown menu.
 * trigger: node | items: [{ label, onClick, danger }]
 */
export default function Dropdown({ trigger, items = [], align = 'right' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 min-w-[160px] glass rounded-xl py-1 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((it, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onClick?.();
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                it.danger ? 'text-red-300' : 'text-white/85'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
