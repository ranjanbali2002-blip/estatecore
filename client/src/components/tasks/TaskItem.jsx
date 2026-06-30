import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatDate';

export default function TaskItem({ task, onToggle, onOpen }) {
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = task.status === 'Pending' && due < today;
  const isToday = task.status === 'Pending' && due.toDateString() === today.toDateString();
  const border = isOverdue ? 'border-l-red-500' : isToday ? 'border-l-amber-500' : 'border-l-transparent';

  return (
    <div className={`glass rounded-xl border-l-4 ${border} p-4 flex items-center gap-3`}>
      <input
        type="checkbox"
        checked={task.status === 'Completed'}
        onChange={(e) => { e.stopPropagation(); onToggle(task); }}
        className="w-5 h-5 accent-current shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
      <button onClick={() => onOpen(task)} className="flex-1 text-left min-w-0">
        <div className={`text-sm ${task.status === 'Completed' ? 'line-through text-white/40' : 'text-white'}`}>{task.title}</div>
        <div className="text-xs text-white/40 mt-0.5 flex flex-wrap gap-x-2">
          {task.leadId?.name && <span>{task.leadId.name}</span>}
          {task.assignedAgentId?.name && <span>· {task.assignedAgentId.name}</span>}
          <span className={isOverdue ? 'text-red-400' : ''}>· {formatDate(task.dueDate)}</span>
        </div>
      </button>
      <div className="flex items-center gap-2 shrink-0">
        {isOverdue && <Badge color="red">Overdue</Badge>}
        {isToday && <Badge color="amber">Due Today</Badge>}
        <Badge value={task.priority} />
      </div>
    </div>
  );
}
