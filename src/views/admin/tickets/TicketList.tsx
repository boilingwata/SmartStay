import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, List, AlertCircle, 
  Clock, Activity, Search, Filter as FilterIcon,
} from 'lucide-react';
import { ticketService } from '@/services/ticketService';
import { TicketStatus, TicketPriority, TicketType, Ticket } from '@/models/Ticket';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/utils';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';
import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { TicketFormModal } from '@/components/forms/TicketFormModal';
import { TicketAdvancedFilter } from '@/components/tickets/TicketAdvancedFilter';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import StaffMyTickets from '@/views/admin/StaffMyTickets';

import { QuickFilterChips, QuickFilterOption } from '@/components/ui/QuickFilterChips';

// Safe Font Stack for Vietnamese
const SAFE_FONT = { fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' };

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: 'bg-[#DC2626]',
  High: 'bg-[#F97316]',
  Medium: 'bg-[#EAB308]',
  Low: 'bg-[#22C55E]'
};

const SLACountdown = ({ deadline, status }: { deadline: string, status: TicketStatus }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (status === 'Resolved' || status === 'Closed' || status === 'Cancelled') return;
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, [status]);

  const targetDate = parseISO(deadline);
  const diff = differenceInSeconds(targetDate, now);
  const isBreached = diff <= 0;

  if (status === 'Resolved' || status === 'Closed' || status === 'Cancelled') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-bold">
         OK
      </div>
    );
  }

  const hours = Math.floor(Math.abs(diff) / 3600);
  const minutes = Math.floor((Math.abs(diff) % 3600) / 60);

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border transition-all",
      isBreached
        ? "bg-red-50 text-red-600 border-red-200"
        : "bg-orange-50 text-orange-600 border-orange-200"
    )}>
      <Clock size={10} />
      <span>{isBreached ? 'Quá hạn ' : ''}{hours}h {minutes}m</span>
    </div>
  );
};

