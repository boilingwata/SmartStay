import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, User, MoreVertical, Paperclip } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { ticketService } from '@/services/ticketService';
import { Ticket, TicketComment } from '@/models/Ticket';
import { cn } from '@/utils';

const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'chat'>('info');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [ticketData, commentData] = await Promise.all([
          ticketService.getTicketDetail(id),
          ticketService.getTicketComments(id)
        ]);
        setTicket(ticketData);
        setComments(commentData);
      } catch (error) {
        console.error('Error fetching ticket detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSend = async () => {
    if (!newComment.trim() || !id) return;
    try {
      const sent = await ticketService.addComment(id, newComment);
      setComments([...comments, sent]);
      setNewComment('');
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-white min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#0D8A8A] rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">SmartStay Loading</p>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      
      {/* Tab Switcher Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[900px] mx-auto flex">
          <button 
            onClick={() => setActiveTab('info')}
            className={cn(
              "flex-1 py-5 text-[11px] font-black uppercase tracking-[3px] transition-all relative overflow-hidden",
              activeTab === 'info' ? "text-[#0D8A8A]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <span>Thông tin Ticket</span>
            {activeTab === 'info' && <m.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0D8A8A]" />}
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={cn(
              "flex-1 py-5 text-[11px] font-black uppercase tracking-[3px] transition-all relative overflow-hidden",
              activeTab === 'chat' ? "text-[#0D8A8A]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Hội thoại</span>
              {comments.length > 0 && <span className="bg-[#0D8A8A] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{comments.length}</span>}
            </div>
            {activeTab === 'chat' && <m.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0D8A8A]" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="p-5 md:p-8 w-full xl:max-w-[900px] mx-auto animate-in fade-in duration-500">
          
          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* Ticket Info Hero */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-slate-200/20 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">{ticket.ticketCode}</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{ticket.title}</h2>
                  </div>
                  <div className={cn(
                     "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border",
                     ticket.status === 'Open' ? "bg-blue-50 text-blue-600 border-blue-100" :
                     ticket.status === 'InProgress' ? "bg-amber-50 text-amber-600 border-amber-100" :
                     ticket.status === 'Resolved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                     "bg-slate-50 text-slate-500 border-slate-200"
                  )}>
                    {ticket.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loại yêu cầu</p>
                    <p className="text-xs font-bold text-slate-700 uppercase">{ticket.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mức độ ưu tiên</p>
                    <p className={cn("text-xs font-bold uppercase", 
                      ticket.priority === 'Critical' ? 'text-red-600' : 
                      ticket.priority === 'High' ? 'text-orange-600' : 
                      'text-teal-600'
                    )}>
                      {ticket.priority}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Căn hộ</p>
                    <p className="text-xs font-bold text-slate-700">{ticket.roomCode || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ngày gửi</p>
                    <p className="text-xs font-bold text-slate-700">{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mô tả nội dung</p>
                   <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                      <p className="text-[14px] text-slate-700 leading-relaxed font-medium">{ticket.description}</p>
                   </div>
                </div>
              </div>

              {/* Quick Chat Preview Action */}
              <button 
                onClick={() => setActiveTab('chat')}
                className="w-full h-[72px] bg-[#0D8A8A] text-white rounded-[32px] font-black shadow-2xl shadow-[#0D8A8A]/30 flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-[0.3em] text-xs"
              >
                <Send size={18} />
                BẮT ĐẦU TRÒ CHUYỆN VỚI BQL
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Conversation Section Header */}
              <div className="flex items-center gap-4 pb-4">
                 <div className="h-px flex-1 bg-slate-100" />
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Lịch sử hội thoại</span>
                 <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Conversation Thread */}
              {comments.map((msg, idx) => {
                const isStaff = msg.authorRole === 'Staff';
                return (
                  <m.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={msg.id} 
                    className={cn(
                      "flex gap-3",
                      isStaff ? "justify-start" : "justify-end"
                    )}
                  >
                    {isStaff && (
                      <div className="w-10 h-10 rounded-2xl bg-[#0D8A8A] flex items-center justify-center text-white mt-1 shadow-lg shadow-[#0D8A8A]/20 shrink-0">
                        <User size={20} strokeWidth={2.5} />
                      </div>
                    )}
                    <div className={cn("max-w-[85%] space-y-2", !isStaff && "flex flex-col items-end")}>
                      <div className={cn(
                        "p-5 rounded-[28px] shadow-sm transform-gpu transition-all",
                        isStaff 
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-slate-200/50" 
                          : "bg-[#0D8A8A] text-white rounded-tr-none shadow-[#0D8A8A]/20"
                      )}>
                        {isStaff && <p className="text-[10px] font-black text-[#0D8A8A] uppercase tracking-widest mb-1.5 opacity-70">Ban quản lý</p>}
                        <p className="text-[14px] font-medium leading-relaxed tracking-tight">{msg.content}</p>
                      </div>
                      <p className={cn(
                        "text-[10px] text-slate-400 font-bold px-1",
                        isStaff ? "text-left" : "text-right"
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </m.div>
                );
              })}
              
              {ticket.status === 'Resolved' && (
                <div className="flex flex-col items-center gap-4 py-8">
                   <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 border border-teal-100 shadow-inner">
                     <CheckCircle2 size={32} strokeWidth={2.5} />
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px]">Vấn đề đã xử lý xong</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Input Area */}
      {activeTab === 'chat' && ticket.status !== 'Closed' && (
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50">
          <div className="max-w-[900px] mx-auto flex gap-3 bg-slate-50/80 rounded-[28px] p-2 items-center border border-slate-100 shadow-inner">
            <button className="w-10 h-10 text-slate-400 hover:text-[#0D8A8A] flex items-center justify-center transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Nhập phản hồi cho BQL..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-transparent px-2 py-3 border-none focus:ring-0 text-[14px] font-medium text-slate-700 placeholder:text-slate-400"
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={!newComment.trim()}
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95",
                newComment.trim() 
                  ? "bg-[#0D8A8A] text-white shadow-[#0D8A8A]/30" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              )}
            >
              <Send size={20} strokeWidth={2.5} className={cn(newComment.trim() && "translate-x-0.5 -translate-y-0.5")} />
            </button>
          </div>
          <div className="pt-3 flex justify-center pb-2">
             <span className="text-[10px] font-black text-slate-200 uppercase tracking-[4px]">SmartStay Secure Chat</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
