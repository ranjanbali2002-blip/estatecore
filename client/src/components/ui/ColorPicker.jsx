const SWATCHES = [
  '#C9A84C', '#1E88E5', '#E65100', '#43A047', '#8E24AA',
  '#E53935', '#00ACC1', '#3949AB', '#F4511E', '#6D4C41',
];

export default function ColorPicker({ value = '#C9A84C', onChange }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg bg-transparent border border-white/10 cursor-pointer"
          aria-label="Pick color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase focus:ring-2 ring-accent outline-none"
          maxLength={7}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
              value?.toLowerCase() === c.toLowerCase() ? 'border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Select ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