const TicketList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const [filters, setFilters] = useState({
    buildingId: activeBuildingId ? String(activeBuildingId) : '',
    roomId: '',
    type: [] as TicketType[],
    priority: [] as TicketPriority[],
    status: [] as TicketStatus[], 
    assignedTo: '',
    dateRange: { from: '', to: '' },
    search: '',
    slaBreached: false,
  });
  useEffect(() => {
    setFilters(f => ({ ...f, buildingId: activeBuildingId ? String(activeBuildingId) : '' }));
  }, [activeBuildingId]);

  const { data: tickets, isLoading, isError, refetch } = useQuery<Ticket[]>({
    queryKey: ['tickets', filters],
    queryFn: () => ticketService.getTickets(filters)
  });

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats', activeBuildingId],
    queryFn: () => ticketService.getTicketStatistics({ buildingId: activeBuildingId })
  });

  const activeQuickFilter = useMemo(() => {
    const { status, priority, slaBreached, type, roomId, assignedTo, dateRange } = filters;
    
    // If any "deep" filters are active, it's custom
    if (type.length > 0 || roomId !== '' || assignedTo !== '' || dateRange.from !== '' || dateRange.to !== '') {
      return 'custom';
    }

    if (slaBreached) return 'sla_breached';
    if (priority.length === 2 && priority.includes('High') && priority.includes('Critical')) return 'high_priority';
    if (status.length === 1 && status[0] === 'Open') return 'open';
    if (status.length === 1 && status[0] === 'InProgress') return 'in_progress';
    if (status.length === 0 && !slaBreached) return 'all';
    
    return 'custom';
  }, [filters]);

  const quickFilterOptions: QuickFilterOption[] = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Chờ nhận', value: 'open', count: stats?.open },
    { label: 'Đang xử lý', value: 'in_progress', count: stats?.inProgress },
    { label: 'Quá hạn', value: 'sla_breached', count: stats?.slaBreached, color: 'red' },
    { label: 'Ưu tiên cao', value: 'high_priority' },
  ];

  const handleQuickFilterChange = (val: string) => {
    const baseFilters = {
      ...filters,
      status: [] as TicketStatus[],
      priority: [] as TicketPriority[],
      slaBreached: false,
      // Clear deep filters when switching quick filters for better UX
      type: [] as TicketType[],
      roomId: '',
      assignedTo: '',
      dateRange: { from: '', to: '' },
    };

    switch (val) {
      case 'open':
        setFilters({ ...baseFilters, status: ['Open'] });
        break;
      case 'in_progress':
        setFilters({ ...baseFilters, status: ['InProgress'] });
        break;
      case 'sla_breached':
        setFilters({ ...baseFilters, slaBreached: true });
        break;
      case 'high_priority':
        setFilters({ ...baseFilters, priority: ['High', 'Critical'] });
        break;
      case 'all':
        setFilters(baseFilters);
        break;
      default:
        break;
    }
  };

  const handleCreateTicket = async (data: any) => {
    try {
      await ticketService.createTicket(data);
      toast.success("Đã tạo ticket mới thành công");
      setIsModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    } catch (e) {
      toast.error("Lỗi khi tạo ticket");
    }
  };

  if (user?.role === 'Staff' && searchParams.get('assignedTo') === 'me') {
    return <StaffMyTickets />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20" style={SAFE_FONT}>
      {/* Header section (Simplified) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Thống kê Vé hỗ trợ</h1>
           <p className="text-sm text-slate-500 mt-1">Hệ thống vận hành thông minh</p>
        </div>

        <div className="flex items-center gap-3">
           {/* Stats Summary Panel - Simplified Row - Interactive */}
           <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
              <button 
                onClick={() => handleQuickFilterChange('in_progress')}
                className="flex items-center gap-2 pr-4 border-r border-slate-100 hover:opacity-70 transition-opacity"
              >
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang xử lý:</span>
                 <span className="text-sm font-black text-slate-800">{stats?.inProgress || 0}</span>
              </button>
              <button 
                onClick={() => handleQuickFilterChange('open')}
                className="flex items-center gap-2 pr-4 border-r border-slate-100 hover:opacity-70 transition-opacity"
              >
                 <div className="w-2 h-2 rounded-full bg-orange-400" />
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chờ nhận:</span>
                 <span className="text-sm font-black text-slate-800">{stats?.open || 0}</span>
              </button>
              <button 
                onClick={() => handleQuickFilterChange('sla_breached')}
                className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              >
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quá hạn:</span>
                 <span className="text-sm font-black text-red-600">{stats?.slaBreached || 0}</span>
              </button>
           </div>

           <div className="h-10 w-px bg-slate-200 mx-2" />

           <button 
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-6 h-12 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
           >
             <Plus size={18} />
             <span>Mở Ticket</span>
           </button>
        </div>
      </div>

      {/* Modern Filter Section */}
      <div className="space-y-4">
        <QuickFilterChips 
          options={quickFilterOptions}
          value={activeQuickFilter}
          onChange={handleQuickFilterChange}
        />

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
           <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                 <input 
                   type="text" 
                   placeholder="Tìm theo mã ticket, tiêu đề hoặc nội dung..." 
                   className="w-full h-12 pl-12 pr-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-primary transition-all outline-none font-bold text-sm placeholder:font-medium"
                   value={filters.search}
                   onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                 />
              </div>
              <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={cn(
                  "flex items-center gap-2 px-6 h-12 rounded-xl font-bold transition-all border",
                  isFilterExpanded 
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                 <FilterIcon size={18} className={cn("transition-transform duration-300", isFilterExpanded && "rotate-180")} />
                 <span>Bộ lọc nâng cao</span>
                 <div className={cn(
                   "w-5 h-5 rounded-full flex items-center justify-center text-[10px] ml-1", 
                   isFilterExpanded ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                 )}>
                    {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : (!!v && v !== String(activeBuildingId) && v !== '')).length}
                 </div>
              </button>
           </div>
           
           <div className={cn(
             "overflow-hidden transition-all duration-500 ease-in-out", 
             isFilterExpanded ? "mt-4 pt-6 border-t border-slate-100 max-h-[800px] opacity-100" : "max-h-0 opacity-0"
           )}>
              <TicketAdvancedFilter 
                filters={filters}
                onChange={(newFilters) => {
                  setFilters(newFilters);
                }}
                onReset={() => {
                  setFilters({
                    buildingId: activeBuildingId ? String(activeBuildingId) : '',
                    roomId: '',
                    type: [],
                    priority: [],
                    status: [],
                    assignedTo: '',
                    dateRange: { from: '', to: '' },
                    search: '',
                    slaBreached: false,
                  });
                }}
                isExpanded={true} 
                onToggleExpand={() => setIsFilterExpanded(false)}
              />
           </div>
        </div>
      </div>

      {isError && <ErrorBanner message="Lỗi hệ thống khi tải dữ liệu." onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
           <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
        </div>
      ) : !tickets?.length ? (
        <EmptyState
          icon={Activity}
          title="Không tìm thấy yêu cầu nào"
          message="Hãy thử thay đổi tiêu chí lọc hoặc tạo ticket mới."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mã & Ưu tiên</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nội dung sự cố</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Người xử lý</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thời hạn SLA</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Ngày gửi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {tickets.map(ticket => (
                   <tr
                     key={ticket.id}
                     className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                     onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                   >
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className={cn("w-2.5 h-2.5 rounded-full", PRIORITY_COLORS[ticket.priority])} />
                           <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-primary">{ticket.ticketCode}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{ticket.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{ticket.buildingName} • P.{ticket.roomCode || 'N/A'}</p>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex justify-center">
                           <StatusBadge status={ticket.status} size="sm" />
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        {ticket.assignedToName ? (
                          <div className="flex items-center gap-2">
                             <img src={ticket.assignedToAvatar} className="w-7 h-7 rounded-lg object-cover bg-slate-100 border border-slate-200" alt="" />
                             <span className="text-xs font-bold text-slate-700">{ticket.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Chưa điều phối</span>
                        )}
                     </td>
                     <td className="px-6 py-4">
                        <SLACountdown deadline={ticket.slaDeadline} status={ticket.status} />
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-slate-600">
                           {formatDistanceToNow(parseISO(ticket.createdAt), { locale: vi, addSuffix: true })}
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
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
