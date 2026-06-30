export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-white/70 mb-1.5">
      {children}
    </label>
  );
}

const baseInput =
  'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 focus:ring-2 ring-accent outline-none transition-all min-h-[44px]';

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <input className={`${baseInput} ${error ? 'border-red-500/60' : ''}`} {...props} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', rows = 3, ...props }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <textarea rows={rows} className={`${baseInput} resize-none ${error ? 'border-red-500/60' : ''}`} {...props} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, error, options = [], className = '', children, ...props }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <select className={`${baseInput} ${error ? 'border-red-500/60' : ''}`} {...props}>
        {children ||
          options.map((o) =>
            typeof o === 'string' ? (
              <option key={o} value={o} className="bg-card">
                {o}
              </option>
            ) : (
              <option key={o.value} value={o.value} className="bg-card">
                {o.label}
              </option>
            )
          )}
      </select>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
