import { STATUS_COLORS } from '../../constants/statuses';

const COLORS = {
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  red: 'bg-red-500/15 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  gray: 'bg-white/10 text-white/70 border-white/20',
};

export default function Badge({ children, color, value, className = '' }) {
  const resolved = color || STATUS_COLORS[value] || 'gray';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${COLORS[resolved]} ${className}`}
    >
      {children || value}
    </span>
  );
}
