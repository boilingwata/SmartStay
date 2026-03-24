import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Clock, AlertCircle, Star, User, ArrowRight, Wrench, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ticketService } from '@/services/ticketService';
import { Ticket } from '@/models/Ticket';
import { cn } from '@/utils';
import { differenceInMinutes, parseISO } from 'date-fns';
import { toast } from 'sonner';

const TicketList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const data = await ticketService.getTickets();
        setTickets(data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

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

  const renderSLACountdown = (deadline: string) => {
    if (!deadline) return null;
    const diffMins = differenceInMinutes(parseISO(deadline), new Date());
    
    if (diffMins < 0) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
          <AlertCircle size={12} strokeWidth={3} /> Quá hạn ({Math.abs(Math.floor(diffMins/60))}h)
        </div>
      );
    }
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const isUrgent = hours < 2;
    
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg",
        isUrgent ? "text-amber-600 bg-amber-50" : "text-[#0D8A8A] bg-teal-50"
      )}>
        <Clock size={12} strokeWidth={3} /> SLA: {hours > 0 ? `${hours}h ` : ''}{mins}p
      </div>
    );
  };

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'active') return t.status === 'Open' || t.status === 'InProgress';
    if (activeTab === 'resolved') return t.status === 'Resolved' || t.status === 'Closed';
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6 min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-[#0D8A8A]/20 border-t-[#0D8A8A] rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="text-[12px] font-bold text-slate-900 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50/50 pb-32 animate-in fade-in duration-700 font-sans relative">
      
      {/* 1. Header with Tab Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-5 pt-12 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Yêu cầu hỗ trợ</h2>
          <button 
            onClick={() => toast.success('Đang kết nối với nhân viên hỗ trợ...')}
            className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
          >
            <MessageSquare size={20} />
          </button>
        </div>

        {/* E.9.1 Tab Bar (Same as Screen 6) */}
        <div className="flex bg-gray-100 rounded-[14px] p-1 gap-1 relative">
          {[
            { id: 'active', label: 'Đang xử lý' },
            { id: 'resolved', label: 'Đã hoàn thành' },
            { id: 'all', label: 'Tất cả' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'active' ? tickets.filter(t => t.status === 'Open' || t.status === 'InProgress').length :
                          tab.id === 'resolved' ? tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length :
                          tickets.length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-2 text-[12px] transition-all duration-300 relative flex items-center justify-center gap-1.5",
                  isActive 
                    ? "bg-white rounded-[10px] shadow-sm text-gray-900 font-semibold" 
                    : "text-gray-500 hover:text-gray-700 font-medium"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] rounded-full font-bold",
                    isActive ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ticket List */}
      <div className="px-5 pt-6 space-y-4 pb-40">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket, index) => {
            const statusStyle = getStatusDisplay(ticket.status);
            const isResolvedPendingRating = ticket.status === 'Resolved' && !ticket.staffRating;
            
            // Calculate SLA percentage and color
            let slaPercent = 0;
            let slaColor = 'bg-emerald-500';
            if (ticket.slaDeadline) {
               const start = parseISO(ticket.createdAt);
               const end = parseISO(ticket.slaDeadline);
               const now = new Date();
               const total = end.getTime() - start.getTime();
               const elapsed = now.getTime() - start.getTime();
               slaPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));
               
               if (slaPercent >= 80) slaColor = 'bg-rose-500';
               else if (slaPercent >= 50) slaColor = 'bg-amber-400';
            }

            return (
              <div 
                key={ticket.id}
                onClick={() => navigate(`/portal/tickets/${ticket.id}`)}
                className="bg-white rounded-[20px] p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer active:scale-[0.99] relative overflow-hidden"
              >
                {/* Header row: TicketCode (mono) + TicketType badge */}
                <div className="flex justify-between items-center mb-1">
                   <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">{ticket.ticketCode}</span>
                   <span className={cn(
                     "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                     statusStyle.color, statusStyle.textCol
                   )}>
                     {statusStyle.text}
                   </span>
                </div>

                {/* Title: 2 lines truncate */}
                <h3 className="line-clamp-2 text-gray-800 font-semibold text-[15px] mt-1 pr-6">{ticket.title}</h3>

                {/* Status row: Priority dot + date */}
                <div className="flex gap-2 items-center mt-2 text-xs text-gray-500 font-medium">
                   <div className={cn("w-2 h-2 rounded-full", getPriorityColor(ticket.priority).split(' ')[0].replace('text-', 'bg-'))} />
                   <span>Mức độ: {ticket.priority}</span>
                   <span className="ml-auto italic">{new Date(ticket.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>

                {/* SLA bar: Progress bar color (green<50% / yellow<80% / red>=80%) */}
                {ticket.slaDeadline && ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                  <div className="space-y-1 mt-3">
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <span>SLA Progress</span>
                        <span className={slaColor.replace('bg-', 'text-')}>{Math.round(slaPercent)}%</span>
                     </div>
                     <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", slaColor)} 
                          style={{ width: `${slaPercent}%` }} 
                        />
                     </div>
                  </div>
                )}

                {/* Assignee: Avatar 24px + "Đang xử lý: [Name]" */}
                <div className="flex gap-1.5 items-center text-[11px] text-gray-500 font-medium mt-3 pt-3 border-t border-gray-50">
                   <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                      {ticket.assignedToAvatar ? (
                        <img src={ticket.assignedToAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={12} className="text-gray-400" />
                      )}
                   </div>
                   <span>Đang xử lý: <strong className="text-gray-700">{ticket.assignedToName || 'BQL Tòa nhà'}</strong></span>
                </div>

                {/* Rating: Stars if Resolved + chưa đánh giá */}
                {ticket.status === 'Resolved' && (
                   <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400 uppercase">Đánh giá dịch vụ</span>
                      <div className="flex gap-0.5">
                         {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={16} 
                              className={cn(
                                "cursor-pointer transition-colors",
                                ticket.staffRating && star <= ticket.staffRating ? "fill-amber-400 text-amber-400" : "text-gray-200"
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
          <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm border border-gray-100">
                <AlertCircle size={32} strokeWidth={1.5} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-gray-700">Chưa có yêu cầu nào</h3>
                <p className="text-xs text-gray-400 font-medium">Các yêu cầu hỗ trợ sẽ xuất hiện tại đây</p>
             </div>
          </div>
        )}
      </div>

      {/* E.9.1 FAB "+ Tạo yêu cầu mới" */}
      <button 
        onClick={() => navigate('/portal/tickets/create')}
        className="fixed bottom-24 md:bottom-8 right-5 w-14 h-14 bg-gradient-to-br from-teal-500 to-blue-700 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40 group"
      >
        <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

    </div>
  );
};

export default TicketList;
