import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, User, MoreVertical, Paperclip } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col animate-in fade-in slide-in-from-right-6 duration-700">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl px-4 py-4 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-[#0D8A8A] active:scale-90 transition-all">
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-0.5">{ticket.ticketCode}</p>
          <p className="text-sm font-black text-slate-900 line-clamp-1 max-w-[200px] tracking-tight">{ticket.title}</p>
        </div>
        <button className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-5 space-y-8 overflow-y-auto pb-40 no-scrollbar w-full mx-auto">
        {/* Date Label */}
        <div className="text-center py-4">
          <span className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 shadow-sm uppercase tracking-[2.5px]">
            {new Date(ticket.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Initial Request - Sent by User */}
        <div className="flex justify-end gap-3 group">
          <div className="max-w-[85%] space-y-2">
            <div className="relative p-5 bg-[#0D8A8A] text-white rounded-[28px] rounded-tr-none shadow-xl shadow-[#0D8A8A]/20 transform-gpu transition-all duration-300">
              <p className="text-[14px] font-medium leading-relaxed tracking-tight">{ticket.description}</p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold text-right px-1">
              {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Conversation Thread */}
        {comments.map((msg, i) => {
          const isStaff = msg.authorRole === 'Staff';
          return (
            <div key={msg.id} className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
              isStaff ? "justify-start" : "justify-end"
            )}>
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
            </div>
          );
        })}
        
        {ticket.status === 'Resolved' && (
          <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-1000">
             <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 border border-teal-100 shadow-inner">
               <CheckCircle2 size={32} strokeWidth={2.5} />
             </div>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[4px]">Vấn đề đã xử lý xong</p>
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      {ticket.status !== 'Closed' && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-2xl border-t border-slate-100/50 z-[100] w-full mx-auto">
          <div className="flex gap-3 bg-slate-50/80 rounded-[28px] p-2 items-center border border-slate-100 shadow-inner">
            <button className="w-10 h-10 text-slate-400 hover:text-[#0D8A8A] flex items-center justify-center transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Nhập phản hồi cho BQL..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-transparent px-2 py-3 border-none focus:ring-0 text-[14px] font-medium text-slate-700 placeholder:text-slate-400"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
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
