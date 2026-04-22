import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, User, Paperclip } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { TicketAttachmentGallery } from '@/components/tickets/TicketAttachmentGallery';

const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

  const { data: tenantId } = useQuery({
    queryKey: ['current-tenant-id', 'ticket-detail'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['portal-ticket', id, tenantId],
    queryFn: () => ticketService.getTicketDetail(id!, tenantId),
    enabled: !!id && !!tenantId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['portal-ticket-comments', id, tenantId],
    queryFn: () => ticketService.getTicketComments(id!, tenantId),
    enabled: !!id && !!tenantId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => ticketService.addComment(id!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-ticket-comments', id, tenantId] });
      setNewComment('');
    },
  });

  const handleSend = () => {
    if (!newComment.trim() || !id || addCommentMutation.isPending) return;
    addCommentMutation.mutate(newComment);
  };

  const isLoading = ticketLoading || commentsLoading;
  const initialAttachments = comments.find((comment) => comment.attachments.length > 0)?.attachments ?? [];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-transparent min-h-[80vh]">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 min-h-[80vh]">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
          <ArrowLeft size={32} />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none">Không tìm thấy yêu cầu</p>
        <button onClick={() => navigate('/portal/tickets')} className="text-teal-600 font-black uppercase text-xs tracking-widest underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-6 duration-700 font-sans h-full bg-white relative">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-5 pt-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/portal/tickets')} className="w-10 h-10 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-[3px] truncate">{ticket.ticketCode}</p>
            <h1 className="text-lg font-black text-slate-900 truncate leading-none uppercase tracking-tight">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex border-t border-slate-50">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'flex-1 py-4 text-[11px] font-black uppercase tracking-[3px] transition-all relative overflow-hidden',
              activeTab === 'info' ? 'text-teal-600' : 'text-slate-400'
            )}
          >
            <span>Tổng quan</span>
            {activeTab === 'info' && <m.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 shadow-[0_-2px_10px_rgba(20,184,166,0.3)]" />}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex-1 py-4 text-[11px] font-black uppercase tracking-[3px] transition-all relative overflow-hidden',
              activeTab === 'chat' ? 'text-teal-600' : 'text-slate-400'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Thảo luận</span>
              {comments.length > 0 && <span className="bg-teal-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">{comments.length}</span>}
            </div>
            {activeTab === 'chat' && <m.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 shadow-[0_-2px_10px_rgba(20,184,166,0.3)]" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6 pb-40 max-w-[900px] mx-auto animate-in fade-in duration-500">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              <div className="bg-slate-50/50 p-8 rounded-[40px] border border-slate-100 space-y-8 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-teal-500 group-hover:scale-110 transition-transform">
                  <User size={120} strokeWidth={1} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                  <div className={cn(
                    'px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[4px] border shadow-sm',
                    ticket.status === 'Open' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    ticket.status === 'InProgress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    ticket.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-slate-50 text-slate-500 border-slate-100'
                  )}>
                    {ticket.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100 relative z-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phân loại</p>
                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{ticket.type}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Độ ưu tiên</p>
                    <p className={cn(
                      'text-sm font-black uppercase tracking-tight',
                      ticket.priority === 'Critical' ? 'text-rose-600' :
                      ticket.priority === 'High' ? 'text-orange-600' :
                      'text-teal-600'
                    )}>
                      {ticket.priority}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Căn hộ</p>
                    <p className="text-sm font-black text-slate-700">{ticket.roomCode || 'BQL'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gửi ngày</p>
                    <p className="text-sm font-black text-slate-700">{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 relative z-10">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nội dung chi tiết</p>
                  <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm min-h-[120px]">
                    <p className="text-[15px] text-slate-700 leading-relaxed font-medium tracking-tight italic">"{ticket.description}"</p>
                  </div>
                </div>
                {initialAttachments.length > 0 && (
                  <div className="relative z-10">
                    <TicketAttachmentGallery attachments={initialAttachments} />
                  </div>
                )}
              </div>

              <button
                onClick={() => setActiveTab('chat')}
                className="w-full h-16 bg-slate-900 text-white rounded-[32px] font-black shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-[3px] text-xs"
              >
                Gửi phản hồi cho BQL
                <Send size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-8 pb-32">
              <AnimatePresence mode="popLayout">
                {comments.map((msg, idx) => {
                  const isStaff = ['owner', 'staff', 'super_admin'].includes(msg.authorRole?.toLowerCase());
                  return (
                    <m.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={msg.id}
                      className={cn('flex gap-4 items-end', isStaff ? 'justify-start' : 'justify-end')}
                    >
                      {isStaff && (
                        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 shrink-0 mb-3 grayscale-[0.5] hover:grayscale-0 transition-all">
                          <User size={24} strokeWidth={2.5} />
                        </div>
                      )}
                      <div className={cn('max-w-[80%] space-y-2', !isStaff && 'flex flex-col items-end')}>
                        <div className={cn(
                          'p-6 rounded-[32px] shadow-lg transform-gpu transition-all',
                          isStaff
                            ? 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-slate-200/50'
                            : 'bg-teal-600 text-white rounded-br-none shadow-teal-600/20'
                        )}>
                          {isStaff && <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-2 opacity-70">Ban quản lý</p>}
	                          <p className="text-[15px] font-black leading-relaxed tracking-tight">{msg.content}</p>
	                          {msg.attachments.length > 0 && (
	                            <TicketAttachmentGallery attachments={msg.attachments} compact className="mt-4" />
	                          )}
	                        </div>
                        <p className={cn('text-[9px] text-slate-300 font-black uppercase tracking-widest px-2', isStaff ? 'text-left' : 'text-right')}>
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(msg.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </m.div>
                  );
                })}
              </AnimatePresence>

              {ticket.status === 'Resolved' && (
                <div className="flex flex-col items-center gap-4 py-12 border-t border-slate-50">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-2xl shadow-emerald-500/10">
                    <CheckCircle2 size={40} strokeWidth={3} />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Vấn đề đã hoàn tất xử lý</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {activeTab === 'chat' && ticket.status !== 'Closed' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
          <div className="max-w-[900px] mx-auto flex gap-4 bg-slate-50/80 rounded-[32px] p-3 items-center border border-slate-100 shadow-inner">
            <button className="w-12 h-12 text-slate-400 hover:text-teal-600 flex items-center justify-center transition-all active:scale-90">
              <Paperclip size={22} />
            </button>
            <input
              type="text"
              placeholder="Gửi phản hồi cho BQL..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={addCommentMutation.isPending}
              className="flex-1 bg-transparent px-3 py-4 border-none focus:ring-0 text-[15px] font-black text-slate-700 placeholder:text-slate-300 placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]"
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className={cn(
                'w-12 h-12 rounded-[20px] flex items-center justify-center shadow-2xl transition-all active:scale-90',
                newComment.trim() && !addCommentMutation.isPending
                  ? 'bg-teal-600 text-white shadow-teal-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              )}
            >
              {addCommentMutation.isPending ? <Spinner size="sm" /> : <Send size={24} strokeWidth={3} className="translate-x-0.5 -translate-y-0.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
