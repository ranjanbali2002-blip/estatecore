const STYLES = {
  success: { bar: 'bg-emerald-400', icon: '✓', ring: 'border-emerald-500/30' },
  error: { bar: 'bg-red-400', icon: '!', ring: 'border-red-500/30' },
  warning: { bar: 'bg-amber-400', icon: '⚠', ring: 'border-amber-500/30' },
  info: { bar: 'bg-blue-400', icon: 'i', ring: 'border-blue-500/30' },
};

export default function Toast({ type = 'info', message, onClose }) {
  const s = STYLES[type] || STYLES.info;
  return (
    <div className={`toast-in glass border ${s.ring} rounded-xl shadow-lg flex items-stretch overflow-hidden w-80 max-w-[90vw]`}>
      <div className={`w-1 ${s.bar}`} />
      <div className="flex items-center gap-3 px-4 py-3 flex-1">
        <span className={`shrink-0 w-6 h-6 rounded-full ${s.bar} text-[#0B0F1A] flex items-center justify-center text-sm font-bold`}>
          {s.icon}
        </span>
        <p className="text-sm text-white/90 flex-1">{message}</p>
        <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  );
}
