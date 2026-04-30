import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock3,
  RefreshCcw,
  Send,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Modal } from '@/components/shared';
import { TicketAttachmentGallery } from '@/components/tickets/TicketAttachmentGallery';
import { Spinner, StatusBadge } from '@/components/ui';
import { EmptyState } from '@/components/ui/StatusStates';
import {
  formatTicketDateTime,
  formatTicketRelativeTime,
  getTicketCategoryLabel,
  getTicketPriorityLabel,
  getTicketStatusLabel,
  isTicketReferenceOverdue,
  ticketQueryKeys,
} from '@/features/tickets/ticketPresentation';
import type { TicketStatus } from '@/models/Ticket';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';

type ResolutionFormState = {
  resolutionNote: string;
  rootCause: string;
  cost: string;
};

const DEFAULT_RESOLUTION_FORM: ResolutionFormState = {
  resolutionNote: '',
  rootCause: '',
  cost: '',
};

const STATUS_CARD_STYLES: Record<TicketStatus, string> = {
  Open: 'bg-amber-50 border-amber-200',
  InProgress: 'bg-sky-50 border-sky-200',
  PendingConfirmation: 'bg-indigo-50 border-indigo-200',
  Resolved: 'bg-emerald-50 border-emerald-200',
  Closed: 'bg-slate-100 border-slate-200',
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionForm, setResolutionForm] = useState<ResolutionFormState>(DEFAULT_RESOLUTION_FORM);

  const {
    data: ticket,
    isLoading: ticketLoading,
    isError: ticketError,
    refetch: refetchTicket,
  } = useQuery({
    queryKey: ticketQueryKeys.ownerDetail(id),
    queryFn: () => ticketService.getTicketDetail(id!),
    enabled: !!id,
  });

  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ticketQueryKeys.ownerComments(id),
    queryFn: () => ticketService.getTicketComments(id!),
    enabled: !!id,
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ticketQueryKeys.staffList,
    queryFn: () => ticketService.getStaff(),
    staleTime: 5 * 60 * 1000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const trimmed = commentText.trim();
      if (!trimmed || !id) {
        throw new Error('Vui lòng nhập nội dung phản hồi.');
      }

      return ticketService.addComment(id, trimmed, isInternalComment);
    },
    onSuccess: async () => {
      setCommentText('');
      setIsInternalComment(false);
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'owner'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'portal'] });
      toast.success('Đã gửi phản hồi.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể gửi phản hồi lúc này.');
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string | null) => ticketService.assignTicket(id!, assigneeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'owner'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'staff'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã cập nhật người phụ trách.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật người phụ trách.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (payload: {
      status: TicketStatus;
      resolution?: { resolutionNote?: string; rootCause?: string; cost?: number };
    }) => {
      return ticketService.updateStatus(id!, payload.status, payload.resolution);
    },
    onSuccess: async () => {
      setShowResolveModal(false);
      setResolutionForm(DEFAULT_RESOLUTION_FORM);
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'owner'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'staff'] });
      await queryClient.invalidateQueries({ queryKey: ['ticket', 'portal'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã cập nhật trạng thái yêu cầu.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật trạng thái.');
    },
  });

  const firstAttachments = useMemo(
    () => comments.find((comment) => comment.attachments.length > 0)?.attachments ?? [],
    [comments]
  );
  const referenceOverdue = ticket ? isTicketReferenceOverdue(ticket) : false;
  const loading = ticketLoading || commentsLoading;

  const handleStatusChange = (status: TicketStatus) => {
    if (status === 'Resolved') {
      setShowResolveModal(true);
      return;
    }

    statusMutation.mutate({ status });
  };

  const submitResolved = () => {
    const resolutionNote = resolutionForm.resolutionNote.trim();
    if (resolutionNote.length < 20) {
      toast.error('Vui lòng nhập ghi chú xử lý tối thiểu 20 ký tự.');
      return;
    }

    const costValue = resolutionForm.cost.trim() ? Number(resolutionForm.cost) : undefined;
    if (costValue != null && Number.isNaN(costValue)) {
      toast.error('Chi phí xử lý không hợp lệ.');
      return;
    }

    statusMutation.mutate({
      status: 'Resolved',
      resolution: {
        resolutionNote,
        rootCause: resolutionForm.rootCause.trim() || undefined,
        cost: costValue,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Spinner size="lg" />
          <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
            Đang tải chi tiết yêu cầu...
          </p>
        </div>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <EmptyState
          icon={AlertCircle}
          title="Không tìm thấy yêu cầu"
          message="Yêu cầu này không còn tồn tại hoặc bạn không có quyền xem."
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/owner/tickets')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/owner/tickets')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>

          <button
            onClick={() => {
              refetchTicket();
              refetchComments();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw size={16} />
            Tải lại
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <div
              className={cn(
                'rounded-[32px] border p-6 shadow-sm',
                STATUS_CARD_STYLES[ticket.status] ?? 'bg-white border-slate-200'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
                    {ticket.ticketCode}
                  </p>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900">{ticket.title}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={ticket.status} size="md" />
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-700">
                      {getTicketCategoryLabel(ticket.type)}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-700">
                      {getTicketPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                </div>

                <div className="text-right text-sm text-slate-600">
                  <p className="font-bold">Tạo lúc {formatTicketDateTime(ticket.createdAt)}</p>
                  <p className="mt-1">Cập nhật lúc {formatTicketDateTime(ticket.updatedAt)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-slate-200/70 pt-6 md:grid-cols-2">
                <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Cư dân</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">{ticket.tenantName || 'Không xác định'}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.roomCode ? `Phòng ${ticket.roomCode}` : 'Yêu cầu chung'}
                  </p>
                </div>

                <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Mốc xử lý tham chiếu
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-sm font-bold',
                      referenceOverdue ? 'text-rose-600' : 'text-slate-800'
                    )}
                  >
                    {ticket.slaDeadline ? formatTicketDateTime(ticket.slaDeadline) : 'Chưa xác định'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {referenceOverdue ? 'Đang quá hạn tham chiếu.' : 'Đang trong hạn tham chiếu.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mô tả chi tiết</p>
              <div className="mt-4 rounded-[24px] bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                  {ticket.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              {firstAttachments.length > 0 && (
                <div className="mt-6">
                  <TicketAttachmentGallery attachments={firstAttachments} />
                </div>
              )}

              {ticket.resolutionNote && (
                <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
                    Ghi chú xử lý
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-emerald-900">
                    {ticket.resolutionNote}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Trao đổi</p>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    Lịch sử phản hồi ({comments.length})
                  </h2>
                </div>
                <StatusBadge status={ticket.status} size="sm" />
              </div>

              <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  disabled={addCommentMutation.isPending}
                  placeholder="Nhập phản hồi hoặc ghi chú xử lý..."
                  className="min-h-[140px] w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-primary"
                />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsInternalComment((current) => !current)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest transition',
                      isInternalComment
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    )}
                  >
                    <ShieldCheck size={14} />
                    {isInternalComment ? 'Ghi chú nội bộ' : 'Phản hồi công khai'}
                  </button>

                  <button
                    onClick={() => addCommentMutation.mutate()}
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-[18px] bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addCommentMutation.isPending ? <Spinner size="sm" /> : <Send size={16} />}
                    Gửi phản hồi
                  </button>
                </div>
              </div>

              {commentsError ? (
                <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  Không tải được lịch sử phản hồi. Vui lòng thử lại.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'rounded-[24px] border p-4',
                        comment.isInternal ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {comment.authorAvatar ? (
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className="h-11 w-11 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <User size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-slate-800">{comment.authorName}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {comment.authorRole}
                            </span>
                            {comment.isInternal && (
                              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                Nội bộ
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatTicketRelativeTime(comment.createdAt)} • {formatTicketDateTime(comment.createdAt)}
                          </p>
                          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                            {comment.content}
                          </p>

                          {comment.attachments.length > 0 && (
                            <div className="mt-4">
                              <TicketAttachmentGallery attachments={comment.attachments} compact />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Điều phối xử lý</p>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Người phụ trách
                  </label>
                  <select
                    value={ticket.assignedToId ?? ''}
                    onChange={(event) => assignMutation.mutate(event.target.value || null)}
                    disabled={assignMutation.isPending}
                    className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                  >
                    <option value="">Chưa phân công</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.fullName} ({staff.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[24px] bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-3 text-slate-500 shadow-sm">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {ticket.assignedToName || 'Chưa phân công'}
                      </p>
                      <p className="text-sm text-slate-500">{getTicketStatusLabel(ticket.status)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Cập nhật trạng thái</p>

              <div className="mt-5 space-y-3">
                {ticket.status === 'Open' && (
                  <button
                    onClick={() => handleStatusChange('InProgress')}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-slate-900 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition"
                  >
                    <CircleDashed size={16} />
                    Bắt đầu xử lý
                  </button>
                )}

                {ticket.status === 'InProgress' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('PendingConfirmation')}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-indigo-200 bg-indigo-50 text-sm font-black uppercase tracking-[0.16em] text-indigo-700 transition"
                    >
                      <Clock3 size={16} />
                      Chờ cư dân xác nhận
                    </button>

                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-emerald-600 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-600/20 transition"
                    >
                      <CheckCircle2 size={16} />
                      Đánh dấu đã xử lý
                    </button>
                  </>
                )}

                {ticket.status === 'PendingConfirmation' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('InProgress')}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-sky-200 bg-sky-50 text-sm font-black uppercase tracking-[0.16em] text-sky-700 transition"
                    >
                      <RefreshCcw size={16} />
                      Trả về đang xử lý
                    </button>

                    <button
                      onClick={() => handleStatusChange('Resolved')}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-emerald-600 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-emerald-600/20 transition"
                    >
                      <CheckCircle2 size={16} />
                      Xác nhận đã xử lý
                    </button>
                  </>
                )}

                {ticket.status === 'Resolved' && (
                  <>
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      Yêu cầu đã xử lý xong. Nếu cư dân đã đồng ý kết quả, hãy đóng yêu cầu để hoàn tất hồ sơ.
                    </div>
                    <button
                      onClick={() => handleStatusChange('Closed')}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-slate-900 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition"
                    >
                      <ShieldCheck size={16} />
                      Đóng yêu cầu
                    </button>
                  </>
                )}

                {ticket.status === 'Closed' && (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Yêu cầu đã đóng và không còn thao tác chuyển trạng thái trong phạm vi hiện tại.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          if (statusMutation.isPending) return;
          setShowResolveModal(false);
        }}
        title="Đánh dấu đã xử lý"
        className="max-w-2xl"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500">
            Ghi chú này sẽ được lưu vào yêu cầu để đối soát quá trình xử lý. Nếu có nguyên nhân gốc hoặc chi phí, hãy nhập luôn tại đây.
          </p>

          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              Ghi chú xử lý
            </label>
            <textarea
              value={resolutionForm.resolutionNote}
              onChange={(event) =>
                setResolutionForm((current) => ({ ...current, resolutionNote: event.target.value }))
              }
              className="min-h-[150px] w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-primary focus:bg-white"
              placeholder="Mô tả rõ cách đã xử lý sự cố, kết quả hiện tại và điều cư dân cần lưu ý..."
            />
            <p className="text-xs text-slate-500">
              Tối thiểu 20 ký tự. Hiện tại: {resolutionForm.resolutionNote.trim().length} ký tự.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Nguyên nhân gốc
              </label>
              <textarea
                value={resolutionForm.rootCause}
                onChange={(event) =>
                  setResolutionForm((current) => ({ ...current, rootCause: event.target.value }))
                }
                className="min-h-[120px] w-full rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] leading-7 text-slate-700 outline-none transition focus:border-primary focus:bg-white"
                placeholder="Có thể bỏ trống nếu chưa cần ghi nhận."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Chi phí xử lý
              </label>
              <input
                value={resolutionForm.cost}
                onChange={(event) =>
                  setResolutionForm((current) => ({ ...current, cost: event.target.value }))
                }
                className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                placeholder="Ví dụ: 250000"
                inputMode="numeric"
              />
              <p className="text-xs text-slate-500">
                Chỉ nhập số nếu yêu cầu này có phát sinh chi phí thực tế.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowResolveModal(false)}
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
              Lưu kết quả xử lý
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TicketDetail;
