import { formatINRCompact } from '../../utils/formatINR';
import { daysUntil } from '../../utils/timeAgo';

export default function DealCard({ deal, onClick, dragHandleProps, innerRef, draggableProps, dragging }) {
  const days = deal.expectedCloseDate ? daysUntil(deal.expectedCloseDate) : null;
  const dateColor = days == null ? 'text-white/40' : days < 0 ? 'text-red-400' : days <= 7 ? 'text-amber-400' : 'text-white/40';
  const initials = (deal.assignedAgentId?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      onClick={onClick}
      className={`glass rounded-xl p-3 cursor-pointer hover:ring-1 ring-accent/30 ${dragging ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-white font-medium leading-snug">{deal.title}</div>
        {deal.clientPortalEnabled && <span title="Client portal enabled">🔗</span>}
      </div>
      {deal.leadId?.name && <div className="text-xs text-white/40 mt-0.5">{deal.leadId.name}</div>}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-accent font-semibold">{formatINRCompact(deal.value)}</span>
        <span className="w-6 h-6 rounded-full bg-white/10 text-white/70 text-[10px] flex items-center justify-center">{initials}</span>
      </div>
      <div className="mt-1.5 text-[11px] text-white/30">Comm. {formatINRCompact(deal.commission)}</div>
      {deal.expectedCloseDate && (
        <div className={`text-[11px] mt-1 ${dateColor}`}>
          {days < 0 ? `${Math.abs(days)}d overdue` : `Closes in ${days}d`}
        </div>
      )}
    </div>
  );
}
