import { useState } from 'react';

export default function Tooltip({ content, children, position = 'top' }) {
  const [show, setShow] = useState(false);
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <span
          className={`absolute z-50 px-2.5 py-1.5 rounded-lg bg-black/90 border border-white/10 text-xs text-white whitespace-nowrap shadow-lg ${pos[position]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
