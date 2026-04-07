import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle2, XCircle, 
  Clock, Wallet, CreditCard, Landmark, 
  MoreVertical, Image as ImageIcon, ExternalLink,
  Check, X, Building2, User, DollarSign,
  ArrowRight, Download, Send, AlertCircle, FileText
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { PaymentTransaction, PaymentStatus, PaymentMethod } from '@/models/Payment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAdminFinanceRealtime } from '@/hooks/useAdminFinanceRealtime';

const PaymentList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeFilters, setActiveFilters] = useState({});

  useAdminFinanceRealtime();

  // Queries
  const { data: payments, isLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ['payments', activeFilters],
    queryFn: () => paymentService.getPayments(activeFilters)
  });

  const { data: pendingInfo } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: () => paymentService.getPendingCount()
  });

  // Mutations
  // 4.1.4 Optimistic update (Checklist #4)
  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentService.approvePayment(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['payments'] });
      const previousPayments = queryClient.getQueriesData<PaymentTransaction[]>({ queryKey: ['payments'] });
      queryClient.setQueriesData({ queryKey: ['payments'] }, (old: PaymentTransaction[] | undefined) => 
        old?.map(p => p.id === id ? { ...p, status: 'Confirmed' as PaymentStatus } : p)
      );
      return { previousPayments };
    },
    onError: (err, id, context) => {
      context?.previousPayments?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error('Duyệt thất bại, vui lòng thử lại');
    },
    onSuccess: () => {
      toast.success('Đã duyệt giao dịch');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    }
  });

  const [rejectionId, setRejectionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => paymentService.rejectPayment(id, reason),
    onSuccess: () => {
      toast.warning('Đã từ chối giao dịch');
      setRejectionId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
    }
  });

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash': return <Wallet className="text-orange-500" size={16} />;
      case 'BankTransfer': return <Landmark className="text-blue-500" size={16} />;
      case 'VNPay': return <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-[8px] text-white font-bold">VN</div>;
      case 'Momo': return <div className="w-4 h-4 bg-pink-500 rounded flex items-center justify-center text-[8px] text-white font-bold">M</div>;
      case 'ZaloPay': return <div className="w-4 h-4 bg-blue-400 rounded flex items-center justify-center text-[8px] text-white font-bold">Z</div>;
      default: return <CreditCard size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-primary">Quản lý Giao dịch</h1>
          <p className="text-body text-muted">Xác nhận thanh toán, theo dõi dòng tiền và đối soát ví.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2">
            <Download size={18} /> Xuất Excel
          </button>
          <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
            <CheckCircle2 size={18} /> Đối soát tự động
          </button>
        </div>
      </div>

      {/* 4.1.1 Sticky Pending Panel */}
      {pendingInfo && pendingInfo.count > 0 && (
        <div className="sticky top-4 z-20 bg-[#FFFBEB] border border-orange-200 p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-orange-100/50 backdrop-blur-md animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <Clock size={20} className="animate-pulse" />
             </div>
             <div>
                <p className="text-body font-black text-orange-800 uppercase tracking-tight">
                  {pendingInfo.count} giao dịch chờ xác nhận — Tổng: {formatVND(pendingInfo.total)}
                </p>
                <p className="text-[11px] text-orange-700/70 font-bold uppercase tracking-widest mt-0.5">Vui lòng kiểm tra minh chứng trước khi duyệt.</p>
             </div>
          </div>
          <button className="btn-primary bg-orange-600 hover:bg-orange-700 border-none px-8 py-3 text-small shadow-xl shadow-orange-600/20">Duyệt tất cả</button>
        </div>
      )}

      {/* 4.1.2 Filter Panel */}
      <div className="card-container p-6 bg-white/60 backdrop-blur-md border-white/40 shadow-xl shadow-primary/5">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
               <input type="text" placeholder="Tìm theo mã GD, hóa đơn, cư dân..." className="input-base w-full pl-12 h-12" />
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Phương thức</label>
               <select className="input-base w-full h-11 bg-white/50">
                  <option>Tất cả phương thức</option>
                  <option>Tiền mặt</option>
                  <option>Chuyển khoản</option>
                  <option>VNPay</option>
                  <option>MoMo</option>
                  <option>ZaloPay</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Trạng thái</label>
               <select className="input-base w-full h-11 bg-white/50">
                  <option>Tất cả trạng thái</option>
                  <option>Đang chờ</option>
                  <option>Đã xác nhận</option>
                  <option>Đã từ chối</option>
                  <option>Đã hoàn tiền</option>
               </select>
            </div>

            <div className="flex flex-col justify-end">
               <button className="h-11 btn-outline flex items-center justify-center gap-2 border-2 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300">
                  <Filter size={18} /> Lọc nâng cao
               </button>
            </div>
         </div>
      </div>

      {/* 4.1.3 Data Table */}
      <div className="card-container overflow-hidden">
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead className="bg-bg/50 border-b border-border/50">
               <tr>
                 <th className="px-6 py-4 text-label text-muted">Mã Giao Dịch</th>
                 <th className="px-6 py-4 text-label text-muted">Thông tin gốc</th>
                 <th className="px-6 py-4 text-label text-muted">Số tiền</th>
                 <th className="px-6 py-4 text-label text-muted">Phương thức</th>
                 <th className="px-6 py-4 text-label text-muted text-center">Trạng thái</th>
                 <th className="px-6 py-4 text-label text-muted">Ngày TT</th>
                 <th className="px-6 py-4 text-label text-muted text-center">Minh chứng</th>
                 <th className="px-6 py-4 text-label text-muted text-right">Thao tác</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border/20">
               {isLoading ? (
                 <tr><td colSpan={8} className="py-20 text-center"><Spinner /></td></tr>
               ) : payments?.map((p) => (
                 <tr key={p.id} className="group hover:bg-bg/10 transition-colors">
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <span className="font-mono font-bold text-primary">{p.transactionCode}</span>
                         <button onClick={() => {
                           navigator.clipboard.writeText(p.transactionCode);
                           toast.success('Đã sao chép mã GD');
                         }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg rounded transition-all">
                           <ImageIcon size={12} className="text-muted" />
                         </button>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span onClick={() => navigate(`/invoices/${p.invoiceId}`)} className="text-small font-bold text-text hover:text-primary cursor-pointer flex items-center gap-1">
                          <FileText size={12} /> {p.invoiceCode}
                        </span>
                        <span onClick={() => navigate(`/tenants/${p.tenantId}`)} className="text-[10px] text-muted hover:text-primary cursor-pointer flex items-center gap-1">
                          <User size={10} /> {p.tenantName}
                        </span>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <span className="text-body font-black text-secondary">{formatVND(p.amount)}</span>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         {getMethodIcon(p.method)}
                         <span className="text-small font-medium">{t(`paymentMethod.${p.method}`, p.method)}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <StatusBadge status={p.status} />
                   </td>
                   <td className="px-6 py-4 text-small text-muted font-medium">
                      {formatDate(p.paidAt)}
                   </td>
                   <td className="px-6 py-4 text-center">
                      {p.evidenceImage ? (
                        <div className="relative group/img inline-block cursor-zoom-in">
                          <img src={p.evidenceImage} className="w-10 h-10 object-cover rounded-lg border border-border shadow-sm" alt="Evidence" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-lg transition-all">
                             <ExternalLink size={12} className="text-white" />
                          </div>
                        </div>
                      ) : <span className="text-muted text-[10px]">N/A</span>}
                   </td>
                   <td className="px-6 py-4 text-right">
                      {p.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2 animate-in fade-in zoom-in-95 duration-300">
                           {rejectionId === p.id ? (
                             <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                <input 
                                  className="input-base py-1 px-2 text-[10px] w-24" 
                                  placeholder="Lý do..." 
                                  autoFocus
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') rejectMutation.mutate({ id: p.id, reason: rejectionReason });
                                    if (e.key === 'Escape') setRejectionId(null);
                                  }}
                                />
                                <button onClick={() => rejectMutation.mutate({ id: p.id, reason: rejectionReason })} className="p-1 bg-danger text-white rounded hover:bg-danger/80"><Check size={14} /></button>
                                <button onClick={() => setRejectionId(null)} className="p-1 bg-bg text-muted rounded hover:bg-border"><X size={14} /></button>
                             </div>
                           ) : (
                             <>
                               <button 
                                 onClick={() => approveMutation.mutate(p.id)}
                                 className="flex items-center gap-1 px-3 py-1 bg-success/10 text-success text-[10px] font-bold rounded-lg border border-success/20 hover:bg-success hover:text-white transition-all"
                               >
                                  <Check size={12} /> Duyệt
                               </button>
                               <button 
                                 onClick={() => setRejectionId(p.id)}
                                 className="flex items-center gap-1 px-3 py-1 bg-danger/10 text-danger text-[10px] font-bold rounded-lg border border-danger/20 hover:bg-danger hover:text-white transition-all"
                               >
                                  <X size={12} /> Từ chối
                               </button>
                             </>
                           )}
                        </div>
                      ) : (
                        <button className="p-2 hover:bg-bg rounded-lg text-muted">
                           <MoreVertical size={18} />
                        </button>
                      )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted font-bold uppercase tracking-widest px-4">
         <p>Hiển thị {payments?.length} giao dịch gần nhất</p>
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-success"><CheckCircle2 size={12} /> 100% Khớp Ledger</span>
            <span className="flex items-center gap-1"><AlertCircle size={12} /> Sync: 2 phút trước</span>
         </div>
      </div>
    </div>
  );
};

export default PaymentList;
