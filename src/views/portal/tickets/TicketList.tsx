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
    <div className="flex flex-col min-h-screen bg-[#F1F5F9] pb-32 animate-in fade-in duration-1000 no-scrollbar">
      
      {/* 1. Lush Premium Header */}
      <div className="relative h-[220px] w-full overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#0D8A8A] to-[#2E5D9F] px-8 pt-12">
        {/* Animated Mesh Overlays */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[120%] bg-white/20 blur-[120px] rounded-full animate-float"></div>
          <div className="absolute bottom-[-30%] left-[-10%] w-[60%] h-[100%] bg-emerald-400/20 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[12px] font-black text-white/60 uppercase tracking-[5px] italic">Technical Center</p>
              <h1 className="text-[36px] font-black text-white tracking-tighter leading-tight italic">
                Hỗ Trợ <span className="text-emerald-400">24/7</span>
              </h1>
            </div>
            <button 
              onClick={() => toast.success('Đang kết nối với nhân viên hỗ trợ...')}
              className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[22px] flex items-center justify-center text-white active:scale-95 transition-all shadow-xl hover:bg-white/20"
            >
              <MessageSquare size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* Premium Segmented Control */}
          <div className="flex p-1.5 bg-black/20 backdrop-blur-3xl rounded-[24px] border border-white/10 shadow-inner">
            {[
              { id: 'active', label: 'Cần hỗ trợ', count: tickets.filter(t => t.status === 'Open' || t.status === 'InProgress').length },
              { id: 'resolved', label: 'Đã xử lý', count: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length },
              { id: 'all', label: 'Tất cả', count: tickets.length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-3 px-2 text-[10px] font-black uppercase tracking-[2px] rounded-[18px] transition-all duration-500 relative flex items-center justify-center gap-2 overflow-hidden",
                    isActive ? "bg-[#0D8A8A] text-white shadow-premium" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                  )}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      "relative z-10 px-1.5 py-0.5 rounded-lg text-[9px] font-black min-w-[20px] transition-colors",
                      isActive ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                    )}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Overlapping Ticket List */}
      <div className="px-5 -mt-6 relative z-20 space-y-6 max-w-[430px] mx-auto pb-40 no-scrollbar">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket, index) => {
            const statusStyle = getStatusDisplay(ticket.status);
            const isResolvedPendingRating = ticket.status === 'Resolved' && !ticket.staffRating;
            const priorityColor = getPriorityColor(ticket.priority).split(' ')[0];

            return (
              <div 
                key={ticket.id}
                onClick={() => navigate(`/portal/tickets/${ticket.id}`)}
                className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 shadow-premium border border-white/60 group hover:shadow-glow active:scale-[0.98] transition-all duration-500 relative overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Priority Pulse Indicator */}
                <div className="absolute top-6 right-6 flex items-center gap-1.5">
                   <div className={cn("w-2 h-2 rounded-full animate-pulse shadow-glow", priorityColor.replace('text-', 'bg-'))} />
                   <span className={cn("text-[9px] font-black uppercase tracking-[3px]", priorityColor)}>{ticket.priority}</span>
                </div>

                <div className="space-y-6">
                  {/* Category & Code */}
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-slate-100/50 text-[#1B3A6B] rounded-[18px] flex items-center justify-center transition-all group-hover:bg-[#1B3A6B] group-hover:text-white shadow-inner">
                        <Wrench size={20} strokeWidth={2.5} />
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{ticket.ticketCode}</p>
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm",
                          statusStyle.color, statusStyle.textCol
                        )}>
                          {statusStyle.text}
                        </span>
                     </div>
                  </div>

                  {/* Title & Description Box */}
                  <div className="space-y-2">
                    <h3 className="text-[18px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#0D8A8A] transition-colors">{ticket.title}</h3>
                    <div className="bg-slate-50/50 rounded-2xl p-4 space-y-4 border border-slate-100">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group-hover:scale-110 transition-transform">
                               {ticket.assignedToAvatar ? (
                                 <img src={ticket.assignedToAvatar} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 <User size={16} className="text-slate-400" strokeWidth={2.5} />
                               )}
                               <div className="absolute inset-0 bg-[#0D8A8A]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[8px] text-slate-400 font-black uppercase tracking-[2px] leading-none mb-1">Xử lý bởi</span>
                               <span className="text-[13px] font-black text-slate-800 tracking-tight italic">
                                 {ticket.assignedToName || 'Đang chờ điều phối'}
                               </span>
                             </div>
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                             <span className="text-[8px] text-slate-400 font-black uppercase tracking-[2px] leading-none mb-1">Ngày tạo</span>
                             <span className="text-sm font-black text-slate-600 tabular-nums italic">
                               {new Date(ticket.createdAt).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                             </span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Action / SLA Footer */}
                  {(ticket.status === 'Open' || ticket.status === 'InProgress' || isResolvedPendingRating || (ticket.status === 'Closed' && ticket.staffRating)) && (
                    <div className="pt-2 flex items-center justify-between">
                      {((ticket.status === 'Open' || ticket.status === 'InProgress') && ticket.slaDeadline) && (
                        renderSLACountdown(ticket.slaDeadline)
                      )}

                      {isResolvedPendingRating && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/portal/tickets/${ticket.id}?rate=true`); }}
                          className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-[2px] bg-amber-50 px-4 py-2 rounded-xl active:scale-95 transition-all shadow-sm border border-amber-100"
                        >
                           <Star size={14} className="fill-amber-500 text-amber-500" /> Đánh giá ngay
                        </button>
                      )}

                      {ticket.status === 'Closed' && ticket.staffRating && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/50 border border-amber-100 rounded-xl">
                          {Array.from({length: 5}).map((_, i) => (
                             <Star key={i} size={12} className={cn(i < ticket.staffRating! ? "fill-amber-500 text-amber-500" : "text-slate-200")} />
                          ))}
                        </div>
                      )}
                      
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 ml-auto flex items-center justify-center group-hover:bg-[#0D8A8A] group-hover:text-white group-hover:rotate-[-45deg] transition-all shadow-sm">
                        <ArrowUpRight size={20} strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white/60 backdrop-blur-xl rounded-[40px] border border-white shadow-2xl flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 relative">
               <ShieldAlert size={48} strokeWidth={1} />
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0D8A8A] shadow-lg border border-slate-50">
                  <Plus size={20} strokeWidth={3} />
               </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Hòm thư trống</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                Tòa nhà đang vận hành ổn định
              </p>
            </div>
            <Button className="portal-btn-primary px-8 h-12" onClick={() => navigate('/portal/tickets/create')}>Tạo yêu cầu mới</Button>
          </div>
        )}
      </div>

      {/* 3. Floating Premium Action Button */}
      <div className="fixed bottom-24 right-6 z-[100]">
        <button 
          onClick={() => navigate('/portal/tickets/create')}
          className="group relative overflow-hidden w-16 h-16 bg-[#0D8A8A] text-white rounded-[24px] shadow-glow flex items-center justify-center active:scale-90 transition-all hover:-translate-y-2"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus size={32} strokeWidth={3} className="relative z-10 transition-transform group-hover:rotate-180 duration-500" />
        </button>
      </div>

    </div>
  );
};

export default TicketList;
