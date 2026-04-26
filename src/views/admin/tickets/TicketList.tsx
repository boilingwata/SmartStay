import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Clock3, Filter, Plus, RefreshCcw, Search, Ticket as TicketIcon, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

import { TicketAdvancedFilter } from '@/components/tickets/TicketAdvancedFilter';
import { TicketFormModal, type TicketFormData } from '@/components/forms/TicketFormModal';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';
import { Spinner, StatusBadge } from '@/components/ui';
import {
  formatTicketDateTime,
  formatTicketRelativeTime,
  getTicketCategoryShortLabel,
  getTicketPriorityLabel,
  isTicketReferenceOverdue,
  ticketQueryKeys,
} from '@/features/tickets/ticketPresentation';
import type { Ticket, TicketPriority, TicketStatus, TicketType } from '@/models/Ticket';
import useAuthStore from '@/stores/authStore';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';
import StaffMyTickets from '@/views/admin/staff/StaffMyTickets';

type FilterState = {
  buildingId: string;
  roomId: string;
  type: TicketType[];
  priority: TicketPriority[];
  status: TicketStatus[];
  assignedTo: string;
  dateRange: { from: string; to: string };
  search: string;
  slaBreached: boolean;
};

const DEFAULT_FILTERS = (buildingId?: string | number | null): FilterState => ({
  buildingId: buildingId ? String(buildingId) : '',
  roomId: '',
  type: [],
  priority: [],
  status: [],
  assignedTo: '',
  dateRange: { from: '', to: '' },
  search: '',
  slaBreached: false,
});

