import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Paperclip,
  RefreshCcw,
  Send,
  User,
} from 'lucide-react';

import { TicketAttachmentGallery } from '@/components/tickets/TicketAttachmentGallery';
import { EmptyState } from '@/components/ui/StatusStates';
import { Spinner, StatusBadge } from '@/components/ui';
import {
  formatTicketDate,
  formatTicketDateTime,
  getTicketCategoryLabel,
  getTicketPriorityLabel,
  getTicketStatusLabel,
  ticketQueryKeys,
} from '@/features/tickets/ticketPresentation';
import { supabase } from '@/lib/supabase';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';

const STATUS_PANEL_STYLES: Record<string, string> = {
  Open: 'bg-amber-50 border-amber-200',
  InProgress: 'bg-sky-50 border-sky-200',
  PendingConfirmation: 'bg-indigo-50 border-indigo-200',
  Resolved: 'bg-emerald-50 border-emerald-200',
  Closed: 'bg-slate-100 border-slate-200',
};

const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: tenantId, isLoading: tenantLoading } = useQuery({
    queryKey: ticketQueryKeys.portalCurrentTenant,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', user.id)
        .eq('is_deleted', false)
        .limit(1);

      if (error) throw error;
      return tenants?.[0]?.id ?? null;
    },
  });

  const {
    data: ticket,
    isLoading: ticketLoading,
    isError: ticketError,
    refetch: refetchTicket,
  } = useQuery({
    queryKey: ticketQueryKeys.portalDetail(id, tenantId),
    queryFn: () => ticketService.getTicketDetail(id!, tenantId),
    enabled: !!id && tenantId != null,
  });

  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ticketQueryKeys.portalComments(id, tenantId),
    queryFn: () => ticketService.getTicketComments(id!, tenantId),
    enabled: !!id && tenantId != null,
    refetchInterval: ticket?.status === 'Closed' ? false : 15_000,
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const trimmed = commentText.trim();
      if (!trimmed || !id) {
        throw new Error('Vui lòng nhập nội dung phản hồi.');
      }

      return ticketService.addComment(id, trimmed, false);
    },
    onSuccess: async () => {
      setCommentText('');
      await queryClient.invalidateQueries({ queryKey: ticketQueryKeys.portalComments(id, tenantId) });
      await queryClient.invalidateQueries({ queryKey: ticketQueryKeys.portalDetail(id, tenantId) });
    },
  });

  const firstAttachments = useMemo(
    () => comments.find((comment) => comment.attachments.length > 0)?.attachments ?? [],
    [comments]
  );

  const loading = tenantLoading || ticketLoading || commentsLoading;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-1 flex-col items-center justify-center space-y-4 px-6">
        <Spinner size="lg" />
        <p className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
          Đang tải chi tiết yêu cầu...
        </p>
      </div>
    );
  }

  if (ticketError || !ticket) {
    return (
      <div className="flex min-h-[80vh] flex-1 items-center justify-center px-5">
        <EmptyState
          icon={AlertCircle}
          title="Không tìm thấy yêu cầu"
          message="Yêu cầu này không còn tồn tại hoặc bạn không có quyền xem."
          actionLabel="Quay lại danh sách"
          onAction={() => navigate('/portal/tickets')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_40%,#f8fafc_100%)] pb-36">
      <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/portal/tickets')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
              {ticket.ticketCode}
            </p>
            <h1 className="truncate text-lg font-black tracking-tight text-slate-900">{ticket.title}</h1>
          </div>

          <button
            onClick={() => {
              refetchTicket();
              refetchComments();
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="space-y-6">
          <div
            className={cn(
              'rounded-[32px] border p-6 shadow-sm',
              STATUS_PANEL_STYLES[ticket.status] ?? 'bg-white border-slate-200'
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <StatusBadge status={ticket.status} size="lg" />
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-600">
                  <span className="rounded-full bg-white/80 px-3 py-1 font-bold">
                    {getTicketCategoryLabel(ticket.type)}
                  </span>
                  <span className="rounded-full bg-white/80 px-3 py-1 font-bold">
                    {getTicketPriorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>

              <div className="text-right text-sm text-slate-600">
                <p className="font-bold">Tạo ngày {formatTicketDate(ticket.createdAt)}</p>
                <p className="mt-1">Cập nhật lúc {formatTicketDateTime(ticket.updatedAt)}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-slate-200/70 pt-6 sm:grid-cols-2">
              <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Căn hộ</p>
                <p className="mt-2 text-sm font-bold text-slate-800">{ticket.roomCode ? `Phòng ${ticket.roomCode}` : 'Yêu cầu chung'}</p>
                <p className="mt-1 text-sm text-slate-500">{ticket.buildingName || 'Chưa gắn tòa nhà'}</p>
              </div>

              <div className="rounded-[24px] bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Người xử lý</p>
                <p className="mt-2 text-sm font-bold text-slate-800">
                  {ticket.assignedToName || 'Chưa phân công'}
                </p>
                <p className="mt-1 text-sm text-slate-500">{getTicketStatusLabel(ticket.status)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mô tả ban đầu</p>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Nội dung yêu cầu</h2>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] bg-slate-50 p-5">
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
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">Ghi chú xử lý</p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-emerald-900">
                  {ticket.resolutionNote}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Trao đổi</p>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  Lịch sử phản hồi ({comments.length})
                </h2>
              </div>
              <StatusBadge status={ticket.status} size="sm" />
            </div>

            {commentsError ? (
              <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Không tải được lịch sử phản hồi. Vui lòng thử lại.
              </div>
            ) : comments.length === 0 ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                  <MessageSquare size={22} />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">Chưa có phản hồi nào</p>
                <p className="mt-1 text-sm text-slate-500">Bạn có thể gửi thêm thông tin để ban quản lý xử lý nhanh hơn.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {comments.map((comment) => {
                  const isStaffSide = ['Owner', 'Staff', 'SuperAdmin'].includes(comment.authorRole);

                  return (
                    <div
                      key={comment.id}
                      className={cn(
                        'rounded-[24px] border p-4',
                        isStaffSide ? 'border-slate-200 bg-slate-50' : 'border-teal-100 bg-teal-50/60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {comment.authorAvatar ? (
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className="h-10 w-10 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-400">
                            <User size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black text-slate-800">{comment.authorName}</span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              {isStaffSide ? 'Ban quản lý' : 'Cư dân'}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatTicketDateTime(comment.createdAt)}
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
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-end gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <Paperclip size={18} />
          </div>

          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={ticket.status === 'Closed' || addCommentMutation.isPending}
              placeholder={
                ticket.status === 'Closed'
                  ? 'Yêu cầu đã đóng nên không thể gửi thêm phản hồi.'
                  : 'Nhập phản hồi để trao đổi thêm với ban quản lý...'
              }
              className="min-h-[88px] w-full resize-none rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
            />
          </div>

          <button
            onClick={() => addCommentMutation.mutate()}
            disabled={!commentText.trim() || ticket.status === 'Closed' || addCommentMutation.isPending}
            className="inline-flex h-14 shrink-0 items-center gap-2 rounded-[22px] bg-slate-900 px-5 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addCommentMutation.isPending ? <Spinner size="sm" /> : <Send size={16} />}
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
