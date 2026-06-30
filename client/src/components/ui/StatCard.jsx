export default function StatCard({ icon, label, value, trend, hint }) {
  const trendUp = trend?.dir === 'up';
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm">{label}</p>
          <p className="font-heading text-2xl sm:text-3xl text-white mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center text-xl">
            {icon}
          </div>
        )}
      </div>
      {(trend || hint) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                trendUp ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
              }`}
            >
              {trendUp ? '▲' : '▼'} {trend.value}
            </span>
          )}
          {hint && <span className="text-xs text-white/40">{hint}</span>}
        </div>
      )}
    </div>
  );
}
