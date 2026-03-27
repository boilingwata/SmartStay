import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, Search, LayoutGrid, List, Building, AlertCircle, 
  MapPin, User, Clock, ChevronRight, MoreVertical, 
  Download, Filter, ArrowRight 
} from 'lucide-react';
import { ticketService } from '@/services/ticketService';
import { buildingService } from '@/services/buildingService';
import { TicketSummary, TicketStatus, TicketPriority, TicketType } from '@/models/Ticket';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';
import { formatDistanceToNow, isAfter, parseISO, differenceInSeconds } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { TicketKanban } from '@/components/tickets/TicketKanban';
import { TicketFormModal } from '@/components/forms/TicketFormModal';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import StaffMyTickets from '@/views/admin/StaffMyTickets';

const Spinner = () => (
  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
);

// 4.1.3 Priority Color Dots
const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: 'bg-[#DC2626]',
  High: 'bg-[#F97316]',
  Medium: 'bg-[#EAB308]',
  Low: 'bg-[#22C55E]'
};

const TYPE_ICONS: Record<TicketType, any> = {
  Maintenance: AlertCircle,
  Complaint: AlertCircle,
  ServiceRequest: AlertCircle,
  Inquiry: AlertCircle,
  Emergency: AlertCircle
};

// 4.1.1 SLA Countdown Component
const SLACountdown = ({ deadline, status }: { deadline: string, status: TicketStatus }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (status === 'Resolved' || status === 'Closed' || status === 'Cancelled') return;
    const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, [status]);

  const targetDate = parseISO(deadline);
  const diff = differenceInSeconds(targetDate, now);
  const isBreached = diff <= 0;

  if (status === 'Resolved' || status === 'Closed' || status === 'Cancelled') {
    return <span className="text-muted opacity-50 text-[10px] font-bold">DONE</span>;
  }

  const hours = Math.floor(Math.abs(diff) / 3600);
  const minutes = Math.floor((Math.abs(diff) % 3600) / 60);

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter shadow-sm border",
      isBreached
        ? "bg-danger/10 text-danger border-danger/20 animate-pulse"
        : "bg-warning/10 text-warning border-warning/20"
    )}>
      <Clock size={10} />
      <span>{isBreached ? '-' : ''}{hours}h {minutes}m</span>
    </div>
  );
};

