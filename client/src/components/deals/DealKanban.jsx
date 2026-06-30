import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DealCard from './DealCard';
import { DEAL_STAGES } from '../../constants/statuses';
import { formatINRCompact } from '../../utils/formatINR';

const TINTS = {
  'Closed Won': 'bg-emerald-500/5',
  'Closed Lost': 'bg-red-500/5 opacity-80',
};

export default function DealKanban({ deals, onMove, onOpen, onAdd }) {
  const byStage = DEAL_STAGES.reduce((acc, s) => {
    acc[s] = deals.filter((d) => d.stage === s);
    return acc;
  }, {});

  function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    onMove(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => {
          const items = byStage[stage];
          const total = items.reduce((s, d) => s + (d.value || 0), 0);
          return (
            <Droppable droppableId={stage} key={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`shrink-0 w-72 glass rounded-xl p-3 ${TINTS[stage] || ''} ${snapshot.isDraggingOver ? 'ring-1 ring-accent/40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-sm font-medium text-white">{stage}</span>
                    <span className="text-xs text-white/40">{items.length}</span>
                  </div>
                  <div className="text-xs text-accent px-1 mb-3">{formatINRCompact(total)}</div>
                  <button onClick={() => onAdd(stage)} className="w-full text-xs text-white/40 hover:text-white border border-dashed border-white/10 rounded-lg py-1.5 mb-2">
                    + Add deal
                  </button>
                  <div className="space-y-2 min-h-[40px]">
                    {items.map((deal, idx) => (
                      <Draggable draggableId={deal._id} index={idx} key={deal._id}>
                        {(prov, snap) => (
                          <DealCard
                            deal={deal}
                            onClick={() => onOpen(deal._id)}
                            innerRef={prov.innerRef}
                            draggableProps={prov.draggableProps}
                            dragHandleProps={prov.dragHandleProps}
                            dragging={snap.isDragging}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
