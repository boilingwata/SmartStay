import React, { useState } from 'react';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, 
  History, ShieldCheck, ChevronRight, FileText,
  AlertTriangle, CheckCircle2, TrendingUp, Info, X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { TenantBalanceTransaction, TransactionType } from '@/models/TenantBalance';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { TopUpModal, DeductModal, AutoOffsetModal } from './components/BalanceModals';

const TenantBalance = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'topup' | 'deduct' | 'offset' | null>(null);

  const handleOnboardingAction = (key: string) => {
    // toast.success(`Đã cập nhật bước: ${key}`); // Commented out as toast is not imported
    // Simulated confetti if reached 100%
    // if (onboarding && onboarding.completionPercent >= 80) { // onboarding and setShowConfetti are not defined
    //   setShowConfetti(true);
    //   toast.success('CHÚC MỪNG! Quy trình Onboarding đã hoàn tất 100%.', {
    //     description: 'Dữ liệu cư dân đã được đồng bộ vào Ledger bảo mật.',
    //     icon: <CheckCircle2 className="text-success" />,
    //     duration: 8000
    //   });
    //   setTimeout(() => setShowConfetti(false), 8000);
    // }
  };

  // Queries
  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['tenantBalance', id],
    queryFn: () => paymentService.getTenantBalance(id || '')
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery<TenantBalanceTransaction[]>({
    queryKey: ['tenantLedger', id],
    queryFn: () => paymentService.getTenantLedger(id || '')
  });

  const getTypeStyle = (type: TransactionType) => {
    switch (type) {
      case 'ManualTopUp': return 'text-success bg-success/10';
      case 'ManualDeduct': return 'text-danger bg-danger/10';
      case 'Overpayment': return 'text-secondary bg-secondary/10';
      case 'AutoOffset': return 'text-primary bg-primary/10';
      case 'Refund': return 'text-warning bg-warning/10';
      default: return 'text-muted bg-bg';
    }
  };

  // 4.5 Integrity Check logic (Checklist #3)
  const isRowCorrupted = (r: TenantBalanceTransaction) => {
    return Math.abs(r.balanceBefore + r.amount - r.balanceAfter) > 0.01;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-small font-bold text-muted uppercase tracking-widest">
         <ShieldCheck size={16} /> Ledger Bảo Mật & Bất Biến (RULE-07)
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 4.4.1 Balance Card */}
        <div className="lg:col-span-1">
          <div className={cn(
            "card-container p-8 relative overflow-hidden group border-2 transition-all",
            balance && balance.currentBalance >= 0 ? "border-success/20 bg-success/5 shadow-success/10" : "border-danger/20 bg-danger/5 shadow-danger/10"
          )}>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
               <div className={cn(
                 "w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl",
                 balance && balance.currentBalance >= 0 ? "bg-success text-white" : "bg-danger text-white"
               )}>
                  <DollarSign size={32} />
               </div>
               <div>
                  <p className="text-small font-black text-muted uppercase tracking-widest mb-2">Số dư hiện tại</p>
                  <h1 className={cn(
                    "text-[42px] font-display font-black tracking-tighter",
                    balance && balance.currentBalance >= 0 ? "text-success" : "text-danger"
                  )}>
                    {formatVND(balance?.currentBalance || 0)}
                  </h1>
                  <p className="text-[10px] text-muted font-bold mt-2 italic flex items-center gap-1 justify-center">
                    <History size={10} /> Cập nhật lúc {balance && formatDate(balance.lastUpdatedAt)}
                  </p>
               </div>

               <div className="w-full grid grid-cols-2 gap-3 pt-6 border-t border-border/20">
                  <button 
                    onClick={() => setActiveModal('topup')}
                    className="btn-primary flex items-center justify-center gap-2 py-3 text-small"
                  >
                     <ArrowUpRight size={16} /> Nạp tiền
                  </button>
                  <button 
                    onClick={() => setActiveModal('deduct')}
                    className="btn-outline flex items-center justify-center gap-2 py-3 text-small"
                  >
                     <ArrowDownRight size={16} /> Khấu trừ
                  </button>
                  <button 
                    onClick={() => setActiveModal('offset')}
                    className="btn-outline col-span-2 flex items-center justify-center gap-2 py-3 text-small"
                  >
                     <TrendingUp size={16} /> Bù trừ hóa đơn
                  </button>
               </div>
            </div>
            
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <DollarSign size={120} />
            </div>
          </div>
        </div>

        {/* 4.5 Ledger Table */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-h3 text-primary">Lịch sử biến động ví</h3>
              <div className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase">
                 <span className="flex items-center gap-1"><History size={12} /> Realtime Sync</span>
                 <span className="flex items-center gap-1"><Info size={12} /> Bất biến</span>
              </div>
           </div>

           <div className="card-container overflow-hidden bg-white shadow-xl shadow-primary/5">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-bg/40 border-b">
                      <tr>
                        <th className="px-6 py-4 text-label text-muted">Loại GD</th>
                        <th className="px-6 py-4 text-label text-muted">Số tiền</th>
                        <th className="px-6 py-4 text-label text-muted">Trước / Sau</th>
                        <th className="px-6 py-4 text-label text-muted">Liên quan</th>
                        <th className="px-6 py-4 text-label text-muted">Thời điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                       {ledgerLoading ? (
                         <tr><td colSpan={5} className="py-20 text-center"><Spinner /></td></tr>
                       ) : ledger?.map((r) => {
                         const corrupted = isRowCorrupted(r);
                         return (
                           <tr key={r.id} className={cn(
                             "group transition-colors",
                             corrupted ? "bg-danger/10" : "hover:bg-bg/10"
                           )}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight",
                                    getTypeStyle(r.type)
                                  )}>
                                    {r.type}
                                  </span>
                                  {corrupted && (
                                    <div className="group/err relative">
                                       <AlertTriangle size={14} className="text-danger" />
                                       <div className="absolute left-full ml-2 w-48 p-2 bg-danger text-white text-[9px] rounded-lg opacity-0 group-hover/err:opacity-100 z-50">
                                          Lỗi toàn vẹn dữ liệu! BalanceBefore + Amount != BalanceAfter.
                                       </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={cn(
                                   "text-body font-black",
                                   r.amount >= 0 ? "text-success" : "text-danger"
                                 )}>
                                   {r.amount >= 0 ? '+' : ''}{formatVND(r.amount)}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-muted">
                                    <span>{formatVND(r.balanceBefore)}</span>
                                    <ChevronRight size={10} />
                                    <span className="text-text">{formatVND(r.balanceAfter)}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 {r.relatedInvoiceId ? (
                                   <div onClick={() => navigate(`/invoices/${r.relatedInvoiceId}`)} className="flex items-center gap-1 text-primary cursor-pointer hover:underline text-small font-bold">
                                      <FileText size={14} /> {r.relatedInvoiceCode}
                                   </div>
                                 ) : (
                                   <span className="text-small text-muted">{r.note || 'Manual'}</span>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-small text-muted font-medium">
                                 {formatDate(r.createdAt)}
                              </td>
                           </tr>
                         );
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'topup' && (
        <TopUpModal tenantId={id || ''} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'deduct' && (
        <DeductModal tenantId={id || ''} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'offset' && (
        <AutoOffsetModal tenantId={id || ''} onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
};

export default TenantBalance;
