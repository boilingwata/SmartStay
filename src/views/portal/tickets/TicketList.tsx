import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, MessageSquare, Plus, Star } from 'lucide-react';

import { Spinner } from '@/components/ui';
import {
  formatTicketDate,
  formatTicketDateTime,
  getTicketCategoryShortLabel,
  getTicketPriorityLabel,
  getTicketStatusLabel,
  ticketQueryKeys,
} from '@/features/tickets/ticketPresentation';
import { supabase } from '@/lib/supabase';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';

const TABS = [
  { id: 'active', label: 'Đang xử lý' },
  { id: 'resolved', label: 'Đã hoàn tất' },
  { id: 'all', label: 'Tất cả' },
] as const;

const STATUS_STYLES: Record<string, string> = {
  Open: 'bg-amber-50 text-amber-700 border-amber-200',
  InProgress: 'bg-sky-50 text-sky-700 border-sky-200',
  PendingConfirmation: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

const TicketList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('active');
  const navigate = useNavigate();

  const { data: tenantId } = useQuery({
    queryKey: ticketQueryKeys.portalCurrentTenant,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', user.id)
        .eq('is_deleted', false)
        .limit(1);

      return tenants?.[0]?.id ?? null;
    },
  });

  const { data: tickets = [], isLoading, isError, refetch } = useQuery({
    queryKey: ticketQueryKeys.portalList(tenantId, activeTab),
    queryFn: () =>
      ticketService.getTickets({
        tenantId,
        status:
          activeTab === 'active'
            ? ['Open', 'InProgress', 'PendingConfirmation']
            : activeTab === 'resolved'
              ? ['Resolved', 'Closed']
              : 'All',
      }),
    enabled: !!tenantId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-1 flex-col items-center justify-center space-y-4 px-6">
        <Spinner size="lg" />
        <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Đang tải yêu cầu...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[80vh] flex-1 flex-col items-center justify-center space-y-4 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-widest text-slate-700">Không tải được danh sách yêu cầu</p>
          <p className="text-sm text-slate-500">Vui lòng thử lại sau ít phút.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
        >
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-slate-50/50 pb-32">
      <div className="sticky top-0 z-40 space-y-4 border-b border-slate-100 bg-white/90 px-5 pb-4 pt-10 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600/60">Trung tâm hỗ trợ</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Yêu cầu của tôi</h1>
          </div>
          <button
            onClick={() => navigate('/portal/tickets/create')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Plus size={18} />
            Tạo mới
          </button>
        </div>

        <div className="flex gap-1 rounded-[18px] bg-slate-100 p-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 rounded-[14px] py-3 text-[11px] font-black uppercase tracking-[0.18em] transition',
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 px-5 pb-40 pt-6">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => navigate(`/portal/tickets/${ticket.id}`)}
              className="w-full rounded-[28px] border border-slate-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-mono text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {ticket.ticketCode}
                  </p>
                  <h3 className="line-clamp-2 text-lg font-black tracking-tight text-slate-900">{ticket.title}</h3>
                </div>

                <span
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest',
                    STATUS_STYLES[ticket.status] ?? 'border-slate-200 bg-slate-100 text-slate-600'
                  )}
                >
                  {getTicketStatusLabel(ticket.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{getTicketCategoryShortLabel(ticket.type)}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{getTicketPriorityLabel(ticket.priority)}</span>
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock size={14} className="text-teal-500" />
                  <span>Tạo ngày {formatTicketDate(ticket.createdAt)}</span>
                </div>
                <div className="text-[11px] text-slate-500 sm:text-right">
                  Cập nhật lúc {formatTicketDateTime(ticket.updatedAt)}
                </div>
              </div>

              {ticket.staffRating != null && (ticket.status === 'Resolved' || ticket.status === 'Closed') && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-bold text-slate-500">Đánh giá sau xử lý</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={cn(
                          ticket.staffRating && star <= ticket.staffRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="rounded-[36px] border-2 border-dashed border-slate-200 bg-white/50 px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
              <MessageSquare size={28} />
            </div>
            <h3 className="mt-5 text-sm font-black uppercase tracking-[0.28em] text-slate-500">Chưa có yêu cầu phù hợp</h3>
            <p className="mt-2 text-sm text-slate-400">
              Hãy tạo yêu cầu mới hoặc đổi bộ lọc ở phía trên.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