const TicketList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS());
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    isError: ticketsError,
    refetch: refetchTickets,
  } = useQuery<Ticket[]>({
    queryKey: ticketQueryKeys.ownerList(filters),
    queryFn: () => ticketService.getTickets(filters),
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ticketQueryKeys.ownerStats(filters.buildingId || null),
    queryFn: () => ticketService.getTicketStatistics({ buildingId: filters.buildingId || null }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: TicketFormData) =>
      ticketService.createTicket({
        tenantId: payload.tenantId ? Number(payload.tenantId) : null,
        roomId: payload.roomId ? Number(payload.roomId) : null,
        title: payload.title,
        description: payload.description,
        type: payload.type,
        priority: payload.priority,
        status: 'Open',
        assignedToId: payload.assignedToId || null,
        attachments: payload.attachments,
      }),
    onSuccess: async () => {
      setIsCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'owner'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'portal'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã tạo ticket mới.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo ticket lúc này.');
    },
  });

  const activeSummary = useMemo(
    () => [
      {
        id: 'open',
        label: 'Mới tạo',
        value: stats?.open ?? 0,
        className: 'bg-amber-50 border-amber-200 text-amber-700',
        onClick: () => setFilters((current) => ({ ...current, status: ['Open'] })),
      },
      {
        id: 'progress',
        label: 'Đang xử lý',
        value: stats?.inProgress ?? 0,
        className: 'bg-sky-50 border-sky-200 text-sky-700',
        onClick: () => setFilters((current) => ({ ...current, status: ['InProgress'] })),
      },
      {
        id: 'pending',
        label: 'Chờ xác nhận',
        value: stats?.pendingConfirmation ?? 0,
        className: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        onClick: () => setFilters((current) => ({ ...current, status: ['PendingConfirmation'] })),
      },
      {
        id: 'overdue',
        label: 'Quá hạn tham chiếu',
        value: stats?.slaBreached ?? 0,
        className: 'bg-rose-50 border-rose-200 text-rose-700',
        onClick: () => setFilters((current) => ({ ...current, slaBreached: true })),
      },
    ],
    [stats]
  );

  if (user?.role === 'Staff' && searchParams.get('assignedTo') === 'me') {
    return <StaffMyTickets />;
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tickets / Support</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Điều phối yêu cầu hỗ trợ</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Theo dõi danh sách ticket, phân công người phụ trách và kiểm soát trạng thái xử lý theo đúng dữ liệu live hiện tại.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              refetchTickets();
              refetchStats();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Tải lại
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition"
          >
            <Plus size={16} />
            Tạo ticket
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button
          onClick={() => setFilters((current) => ({ ...DEFAULT_FILTERS(), search: current.search }))}
          className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tổng ticket</p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="text-4xl font-black tracking-tight text-slate-900">{stats?.total ?? 0}</span>
            <span className="rounded-full bg-slate-100 p-3 text-slate-500">
              <TicketIcon size={18} />
            </span>
          </div>
        </button>

        {activeSummary.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={cn(
              'rounded-[28px] border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
              item.className
            )}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] opacity-80">{item.label}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <span className="text-4xl font-black tracking-tight">{item.value}</span>
              <span className="rounded-full bg-white/70 p-3">
                {item.id === 'overdue' ? <Clock3 size={18} /> : <UserCheck size={18} />}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Tìm theo mã ticket, tiêu đề, cư dân hoặc phòng..."
              className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-primary focus:bg-white"
            />
          </div>

          <button
            onClick={() => setIsFilterExpanded((current) => !current)}
            className={cn(
              'inline-flex h-12 items-center gap-2 rounded-[18px] border px-4 text-sm font-bold transition',
              isFilterExpanded
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <Filter size={16} />
            Bộ lọc nâng cao
          </button>
        </div>

        <TicketAdvancedFilter
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS())}
          isExpanded={isFilterExpanded}
          onToggleExpand={() => setIsFilterExpanded((current) => !current)}
        />

        <p className="mt-4 text-xs font-medium leading-5 text-slate-500">
          Danh sách này hiển thị toàn bộ ticket hiện có. Chỉ khi bạn tự chọn trong bộ lọc nâng cao thì hệ thống mới giới hạn theo tòa nhà hoặc phòng.
        </p>
      </div>

      {ticketsError && (
        <ErrorBanner
          message="Không tải được danh sách ticket. Vui lòng kiểm tra lại kết nối và thử lại."
          onRetry={() => refetchTickets()}
        />
      )}

      {ticketsLoading || statsLoading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="space-y-4 text-center">
            <Spinner size="lg" />
            <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
              Đang đồng bộ ticket...
            </p>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-8">
          <EmptyState
            icon={AlertCircle}
            title="Không có ticket phù hợp"
            message="Hãy thử đổi bộ lọc hoặc tạo ticket mới nếu cần ghi nhận thêm yêu cầu."
            actionLabel="Tạo ticket"
            onAction={() => setIsCreateOpen(true)}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mã ticket</th>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Nội dung</th>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Trạng thái</th>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Người phụ trách</th>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mốc tham chiếu</th>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const overdue = isTicketReferenceOverdue(ticket);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/owner/tickets/${ticket.id}`)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <p className="font-mono text-sm font-black text-slate-900">{ticket.ticketCode}</p>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                            {getTicketPriorityLabel(ticket.priority)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="line-clamp-1 text-sm font-black text-slate-900">{ticket.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1">
                            {getTicketCategoryShortLabel(ticket.type)}
                          </span>
                          <span>{ticket.tenantName || 'Chưa rõ cư dân'}</span>
                          {ticket.roomCode && <span>• Phòng {ticket.roomCode}</span>}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>

                      <td className="px-5 py-4 align-top">
                        {ticket.assignedToName ? (
                          <div className="flex items-center gap-3">
                            {ticket.assignedToAvatar ? (
                              <img
                                src={ticket.assignedToAvatar}
                                alt={ticket.assignedToName}
                                className="h-10 w-10 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <UserCheck size={16} />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-800">{ticket.assignedToName}</p>
                              <p className="text-[11px] text-slate-500">{ticket.buildingName || 'Chưa rõ tòa nhà'}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-slate-400">Chưa phân công</span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div
                          className={cn(
                            'inline-flex rounded-[18px] border px-3 py-2 text-sm font-bold',
                            overdue
                              ? 'border-rose-200 bg-rose-50 text-rose-700'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          )}
                        >
                          {ticket.slaDeadline ? formatTicketDateTime(ticket.slaDeadline) : 'Chưa xác định'}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                          {overdue ? 'Quá hạn tham chiếu' : 'Trong hạn tham chiếu'}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-bold text-slate-800">{formatTicketDateTime(ticket.updatedAt)}</p>
                        <p className="mt-2 text-[11px] text-slate-500">{formatTicketRelativeTime(ticket.updatedAt)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TicketFormModal
        isOpen={isCreateOpen}
        onClose={() => {
          if (!createMutation.isPending) {
            setIsCreateOpen(false);
          }
        }}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </div>
  );
};

export default TicketList;
