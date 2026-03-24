import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  Calendar, 
  ChevronRight, 
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/layout/PortalLayout';
import portalFinanceService from '@/services/portalFinanceService';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';

const PaymentHistory = () => {
  const navigate = useNavigate();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['portal-payments-history'],
    queryFn: () => portalFinanceService.getPaymentHistory()
  });

  return (
    <div className="space-y-6 px-6 pt-6">
        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0D8A8A] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm giao dịch..."
            className="w-full h-14 bg-white rounded-2xl pl-12 pr-4 text-sm font-medium border-2 border-transparent focus:border-[#0D8A8A]/20 focus:bg-white shadow-sm transition-all outline-none"
          />
        </div>

        {/* Payment List */}
        <div className="space-y-4 pb-32">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Spinner />
            </div>
          ) : (payments?.items?.length ?? 0) > 0 ? (
            payments!.items.map((payment: any) => (
              <PaymentCard key={payment.id} payment={payment} onClick={() => navigate(`/portal/invoices/${payment.invoiceId}`)} />
            ))
          ) : (
            // Mock data for demonstration if API is empty
            [1, 2, 3].map((i) => (
              <PaymentCard 
                key={i} 
                payment={{
                  id: `PAY-${1000 + i}`,
                  amount: 5500000,
                  method: i % 2 === 0 ? 'Chuyển khoản' : 'Ví điện tử',
                  status: 'Success',
                  createdAt: new Date(Date.now() - i * 86400000 * 30).toISOString(),
                  description: `Thanh toán tiền phòng tháng ${12 - i}/2023`
                }} 
              />
            ))
          )}
        </div>
    </div>
  );
};

const PaymentCard = ({ payment, onClick }: { payment: any; onClick?: () => void }) => {
  const statusConfig = {
    Success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Thành công' },
    Pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Đang xử lý' },
    Failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Thất bại' },
  }[payment.status as 'Success' | 'Pending' | 'Failed'] || { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Thành công' };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", statusConfig.bg, statusConfig.color)}>
          <CreditCard size={24} strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">{payment.id}</span>
            <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter", statusConfig.bg, statusConfig.color)}>
               <statusConfig.icon size={8} /> {statusConfig.label}
            </div>
          </div>
          <h4 className="text-sm font-black text-slate-800 tracking-tight leading-none uppercase">{payment.description}</h4>
          <p className="text-[10px] font-medium text-slate-400">{formatDate(payment.createdAt)} • {payment.method}</p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <span className="text-sm font-black text-[#0D8A8A] tracking-tighter">{formatVND(payment.amount)}</span>
        <button className="p-1.5 bg-slate-50 rounded-lg text-slate-300 group-hover:bg-[#0D8A8A] group-hover:text-white transition-all shadow-sm">
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

export default PaymentHistory;