const TicketList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const setBuilding = useUIStore((s) => s.setBuilding);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() =>
    (localStorage.getItem('ticket-view-mode') as any) || 'list'
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>(['Open', 'InProgress']);
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority[]>([]);
  const [typeFilter, setTypeFilter] = useState<TicketType[]>([]);
  const [slaBreached, setSlaBreached] = useState(false);

  useEffect(() => {
    localStorage.setItem('ticket-view-mode', viewMode);
  }, [viewMode]);

  const { data: tickets, isLoading, isError, refetch } = useQuery<TicketSummary[]>({
    queryKey: ['tickets', search, activeBuildingId, statusFilter, priorityFilter, typeFilter, slaBreached],
    queryFn: () => ticketService.getTickets({ 
      search, 
      buildingId: activeBuildingId, 
      status: statusFilter,
      priority: priorityFilter,
      type: typeFilter,
      slaBreached
    })
  });

  const handleStatusChange = async (id: string, newStatus: TicketStatus) => {
    try {
      await ticketService.updateStatus(id, newStatus);
      toast.success(t('pages.tickets.statusChanged', { id, status: newStatus }));
      refetch();
    } catch (e) {
      toast.error(t('pages.tickets.statusError'));
    }
  };

  const toggleStatus = (s: TicketStatus) => {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const togglePriority = (p: TicketPriority) => {
    setPriorityFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleCreateTicket = async (data: any) => {
    try {
      await ticketService.createTicket(data);
      toast.success(t('pages.tickets.createSuccess'));
      setIsModalOpen(false);
      refetch();
    } catch (e) {
      toast.error(t('pages.tickets.createError'));
    }
  };

  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();

  if (user?.role === 'Staff' && searchParams.get('assignedTo') === 'me') {
    return <StaffMyTickets />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
              <AlertCircle size={28} />
            </div>
            <h1 className="text-display text-primary leading-tight">{t('pages.tickets.title')}</h1>
          </div>
          <p className="text-body text-muted font-medium">{t('pages.tickets.description')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-bg/50 p-1.5 rounded-2xl border border-border/10">
             <button 
               onClick={() => setViewMode('list')}
               className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-primary")}
             >
                <List size={20} />
             </button>
             <button 
               onClick={() => setViewMode('kanban')}
               className={cn("p-2 rounded-xl transition-all", viewMode === 'kanban' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-primary")}
             >
                <LayoutGrid size={20} />
             </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-8 h-12 shadow-xl shadow-primary/20 hover:-translate-y-0.5"
          >
            <Plus size={18} /> {t('pages.tickets.create')}
          </button>
        </div>
      </div>

      {/* 4.1.2 Filter Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center bg-bg/20 p-6 rounded-[32px] border border-border/10">
        <div className="lg:col-span-3">
           <SelectAsync 
             placeholder="Tòa nhà"
             icon={Building}
             value={activeBuildingId}
             onChange={setBuilding}
             loadOptions={async (search) => {
               const buildings = await buildingService.getBuildings({ search });
               return buildings.map(b => ({ label: b.buildingName, value: String(b.id) }));
             }}
           />
        </div>

        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t('pages.tickets.searchPlaceholder')} 
            className="input-base w-full pl-12 pr-4 h-12 shadow-sm focus:shadow-lg transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="lg:col-span-6 flex items-center gap-5 overflow-x-auto no-scrollbar py-1">
           <div className="flex items-center gap-2 pr-4 border-r border-border/20">
              {([
                { key: 'Open' as TicketStatus, labelKey: 'pages.tickets.filters.open' },
                { key: 'InProgress' as TicketStatus, labelKey: 'pages.tickets.filters.inProgress' },
                { key: 'Resolved' as TicketStatus, labelKey: 'pages.tickets.filters.resolved' },
                { key: 'Closed' as TicketStatus, labelKey: 'pages.tickets.filters.closed' },
              ]).map(({ key: s, labelKey }) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    statusFilter.includes(s)
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white text-muted hover:text-primary border border-border/50"
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-2 pr-4 border-r border-border/20">
              {([
                { key: 'Critical' as TicketPriority, labelKey: 'priority.Critical' },
                { key: 'High' as TicketPriority, labelKey: 'priority.High' },
                { key: 'Medium' as TicketPriority, labelKey: 'priority.Medium' },
                { key: 'Low' as TicketPriority, labelKey: 'priority.Low' },
              ]).map(({ key: p, labelKey }) => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                    priorityFilter.includes(p)
                      ? "bg-white shadow-sm border border-border/50"
                      : "text-muted hover:text-text"
                  )}
                  title={t(labelKey)}
                >
                  <span className={cn("w-2.5 h-2.5 rounded-full", PRIORITY_COLORS[p])} />
                  {t(labelKey)}
                </button>
              ))}
           </div>

           <label className="flex items-center gap-3 cursor-pointer group whitespace-nowrap">
              <div
                onClick={() => setSlaBreached(!slaBreached)}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative border",
                  slaBreached ? "bg-danger border-danger" : "bg-white border-border"
                )}
              >
                 <div className={cn(
                   "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                   slaBreached ? "right-1" : "left-1"
                 )} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted group-hover:text-danger">{t('pages.tickets.slaBreached')}</span>
           </label>
        </div>
      </div>

      {isError && <ErrorBanner message={t('toasts.error.generic')} onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4">
           <Spinner />
           <p className="text-[11px] text-muted font-bold uppercase tracking-[4px]">{t('pages.tickets.loading')}</p>
        </div>
      ) : !tickets?.length ? (
        <EmptyState
          icon={AlertCircle}
          title={t('pages.tickets.emptyTitle')}
          message={t('pages.tickets.emptyMessage')}
          actionLabel={t('pages.tickets.create')}
          onAction={() => setIsModalOpen(true)}
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="card-container p-0 overflow-hidden border-none shadow-2xl shadow-primary/5 bg-white/40 backdrop-blur-md">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead className="bg-bg/50 border-b border-border/20">
                 <tr>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted whitespace-nowrap">{t('pages.tickets.table.ticketId')}</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted">{t('pages.tickets.table.issue')}</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted">{t('pages.tickets.table.typePriority')}</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted text-center">{t('pages.tickets.table.status')}</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted">{t('pages.tickets.table.assignee')}</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted">{t('pages.tickets.table.slaWarning')}</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-muted text-right">{t('pages.tickets.table.age')}</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/10">
                 {tickets?.map(ticket => (
                   <tr
                     key={ticket.id}
                     className="group hover:bg-white transition-all cursor-pointer"
                     onClick={() => navigate(`/tickets/${ticket.id}`)}
                   >
                     <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[ticket.priority])} />
                          <span className="font-mono text-small font-black text-primary group-hover:underline">{ticket.ticketCode}</span>
                       </div>
                     </td>
                     <td className="px-6 py-5">
                        <p className="text-small font-bold text-primary line-clamp-1">{ticket.title}</p>
                     </td>
                     <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className="p-1.5 bg-bg/50 rounded-lg text-muted">
                              <AlertCircle size={14} />
                           </div>
                           <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">{ticket.type}</span>
                        </div>
                     </td>
                     <td className="px-6 py-5 text-center">
                        <StatusBadge status={ticket.status} size="sm" />
                     </td>
                     <td className="px-6 py-5">
                        {ticket.assignedToName ? (
                          <div className="flex items-center gap-2">
                             <img src={ticket.assignedToAvatar} className="w-6 h-6 rounded-lg object-cover border border-border/20" alt="" />
                             <span className="text-[11px] font-bold text-primary">{ticket.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-muted italic opacity-50">{t('pages.tickets.unassigned')}</span>
                        )}
                     </td>
                     <td className="px-6 py-5">
                        <SLACountdown deadline={ticket.slaDeadline} status={ticket.status} />
                     </td>
                     <td className="px-6 py-5 text-right">
                        <span className="text-[11px] font-bold text-muted">
                           {formatDistanceToNow(parseISO(ticket.createdAt), { locale: vi })}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      ) : (
        <TicketKanban
          tickets={tickets || []}
          onStatusChange={handleStatusChange}
          onTicketClick={(id) => navigate(`/tickets/${id}`)}
        />
      )}

      <TicketFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
};

export default TicketList;
