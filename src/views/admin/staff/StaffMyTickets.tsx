import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  AlertCircle, LayoutGrid, List, Search, 
  Filter, CheckCircle2, Clock
} from 'lucide-react';
import { ticketService } from '@/services/ticketService';
import { TicketSummary, TicketStatus } from '@/models/Ticket';
import { TicketKanban } from '@/components/tickets/TicketKanban';
import useAuthStore from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/utils';
import { ConfirmDialog, Modal } from '@/components/shared';
import { useConfirm } from '@/hooks/useConfirm';

interface ResolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { resolutionNote: string; rootCause: string }) => void;
  loading: boolean;
}

const ResolveTicketModal = ({ isOpen, onClose, onSubmit, loading }: ResolveModalProps) => {
  const [note, setNote] = useState('');
  const [cause, setCause] = useState('');

  const isValid = note.trim().length >= 20 && cause.trim().length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hoàn thành xử lý Ticket">
      <div className="space-y-6">
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted tracking-widest pl-1">Nguyên nhân gốc rễ (Root Cause)</label>
            <textarea 
              value={cause}
              onChange={(e) => setCause(e.target.value)}
              className="input-base w-full min-h-[80px] py-3 h-auto"
              placeholder="VD: Do dây dẫn bị chuột cắn, thiết bị quá tải..."
            />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted tracking-widest pl-1">Ghi chú xử lý (Resolution Note)</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-base w-full min-h-[120px] py-3 h-auto"
              placeholder="Mô tả chi tiết quá trình xử lý (tối thiểu 20 ký tự)..."
            />
            <p className={cn("text-[9px] font-bold italic", note.length < 20 ? "text-danger" : "text-success")}>
               Đã nhập: {note.length}/20 ký tự
            </p>
         </div>
         <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-border text-[11px] font-black uppercase tracking-widest hover:bg-bg transition-all">Hủy</button>
            <button 
              onClick={() => onSubmit({ resolutionNote: note, rootCause: cause })}
              disabled={!isValid || loading}
              className="flex-1 h-12 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-primary/20"
            >
              Xác nhận hoàn thành
            </button>
         </div>
      </div>
    </Modal>
  );
};

const StaffMyTickets = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketSummary | null>(null);

  const { data: tickets, isLoading, refetch } = useQuery<TicketSummary[]>({
    queryKey: ['my-tickets', user?.id, search],
    queryFn: () => ticketService.getTickets({ 
      assignedTo: user?.id,
      search,
      status: ['new', 'in_progress', 'pending_confirmation'] // Default Filter: Active only
    })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string, status: TicketStatus, resolution?: { resolutionNote?: string, rootCause?: string } }) => 
      ticketService.updateStatus(id, status, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast.success('Cập nhật trạng thái thành công');
      setIsResolveModalOpen(false);
      setSelectedTicket(null);
    }
  });

  const handleResolveAction = (ticket: TicketSummary) => {
    setSelectedTicket(ticket);
    setIsResolveModalOpen(true);
  };

  const onResolveSubmit = (data: { resolutionNote: string, rootCause: string }) => {
    if (selectedTicket) {
      updateStatusMutation.mutate({ 
        id: selectedTicket.id, 
        status: 'Resolved',
        resolution: data
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-display text-primary leading-tight">Vé yêu cầu của tôi</h1>
          <p className="text-body text-muted font-medium italic">Chỉ hiển thị các yêu cầu ĐANG XỬ LÝ được phân công cho bạn.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="input-base w-full pl-12 pr-4 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-bg/50 p-1 rounded-xl border border-border/10">
             <button 
               onClick={() => setViewMode('kanban')}
               className={cn("p-2 rounded-lg transition-all", viewMode === 'kanban' ? "bg-white text-primary shadow-sm" : "text-muted")}
             >
                <LayoutGrid size={18} />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-muted")}
             >
                <List size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 py-2 border-b border-dashed">
         <div className="flex items-center gap-2 bg-warning/10 text-warning px-4 py-1.5 rounded-full border border-warning/20 text-[10px] font-black uppercase tracking-widest">
            <Clock size={12} /> Cần xử lý gấp
         </div>
         <div className="flex items-center gap-2 bg-success/10 text-success px-4 py-1.5 rounded-full border border-success/20 text-[10px] font-black uppercase tracking-widest">
            <CheckCircle2 size={12} /> Sẵn sàng đóng
         </div>
      </div>

      {isLoading ? (
        <div className="py-40 flex justify-center">
           <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <TicketKanban
          tickets={tickets || []}
          columns={['Open', 'InProgress', 'Resolved']}
          onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
          onTicketClick={(id) => navigate(`/tickets/${id}`)}
        />
      ) : (
        <div className="card-container p-0 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-bg/50 border-b">
                <tr>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Ticket</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Vấn đề</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Trạng thái</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-red-500">SLA Breach</th>
                   <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Thao tác</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-border/10">
                {tickets?.map(t => {
                   const isSlaBreached = new Date(t.slaDeadline) < new Date() && t.status !== 'Resolved';
                   const needsRating = t.status === 'Resolved';

                   return (
                      <tr key={t.id} className={cn(
                        "hover:bg-primary/[0.02] transition-colors",
                        needsRating ? "bg-warning/5" : "" // Highlight yellow for Resolved waiting for closing/rating
                      )}>
                         <td className="px-6 py-4 font-mono font-black text-primary">{t.ticketCode}</td>
                         <td className="px-6 py-4">
                            <p className="text-small font-bold text-primary">{t.title}</p>
                            <p className="text-[10px] text-muted">{t.roomName}</p>
                         </td>
                         <td className="px-6 py-4">
                            <div className={cn(
                               "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border",
                               t.status === 'Open' ? "bg-primary/10 text-primary border-primary/20" :
                               t.status === 'InProgress' ? "bg-warning/10 text-warning border-warning/20" :
                               "bg-success/10 text-success border-success/20"
                            )}>
                               {t.status}
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            {isSlaBreached && (
                               <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">BREACHED</span>
                            )}
                         </td>
                         <td className="px-6 py-4">
                            {t.status !== 'Resolved' && (
                               <button 
                                 onClick={() => handleResolveAction(t)}
                                 className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                               >
                                  Hoàn thành
                               </button>
                            )}
                         </td>
                      </tr>
                   );
                })}
             </tbody>
          </table>
        </div>
      )}
      
      <ResolveTicketModal 
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onSubmit={onResolveSubmit}
        loading={updateStatusMutation.isPending}
      />
      
      <ConfirmDialog />
    </div>
  );
};

export default StaffMyTickets;
