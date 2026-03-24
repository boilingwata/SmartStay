import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Copy, Clock, User, Home, Building, 
  Send, Paperclip, MoreVertical, CheckCircle2, 
  AlertCircle, History, MessageSquare, ShieldCheck,
  Edit2, Trash2, X, ArrowRight
} from 'lucide-react';
import { ticketService } from '@/services/ticketService';
import { Ticket, TicketComment, TicketStatus, TicketPriority } from '@/models/Ticket';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND } from '@/utils';
import { format, parseISO, differenceInMinutes, formatDistanceToNow, isAfter, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: 'text-[#DC2626] bg-[#DC2626]/10 border-[#DC2626]/20',
  High: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  Medium: 'text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20',
  Low: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20'
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: ticket, isLoading: loadingTicket } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketService.getTicketDetail(id!)
  });

  const { data: comments, isLoading: loadingComments } = useQuery({
    queryKey: ['ticket-comments', id],
    queryFn: () => ticketService.getTicketComments(id!)
  });

  const addCommentMutation = useMutation({
    mutationFn: () => ticketService.addComment(id!, commentText, isInternal),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', id] });
      toast.success('Đã gửi phản hồi!');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { status: TicketStatus, resolution?: any }) => 
      ticketService.updateStatus(id!, vars.status, vars.resolution),
    onSuccess: () => {
      setShowStatusModal(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      toast.success('Đã cập nhật trạng thái ticket!');
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép mã ticket');
  };

  const handleStatusTransition = (status: TicketStatus) => {
    setNewStatus(status);
    if (status === 'Resolved' || status === 'Cancelled') {
      setShowStatusModal(true);
    } else {
      updateStatusMutation.mutate({ status });
    }
  };

  if (loadingTicket || !ticket) {
    return (
      <div className="py-40 flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-[4px] text-muted">Intelligence Gathering...</p>
      </div>
    );
  }

  const canEditComment = (createdAt: string) => {
    return differenceInMinutes(new Date(), parseISO(createdAt)) <= 5;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 4.2.1 Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/tickets')}
          className="flex items-center gap-2 text-muted hover:text-primary transition-all group"
        >
          <div className="p-2 group-hover:bg-primary/5 rounded-xl transition-all">
             <ArrowLeft size={18} />
          </div>
          <span className="text-small font-bold">Back to Command Center</span>
        </button>
        
        <div className="flex items-center gap-3">
           <button className="btn-outline px-4 h-10 border-border/30 hover:bg-white"><Copy size={16} /> Export PDF</button>
           <button className="p-2 hover:bg-bg rounded-xl transition-all"><MoreVertical size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* 4.2.2 Left: Ticket Info & Comments (65%) */}
        <div className="lg:col-span-8 space-y-10">
           {/* Ticket Main Card */}
           <div className="card-container p-10 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col gap-8">
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3">
                       <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] font-black text-primary px-3 py-1 bg-primary/5 rounded-lg border border-primary/10 select-all">{ticket.ticketCode}</span>
                          <button onClick={() => handleCopy(ticket.ticketCode)} className="p-1.5 hover:bg-bg rounded-lg text-muted transition-all"><Copy size={14} /></button>
                       </div>
                       <h1 className="text-h2 text-primary font-black leading-tight tracking-tight">{ticket.title}</h1>
                       <div className="flex flex-wrap items-center gap-3">
                          <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", PRIORITY_COLORS[ticket.priority])}>
                             {ticket.priority}
                          </div>
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-bg/50 rounded-full border border-border/10">
                             <AlertCircle size={12} className="text-muted" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-muted">{ticket.type}</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 shrink-0">
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Created At</p>
                          <p className="text-small font-bold text-primary">{format(parseISO(ticket.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-bg/10 rounded-[32px] p-8 border border-border/5 space-y-6">
                    <div className="flex items-center gap-3 text-label text-muted font-bold uppercase tracking-widest mb-4">
                       <MessageSquare size={16} />
                       <span>Mô tả chi tiết</span>
                    </div>
                    <div className="text-body text-primary leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                       {ticket.description}
                    </div>
                 </div>

                 {/* Reporter & Location */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card-container p-6 bg-white shadow-sm border-border/10 hover:shadow-md transition-all">
                       <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                          <User size={12} /> Người báo cáo
                       </p>
                       <Link to={`/tenants/${ticket.tenantId}`} className="flex items-center gap-3 group">
                          <img src={ticket.tenantAvatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-2xl object-cover border-2 border-white shadow-md" alt="" />
                          <div>
                             <p className="text-small font-black text-primary group-hover:underline">{ticket.tenantName}</p>
                             <p className="text-[10px] text-muted font-bold">Cư dân</p>
                          </div>
                       </Link>
                    </div>

                    <div className="card-container p-6 bg-white shadow-sm border-border/10">
                       <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                          <Home size={12} /> Vị trí
                       </p>
                       <Link to={`/rooms/${ticket.roomId}`} className="block group">
                          <p className="text-small font-black text-primary group-hover:underline">Phòng {ticket.roomCode}</p>
                          <p className="text-[10px] text-muted font-bold truncate">{ticket.buildingName}</p>
                       </Link>
                    </div>

                    <div className="card-container p-6 bg-white shadow-sm border-border/10">
                       <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                          <Clock size={12} /> SLA Deadline
                       </p>
                       <p className={cn(
                         "text-small font-black",
                         isAfter(new Date(), parseISO(ticket.slaDeadline)) ? "text-danger" : "text-warning"
                       )}>
                          {format(parseISO(ticket.slaDeadline), 'dd/MM/yyyy HH:mm')}
                       </p>
                       <p className="text-[10px] text-muted font-bold mt-1">
                          {formatDistanceToNow(parseISO(ticket.slaDeadline), { addSuffix: true, locale: vi })}
                       </p>
                    </div>
                 </div>
              </div>
              <AlertCircle size={200} className="absolute -top-20 -right-20 text-primary/5 rotate-12" />
           </div>

           {/* 4.2.4 Comments Thread */}
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-h3 text-primary font-black uppercase tracking-widest flex items-center gap-3">
                    <MessageSquare size={24} />
                    Trao đổi {comments && <span className="opacity-30">({comments.length})</span>}
                 </h3>
              </div>

              {/* New Comment Box */}
              <div className="card-container p-6 bg-white shadow-xl shadow-primary/5 border-primary/10">
                 <textarea 
                   className="w-full bg-bg/20 rounded-2xl p-6 text-body font-medium placeholder:text-muted outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all min-h-[120px]"
                   placeholder="Nhập nội dung phản hồi hoặc ghi chú nội bộ..."
                   value={commentText}
                   onChange={(e) => setCommentText(e.target.value)}
                 />
                 <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-6">
                       <button className="flex items-center gap-2 text-muted hover:text-primary transition-all text-[11px] font-black uppercase tracking-widest">
                          <Paperclip size={16} /> Đính kèm
                       </button>
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <div 
                            onClick={() => setIsInternal(!isInternal)}
                            className={cn(
                              "w-10 h-5 rounded-full transition-all relative border",
                              isInternal ? "bg-slate-800 border-slate-800" : "bg-white border-border"
                            )}
                          >
                             <div className={cn(
                               "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                               isInternal ? "right-1 text-slate-800" : "left-1"
                             )} />
                          </div>
                          <div className="flex flex-col">
                             <span className={cn("text-[10px] font-black uppercase tracking-tighter transition-colors", isInternal ? "text-slate-800" : "text-muted")}>Ghi chú nội bộ</span>
                             <span className="text-[8px] text-muted font-bold">Chỉ nhân viên nhìn thấy</span>
                          </div>
                       </label>
                    </div>
                    <button 
                      className="btn-primary pl-10 pr-8 h-12 rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      onClick={() => addCommentMutation.mutate()}
                    >
                       <span className="text-[12px] font-black uppercase tracking-[2px]">Gửi đi</span>
                       <Send size={18} />
                    </button>
                 </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6 relative">
                 <div className="absolute left-8 top-0 bottom-0 w-1 bg-border/10 -z-10" />
                 {comments?.map((comment) => (
                    <div key={comment.id} className={cn(
                      "flex gap-6 animate-in slide-in-from-left-4 duration-500",
                      comment.isInternal && "bg-slate-50/50 p-4 rounded-[32px] border border-slate-200/50"
                    )}>
                       <img src={comment.authorAvatar || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-2xl object-cover shrink-0 z-10 border-4 border-white shadow-lg" alt="" />
                       <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className="text-small font-black text-primary">{comment.authorName}</span>
                                <span className={cn(
                                   "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                   comment.authorRole === 'Admin' ? "bg-primary text-white" : "bg-bg text-muted"
                                )}>{comment.authorRole}</span>
                                <span className="text-[10px] text-muted font-bold flex items-center gap-1.5">
                                   <Clock size={12} /> {formatDistanceToNow(parseISO(comment.createdAt), { addSuffix: true, locale: vi })}
                                </span>
                             </div>
                             {comment.isInternal && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200">
                                   <ShieldCheck size={12} /> Nội bộ
                                </div>
                             )}
                          </div>
                          <div className="card-container p-6 bg-white shadow-sm border-border/5 text-body font-medium text-primary">
                             {comment.content}
                          </div>
                          {canEditComment(comment.createdAt) && (
                             <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted/60 pl-2">
                                <button className="hover:text-primary transition-colors flex items-center gap-1"><Edit2 size={12} /> Sửa</button>
                                <button className="hover:text-danger transition-colors flex items-center gap-1"><Trash2 size={12} /> Xóa</button>
                             </div>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 4.2.3 Right: Status & Assignment (35%) */}
        <div className="lg:col-span-4 space-y-8 sticky top-32">
           {/* Status Card */}
           <div className="card-container p-8 space-y-8 shadow-2xl shadow-primary/5">
              <div className="space-y-4">
                 <p className="text-[11px] font-black uppercase tracking-[3px] text-muted">Trạng thái ticket</p>
                 <div className="flex items-center justify-between p-5 bg-bg/30 rounded-3xl border border-border/5">
                    <StatusBadge status={ticket.status} size="md" />
                 </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[11px] font-black uppercase tracking-[3px] text-muted">Người xử lý</p>
                 {ticket.assignedToName ? (
                    <div className="flex items-center justify-between p-5 bg-bg/30 rounded-3xl border border-border/5">
                       <div className="flex items-center gap-4">
                          <img src={ticket.assignedToAvatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-lg" alt="" />
                          <div>
                             <p className="text-small font-black text-primary">{ticket.assignedToName}</p>
                             <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Kỹ thuật viên</p>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="p-8 border-2 border-dashed border-border/30 rounded-[40px] text-center space-y-3 grayscale opacity-60">
                       <User size={32} className="mx-auto text-muted" />
                       <p className="text-small text-muted font-bold uppercase tracking-widest">Chưa có ai phụ trách</p>
                    </div>
                 )}
              </div>

              {/* 4.2.3 Status Transitions */}
              <div className="space-y-3 pt-6 border-t border-border/10">
                 {ticket.status === 'Open' && (
                    <button 
                      onClick={() => handleStatusTransition('InProgress')}
                      className="w-full btn-primary h-14 rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
                    >
                       <span className="text-[13px] font-black uppercase tracking-[3px]">Bắt đầu xử lý</span>
                       <ArrowRight size={20} />
                    </button>
                 )}
                 {ticket.status === 'InProgress' && (
                    <button 
                      onClick={() => handleStatusTransition('Resolved')}
                      className="w-full h-14 bg-success text-white rounded-3xl shadow-xl shadow-success/20 font-black uppercase tracking-[3px] text-[13px] flex items-center justify-center gap-3"
                    >
                       <CheckCircle2 size={20} /> Hoàn thành xử lý
                    </button>
                 )}
                 {ticket.status === 'Resolved' && (
                    <button 
                      onClick={() => handleStatusTransition('Closed')}
                      className="w-full h-14 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-900/20 font-black uppercase tracking-[3px] text-[13px] flex items-center justify-center gap-3"
                    >
                       <ShieldCheck size={20} /> Đóng ticket
                    </button>
                 )}
                 {(ticket.status !== 'Closed' && ticket.status !== 'Cancelled') && (
                    <button 
                      onClick={() => handleStatusTransition('Cancelled')}
                      className="w-full h-14 border border-border/50 text-muted hover:text-danger hover:border-danger hover:bg-danger/5 transition-all font-black uppercase tracking-[3px] text-[12px] rounded-3xl"
                    >
                       Hủy yêu cầu
                    </button>
                 )}
              </div>
           </div>

           {/* Assignment/Status History */}
           <div className="card-container p-8 space-y-6">
              <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[3px] text-muted">
                 <History size={16} /> Lịch sử thay đổi
              </div>
              <div className="space-y-8 relative">
                 <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border/20" />
                 <div className="flex gap-4 relative z-10 animate-in slide-in-from-right-4">
                    <div className="w-4 h-4 bg-primary rounded-full mt-1 shrink-0 border-4 border-white shadow-md shadow-primary/20" />
                    <div>
                        <p className="text-[11px] font-bold text-primary">Phạm Quản Lý đã tạo ticket mới</p>
                        <p className="text-[10px] text-muted font-medium mt-1">{format(subDays(new Date(), 2), 'HH:mm dd/MM/yyyy')}</p>
                    </div>
                 </div>
                 <div className="flex gap-4 relative z-10 animate-in slide-in-from-right-4 duration-700">
                    <div className="w-4 h-4 bg-primary rounded-full mt-1 shrink-0 border-4 border-white shadow-md shadow-primary/20" />
                    <div>
                        <p className="text-[11px] font-bold text-primary">Tự động tính SLA Deadline: 2 giờ</p>
                        <p className="text-[10px] text-muted font-medium mt-1">{format(subDays(new Date(), 2), 'HH:mm dd/MM/yyyy')}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Resolution/Cancellation Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setShowStatusModal(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      newStatus === 'Resolved' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>
                       <CheckCircle2 size={28} />
                    </div>
                    <div>
                       <h2 className="text-display-sm text-primary font-black uppercase tracking-tight">Xác nhận {newStatus}</h2>
                       <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Vui lòng cung cấp thêm thông tin</p>
                    </div>
                 </div>
                 <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-bg rounded-xl transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">
                       {newStatus === 'Resolved' ? 'Ghi chú xử lý / Giải pháp *' : 'Lý do hủy ticket *'}
                    </label>
                    <textarea 
                      className="w-full bg-bg/20 rounded-2xl p-5 text-small font-medium placeholder:text-muted outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all min-h-[150px]"
                      placeholder={newStatus === 'Resolved' ? "Mô tả cách bạn đã xử lý sự cố này (tối thiểu 20 ký tự)..." : "Tại sao yêu cầu này bị hủy?"}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                    />
                 </div>

                 <button 
                   className={cn(
                     "w-full h-14 rounded-[32px] font-black uppercase tracking-[3px] text-[13px] shadow-xl transition-all active:scale-95 disabled:opacity-50",
                     newStatus === 'Resolved' ? "bg-success shadow-success/20" : "bg-danger shadow-danger/20"
                   )}
                   disabled={(newStatus === 'Resolved' && resolutionNote.length < 20) || !resolutionNote.trim() || updateStatusMutation.isPending}
                   onClick={() => updateStatusMutation.mutate({ status: newStatus!, resolution: resolutionNote })}
                 >
                    {updateStatusMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận thay đổi'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
