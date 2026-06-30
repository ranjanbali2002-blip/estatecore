import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Badge from '../ui/Badge';
import { LEAD_STATUSES } from '../../constants/statuses';
import { formatINRCompact } from '../../utils/formatINR';

export default function LeadKanban({ leads, onMove, onOpen }) {
  const byStatus = LEAD_STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.status === s);
    return acc;
  }, {});

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    onMove(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_STATUSES.map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`shrink-0 w-72 glass rounded-xl p-3 ${snapshot.isDraggingOver ? 'ring-1 ring-accent/40' : ''}`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-sm font-medium text-white">{status}</span>
                  <Badge color="gray">{byStatus[status].length}</Badge>
                </div>
                <div className="space-y-2 min-h-[40px]">
                  {byStatus[status].map((lead, idx) => (
                    <Draggable draggableId={lead._id} index={idx} key={lead._id}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          onClick={() => onOpen(lead)}
                          className={`glass rounded-xl p-3 cursor-pointer hover:ring-1 ring-accent/30 ${snap.isDragging ? 'ring-2 ring-accent' : ''}`}
                        >
                          <div className="text-sm text-white font-medium">{lead.name}</div>
                          <div className="text-xs text-white/40 mt-0.5">{lead.phone || '—'}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-accent">{formatINRCompact(lead.budget)}</span>
                            <Badge color="blue">{lead.source}</Badge>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
