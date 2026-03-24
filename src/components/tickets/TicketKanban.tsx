import React from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TicketSummary, TicketStatus, TicketPriority } from '@/models/Ticket';
import { Clock, User, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';
import { parseISO, differenceInSeconds } from 'date-fns';

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: 'bg-[#DC2626]',
  High: 'bg-[#F97316]',
  Medium: 'bg-[#EAB308]',
  Low: 'bg-[#22C55E]'
};


// TicketKanbanProps is defined below near the main component

const KanbanCard = ({ ticket, isOverlay = false }: { ticket: TicketSummary, isOverlay?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: ticket.id,
    data: { type: 'Ticket', ticket }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1
  };

  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return;
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [ticket.status]);

  const diff = differenceInSeconds(parseISO(ticket.slaDeadline), now);
  const isBreached = diff <= 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative bg-white p-5 rounded-2xl border border-border/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing",
        isOverlay && "shadow-2xl ring-2 ring-primary/20 scale-105 active:cursor-grabbing",
        isBreached && "border-danger/10"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
           <div className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[ticket.priority])} />
           <span className="text-[10px] font-mono font-black text-primary tracking-tighter">{ticket.ticketCode}</span>
        </div>
        {!isBreached ? (
           <div className="px-2 py-0.5 bg-bg rounded-lg text-muted">
              <Clock size={10} />
           </div>
        ) : (
           <div className="px-2 py-0.5 bg-danger/10 text-danger rounded-lg animate-pulse">
              <Clock size={10} />
           </div>
        )}
      </div>

      <h4 className="text-small font-bold text-primary mb-5 line-clamp-2 leading-tight group-hover:text-primary-hover">{ticket.title}</h4>

      <div className="flex items-center justify-between pt-4 border-t border-border/5">
         <div className="flex items-center gap-2">
            {ticket.assignedToAvatar ? (
               <img src={ticket.assignedToAvatar} className="w-6 h-6 rounded-lg object-cover border border-border/10" alt="" />
            ) : (
               <div className="w-6 h-6 rounded-lg bg-bg flex items-center justify-center text-muted">
                  <User size={12} />
               </div>
            )}
            <span className="text-[10px] font-bold text-muted truncate max-w-[80px]">
               {ticket.assignedToName || 'Unassigned'}
            </span>
         </div>
         
         <div className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            isBreached ? "text-danger" : "text-muted"
         )}>
            SLA: {isBreached ? 'BREACH' : 'OK'}
         </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ status, tickets, id }: { status: TicketStatus, tickets: TicketSummary[], id: string }) => {
  const { setNodeRef } = useSortable({
     id,
     data: { type: 'Column', status }
  });

  return (
    <div className="flex-1 min-w-[300px] flex flex-col h-full bg-bg/10 rounded-[40px] border border-border/5 p-4 lg:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-2">
         <div className="flex items-center gap-3">
            <h3 className="text-[12px] font-black uppercase tracking-[3px] text-primary">{status}</h3>
            <span className="bg-white/50 text-[10px] font-black text-primary px-2.5 py-0.5 rounded-full border border-border/10">
               {tickets.length}
            </span>
         </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-4 custom-scrollbar px-1 pb-4 min-h-[300px]">
         <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tickets.map(ticket => (
               <KanbanCard key={ticket.id} ticket={ticket} />
            ))}
         </SortableContext>
      </div>
    </div>
  );
};

interface TicketKanbanProps {
  tickets: TicketSummary[];
  onStatusChange: (id: string, newStatus: TicketStatus) => void;
  onTicketClick: (id: string) => void;
  columns?: TicketStatus[];
}

export const TicketKanban = ({ 
  tickets, 
  onStatusChange, 
  onTicketClick,
  columns = ['Open', 'InProgress', 'Resolved', 'Closed']
}: TicketKanbanProps) => {
  const [activeTicket, setActiveTicket] = React.useState<TicketSummary | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find(t => t.id === active.id);
    if (ticket) setActiveTicket(ticket);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Is it dragging over a column?
    if (columns.includes(overId as TicketStatus)) {
       onStatusChange(activeId, overId as TicketStatus);
       return;
    }

    // Is it dragging over another ticket?
    const overTicket = tickets.find(t => t.id === overId);
    if (overTicket && overTicket.status !== activeTicket?.status) {
       onStatusChange(activeId, overTicket.status);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 min-h-[70vh] items-start">
        {columns.map(status => (
           <KanbanColumn 
             key={status} 
             id={status}
             status={status} 
             tickets={tickets.filter(t => t.status === status)}
           />
        ))}
      </div>

      <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } }
          })
      }}>
        {activeTicket ? <KanbanCard ticket={activeTicket} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};
