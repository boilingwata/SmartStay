import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Clock, AlertCircle, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';

const TicketList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');
  const navigate = useNavigate();

  const { data: tenantId } = useQuery({
    queryKey: ['current-tenant-id'],
    queryFn: async () => {
      const { data: { user } } = await import('@/lib/supabase').then((m) => m.supabase.auth.getUser());
      if (!user) return null;
      const { data: tenants } = await import('@/lib/supabase').then((m) => m.supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', user.id)
        .eq('is_deleted', false)
        .limit(1));
      return tenants?.[0]?.id;
    },
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['portal-tickets', tenantId, activeTab],
    queryFn: () => ticketService.getTickets({
      tenantId,
      status: activeTab === 'active'
        ? ['new', 'in_progress', 'pending_confirmation']
        : activeTab === 'resolved'
        ? ['Resolved', 'Closed']
        : 'All',
    }),
    enabled: !!tenantId,
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Open': return { text: 'MỚI TẠO', color: 'bg-amber-500', textCol: 'text-white' };
      case 'InProgress': return { text: 'ĐANG XỬ LÝ', color: 'bg-indigo-500', textCol: 'text-white' };
      case 'Resolved': return { text: 'HOÀN THÀNH', color: 'bg-emerald-500', textCol: 'text-white' };
      case 'Closed': return { text: 'ĐÃ ĐÓNG', color: 'bg-slate-400', textCol: 'text-white' };
      case 'Cancelled': return { text: 'ĐÃ HỦY', color: 'bg-rose-500', textCol: 'text-white' };
      default: return { text: status, color: 'bg-slate-200', textCol: 'text-slate-600' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-rose-500 fill-rose-500/20';
      case 'High': return 'text-orange-500 fill-orange-500/20';
      case 'Medium': return 'text-amber-500 fill-amber-500/20';
      case 'Low': return 'text-blue-500 fill-blue-500/20';
      default: return 'text-slate-400 fill-slate-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6 min-h-[80vh]">
        <Spinner size="lg" />
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Đang tải yêu cầu...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50/50 pb-32 animate-in fade-in duration-700 font-sans relative">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-5 pt-12 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest leading-none mb-1 font-mono">Trung tâm hỗ trợ</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Yêu cầu của tôi</h2>
          </div>
          <button
            onClick={() => toast.info('Tính năng chat trực tiếp đang được bảo trì...')}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-slate-200/10 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
          >
            <MessageSquare size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex bg-gray-100/50 p-1 rounded-[18px] gap-1 relative shadow-inner">
          {[
            { id: 'active', label: 'Đang xử lý' },
            { id: 'resolved', label: 'Lịch sử' },
            { id: 'all', label: 'Tất cả' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'active' | 'resolved' | 'all')}
                className={cn(
                  'flex-1 py-3 text-[11px] transition-all duration-300 relative flex items-center justify-center gap-1.5 font-black uppercase tracking-widest',
                  isActive ? 'bg-white rounded-[14px] shadow-lg text-slate-900' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-6 space-y-4 pb-40">
        {tickets.length > 0 ? (
          tickets.map((ticket) => {
            const statusStyle = getStatusDisplay(ticket.status);

            return (
              <div
                key={ticket.id}
                onClick={() => navigate(`/portal/tickets/${ticket.id}`)}
                className="bg-white rounded-[32px] p-6 border border-slate-100 hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-pointer active:scale-[0.98] relative overflow-hidden group"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full animate-pulse', getPriorityColor(ticket.priority).split(' ')[0].replace('text-', 'bg-'))} />
                    <span className="text-[11px] font-mono font-black text-slate-300 uppercase tracking-widest">{ticket.ticketCode}</span>
                  </div>
                  <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm', statusStyle.color, statusStyle.textCol)}>
                    {statusStyle.text}
                  </span>
                </div>

                <h3 className="line-clamp-2 text-slate-800 font-black text-lg tracking-tight uppercase group-hover:text-teal-600 transition-colors">{ticket.title}</h3>

                <div className="flex items-center gap-4 mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-teal-500" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-teal-600/50">Phản hồi cuối:</span>
                    <span className="text-slate-600">{new Date(ticket.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {ticket.status === 'Resolved' && (
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-teal-600/40 uppercase tracking-widest">Đánh giá dịch vụ</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={cn(
                            'transition-all',
                            ticket.staffRating && star <= ticket.staffRating ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-100'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 bg-white/40 rounded-[48px] border-2 border-dashed border-slate-200 space-y-4 opacity-50 shadow-inner">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 mx-auto">
              <AlertCircle size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[4px]">Chưa có yêu cầu nào</h3>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/portal/tickets/create')}
        className="fixed bottom-28 right-6 w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-700 text-white rounded-[24px] shadow-2xl shadow-teal-600/30 flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 group"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
      </button>
    </div>
  );
};

export default TicketList;
