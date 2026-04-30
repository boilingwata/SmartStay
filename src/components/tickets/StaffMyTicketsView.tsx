import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, LayoutGrid, List, RefreshCcw, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/shared';
import { Spinner, StatusBadge } from '@/components/ui';
import { EmptyState } from '@/components/ui/StatusStates';
import {
  formatTicketDateTime,
  formatTicketRelativeTime,
  getTicketCategoryShortLabel,
  isTicketReferenceOverdue,
  ticketQueryKeys,
} from '@/features/tickets/ticketPresentation';
import type { Ticket, TicketStatus } from '@/models/Ticket';
import { ticketService } from '@/services/ticketService';
import useAuthStore from '@/stores/authStore';
import { cn } from '@/utils';
import { TicketKanban } from '@/components/tickets/TicketKanban';

type StaffMyTicketsViewProps = {
  detailBasePath: string;
};

type ResolveFormState = {
  resolutionNote: string;
  rootCause: string;
};

const DEFAULT_RESOLVE_FORM: ResolveFormState = {
  resolutionNote: '',
  rootCause: '',
};

const ACTIVE_STATUSES: TicketStatus[] = ['Open', 'InProgress', 'PendingConfirmation'];
const COMPLETED_STATUSES: TicketStatus[] = ['Resolved', 'Closed'];

