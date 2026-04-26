import React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User } from 'lucide-react';

import {
  getTicketPriorityLabel,
  getTicketStatusLabel,
  isTicketReferenceOverdue,
} from '@/features/tickets/ticketPresentation';
import type { TicketPriority, TicketStatus, TicketSummary } from '@/models/Ticket';
import { cn } from '@/utils';

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: 'bg-[#DC2626]',
  High: 'bg-[#F97316]',
  Medium: 'bg-[#EAB308]',
  Low: 'bg-[#22C55E]',
};

const DEFAULT_COLUMNS: TicketStatus[] = ['Open', 'InProgress', 'PendingConfirmation', 'Resolved', 'Closed'];

const KanbanCard = ({
  ticket,
  isOverlay = false,
  onOpen,
}: {
  ticket: TicketSummary;
  isOverlay?: boolean;
  onOpen?: (id: string) => void;
}) => {
  const overdue = isTicketReferenceOverdue(ticket);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: 'ticket', ticket },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-ticket-id={ticket.id}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onOpen?.(ticket.id)}
      className={cn(
        'rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg',
        overdue ? 'border-red-200' : 'border-slate-200',
        isOverlay && 'scale-[1.02] shadow-xl ring-2 ring-primary/20'
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', PRIORITY_COLORS[ticket.priority])} />
          <span className="font-mono text-[11px] font-black text-primary">{ticket.ticketCode}</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
          {getTicketPriorityLabel(ticket.priority)}
        </span>
      </div>

      <h4 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{ticket.title}</h4>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <div className="flex min-w-0 items-center gap-2 text-slate-500">
            {ticket.assignedToAvatar ? (
              <img src={ticket.assignedToAvatar} className="h-6 w-6 rounded-lg object-cover" alt="" />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <User size={12} />
              </span>
            )}
            <span className="truncate font-medium">{ticket.assignedToName || 'Chưa phân công'}</span>
          </div>

          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold',
              overdue ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
            )}
          >
            <Clock size={10} />
            <span>{overdue ? 'Quá hạn tham chiếu' : 'Trong hạn tham chiếu'}</span>
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {getTicketStatusLabel(ticket.status)}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen?.(ticket.id);
          }}
          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 transition hover:bg-slate-50"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
};

const KanbanColumn = ({
  status,
  tickets,
  onOpen,
}: {
  status: TicketStatus;
  tickets: TicketSummary[];
  onOpen: (id: string) => void;
}) => {
  const { setNodeRef } = useSortable({
    id: status,
    data: { type: 'column', status },
  });

  return (
    <div className="flex min-w-[300px] flex-1 flex-col rounded-[32px] border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3 px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-700">
          {getTicketStatusLabel(status)}
        </h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
          {tickets.length}
        </span>
      </div>

      <div ref={setNodeRef} className="min-h-[220px] flex-1 space-y-3 overflow-y-auto pb-2">
        <SortableContext items={tickets.map((ticket) => ticket.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <KanbanCard key={ticket.id} ticket={ticket} onOpen={onOpen} />
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
  columns = DEFAULT_COLUMNS,
}: TicketKanbanProps) => {
  const [activeTicket, setActiveTicket] = React.useState<TicketSummary | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((item) => item.id === event.active.id);
    if (ticket) setActiveTicket(ticket);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    if (columns.includes(overId as TicketStatus)) {
      onStatusChange(activeId, overId as TicketStatus);
      return;
    }

    const overTicket = tickets.find((ticket) => ticket.id === overId);
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
      <div className="flex min-h-[70vh] items-start gap-5 overflow-x-auto pb-6">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={tickets.filter((ticket) => ticket.status === status)}
            onOpen={onTicketClick}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } },
          }),
        }}
      >
        {activeTicket ? <KanbanCard ticket={activeTicket} isOverlay onOpen={onTicketClick} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