export const StaffMyTicketsView = ({ detailBasePath }: StaffMyTicketsViewProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [resolveForm, setResolveForm] = useState<ResolveFormState>(DEFAULT_RESOLVE_FORM);

  const statuses = activeTab === 'active' ? ACTIVE_STATUSES : COMPLETED_STATUSES;

  const {
    data: tickets = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Ticket[]>({
    queryKey: ticketQueryKeys.myTickets(user?.id, search, activeTab),
    queryFn: () =>
      ticketService.getTickets({
        assignedTo: user?.id,
        search,
        status: statuses,
      }),
    enabled: !!user?.id,
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: {
      ticketId: string;
      status: TicketStatus;
      resolution?: { resolutionNote?: string; rootCause?: string };
    }) => ticketService.updateStatus(payload.ticketId, payload.status, payload.resolution),
    onSuccess: async () => {
      setResolveModalOpen(false);
      setSelectedTicket(null);
      setResolveForm(DEFAULT_RESOLVE_FORM);
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'staff'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'owner'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'portal'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã cập nhật trạng thái yêu cầu.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật trạng thái yêu cầu.');
    },
  });

  const activeCount = useMemo(
    () => tickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status)).length,
    [tickets]
  );

  const overdueCount = useMemo(
    () => tickets.filter((ticket) => isTicketReferenceOverdue(ticket)).length,
    [tickets]
  );

  const openResolveModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResolveModalOpen(true);
  };

  const handleStatusChange = (ticket: Ticket, status: TicketStatus) => {
    if (status === 'Resolved') {
      openResolveModal(ticket);
      return;
    }

    statusMutation.mutate({ ticketId: ticket.id, status });
  };

  const submitResolved = () => {
    const resolutionNote = resolveForm.resolutionNote.trim();
    if (!selectedTicket) return;

    if (resolutionNote.length < 20) {
      toast.error('Vui lòng nhập ghi chú xử lý tối thiểu 20 ký tự.');
      return;
    }

    statusMutation.mutate({
      ticketId: selectedTicket.id,
      status: 'Resolved',
      resolution: {
        resolutionNote,
        rootCause: resolveForm.rootCause.trim() || undefined,
      },
    });
  };

  if (!user) {
    return (
      <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-8">
        <EmptyState
          title="Không xác định được người dùng"
          message="Vui lòng đăng nhập lại để xem yêu cầu được giao cho bạn."
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Yêu cầu được giao</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Yêu cầu của tôi</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Theo dõi các yêu cầu đang phụ trách, cập nhật tiến độ và chuyển trạng thái đúng với phạm vi vận hành hiện tại.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Tải lại
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              'rounded-[28px] border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
              activeTab === 'active' ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'
            )}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Đang phụ trách</p>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-4xl font-black tracking-tight text-slate-900">{activeCount}</span>
              <span className="rounded-full bg-white/80 p-3 text-sky-600">
                <Clock3 size={18} />
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              'rounded-[28px] border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg',
              activeTab === 'completed' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
            )}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Đã hoàn tất</p>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-4xl font-black tracking-tight text-slate-900">
                {tickets.filter((ticket) => COMPLETED_STATUSES.includes(ticket.status)).length}
              </span>
              <span className="rounded-full bg-white/80 p-3 text-emerald-600">
                <CheckCircle2 size={18} />
              </span>
            </div>
          </button>

          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-500">Quá hạn tham chiếu</p>
            <div className="mt-4 flex items-end justify-between">
              <span className="text-4xl font-black tracking-tight text-rose-700">{overdueCount}</span>
              <span className="rounded-full bg-white/80 p-3 text-rose-600">
                <Clock3 size={18} />
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã yêu cầu, tiêu đề hoặc phòng..."
                className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-primary focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 rounded-[20px] bg-slate-100 p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-sm font-bold transition',
                  viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                )}
              >
                <LayoutGrid size={16} />
                Bảng xử lý
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[16px] px-4 py-2 text-sm font-bold transition',
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                )}
              >
                <List size={16} />
                Danh sách
              </button>
            </div>
          </div>
        </div>

        {isError ? (
          <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            Không tải được yêu cầu được giao cho bạn. Vui lòng thử lại.
          </div>
        ) : isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="space-y-4 text-center">
              <Spinner size="lg" />
              <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
                Đang tải yêu cầu...
              </p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-8">
            <EmptyState
              title="Không có yêu cầu phù hợp"
              message="Danh sách hiện không có yêu cầu nào khớp với bộ lọc đang chọn."
            />
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <TicketKanban
              tickets={tickets}
              columns={activeTab === 'active' ? ACTIVE_STATUSES : COMPLETED_STATUSES}
              onStatusChange={(ticketId, status) => {
                const ticket = tickets.find((item) => item.id === ticketId);
                if (!ticket) return;
                handleStatusChange(ticket, status);
              }}
              onTicketClick={(ticketId) => navigate(`${detailBasePath}/${ticketId}`)}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Yêu cầu</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Loại</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Trạng thái</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Thời gian</th>
                    <th className="px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const overdue = isTicketReferenceOverdue(ticket);

                    return (
                      <tr
                        key={ticket.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 align-top">
                          <button
                            onClick={() => navigate(`${detailBasePath}/${ticket.id}`)}
                            className="space-y-2 text-left"
                          >
                            <p className="font-mono text-sm font-black text-slate-900">{ticket.ticketCode}</p>
                            <p className="line-clamp-1 text-sm font-bold text-slate-800">{ticket.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {ticket.roomCode ? `Phòng ${ticket.roomCode}` : 'Yêu cầu chung'}
                            </p>
                          </button>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                            {getTicketCategoryShortLabel(ticket.type)}
                          </span>
                          <p
                            className={cn(
                              'mt-2 text-[11px] font-bold',
                              overdue ? 'text-rose-600' : 'text-slate-500'
                            )}
                          >
                            {overdue ? 'Quá hạn tham chiếu' : 'Trong hạn tham chiếu'}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <StatusBadge status={ticket.status} size="sm" />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <p className="text-sm font-bold text-slate-800">{formatTicketDateTime(ticket.updatedAt)}</p>
                          <p className="mt-2 text-[11px] text-slate-500">{formatTicketRelativeTime(ticket.updatedAt)}</p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            {ticket.status === 'Open' && (
                              <button
                                onClick={() => handleStatusChange(ticket, 'InProgress')}
                                className="rounded-full bg-sky-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-sky-700"
                              >
                                Bắt đầu
                              </button>
                            )}

                            {ticket.status === 'InProgress' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(ticket, 'PendingConfirmation')}
                                  className="rounded-full bg-indigo-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-indigo-700"
                                >
                                  Chờ xác nhận
                                </button>
                                <button
                                  onClick={() => handleStatusChange(ticket, 'Resolved')}
                                  className="rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700"
                                >
                                  Đã xử lý
                                </button>
                              </>
                            )}

                            {ticket.status === 'PendingConfirmation' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(ticket, 'InProgress')}
                                  className="rounded-full bg-sky-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-sky-700"
                                >
                                  Xử lý lại
                                </button>
                                <button
                                  onClick={() => handleStatusChange(ticket, 'Resolved')}
                                  className="rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700"
                                >
                                  Xác nhận xong
                                </button>
                              </>
                            )}

                            {ticket.status === 'Resolved' && (
                              <button
                                onClick={() => handleStatusChange(ticket, 'Closed')}
                                className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700"
                              >
                                Đóng yêu cầu
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={resolveModalOpen}
        onClose={() => {
          if (statusMutation.isPending) return;
          setResolveModalOpen(false);
        }}
        title="Đánh dấu đã xử lý"
        className="max-w-2xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Yêu cầu sẽ chuyển sang trạng thái “Đã xử lý”. Vui lòng ghi rõ kết quả xử lý để đối soát sau này.
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Ghi chú xử lý</label>
            <textarea
              value={resolveForm.resolutionNote}
              onChange={(event) =>
                setResolveForm((current) => ({ ...current, resolutionNote: event.target.value }))
              }
              className="min-h-[160px] w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-primary focus:bg-white"
              placeholder="Mô tả cách đã xử lý yêu cầu này..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Nguyên nhân gốc</label>
            <textarea
              value={resolveForm.rootCause}
              onChange={(event) =>
                setResolveForm((current) => ({ ...current, rootCause: event.target.value }))
              }
              className="min-h-[120px] w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-primary focus:bg-white"
              placeholder="Có thể bỏ trống nếu chưa cần ghi nhận."
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setResolveModalOpen(false)}
              className="rounded-[18px] border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={submitResolved}
              disabled={statusMutation.isPending}
              className="inline-flex items-center gap-2 rounded-[18px] bg-emerald-600 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-600/20 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {statusMutation.isPending ? <Spinner size="sm" /> : <CheckCircle2 size={16} />}
              Lưu trạng thái
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default StaffMyTicketsView;
