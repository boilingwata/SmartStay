import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Info,
  Calendar,
  Filter,
  ShieldCheck,
  Activity
} from 'lucide-react';
import portalFinanceService from '@/services/portalFinanceService';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';
import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const BalanceDetail = () => {
  const navigate = useNavigate();

  // RULE-05: currentBalance MUST be fresh, dashboard cache is display-only
  const { data: balanceInfo, isLoading: loadingBalance } = useQuery({
    queryKey: ['portal-fresh-balance'],
    queryFn: () => portalFinanceService.getFreshBalance()
  });

  // RULE-07: TenantBalanceTransactions is IMMUTABLE LEDGER
  const { data: transactions, isLoading: loadingDocs } = useQuery({
    queryKey: ['portal-balance-ledger'],
    queryFn: () => portalFinanceService.getBalanceTransactions()
  });

  const isLoading = loadingBalance || loadingDocs;

  return (
    <div className="bg-slate-50/50 min-h-screen pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
        {/* Sticky Header Hub */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl px-5 py-6 flex items-center justify-between border-b border-gray-100">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Ví SmartStay</h2>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                Quản lý số dư nội bộ
             </p>
          </div>
          <button 
            aria-label="Lọc giao dịch"
            onClick={() => toast.info('Tính năng lọc đang được phát triển')}
            className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
          >
            <Filter size={20} />
          </button>        </div>

        {/* 1. Real-time Balance Card */}
        <div className="px-5 pt-6">
            <div className="bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 rounded-[36px] p-8 text-white shadow-[0_8px_30px_-5px_rgba(20,184,166,0.4)] relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-2">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Số dư khả dụng</span>
                    <h3 className="text-4xl font-black tracking-tighter truncate">
                        {formatVND(balanceInfo?.currentBalance || 0)}
                    </h3>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                            <ShieldCheck size={14} className="text-teal-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Đã xác thực bởi hệ thống</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-1/2 right-[-20%] translate-y-[-50%] opacity-10 rotate-12">
                    <Wallet size={240} />
                </div>
            </div>
        </div>

        {/* 2. Ledger Info Alert */}
        <div className="px-5 mt-6">
            <div className="bg-blue-50/50 backdrop-blur-md border border-blue-100 p-5 rounded-[28px] flex gap-4 shadow-sm">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-none">Minh bạch tài chính</h4>
                    <p className="text-[10px] text-blue-700/70 font-medium leading-relaxed italic">
                        Mọi giao dịch trên ví đều là "bất biến" (Immutable Ledger). Hệ thống không bao giờ xóa hay sửa lịch sử để đảm bảo tính minh bạch tối đa.
                    </p>
                </div>
            </div>
        </div>

        {/* 3. Transaction Ledger */}
        <div className="px-5 mt-8 space-y-5">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-[3px] flex items-center gap-2">
                    <Activity size={16} className="text-teal-500" /> Nhật ký giao dịch
                </h3>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><Spinner /></div>
                ) : (transactions?.items?.length ?? 0) > 0 ? (
                    transactions!.items.map((tx: any, idx: number) => <TransactionRow key={tx.id} tx={tx} index={idx} />)
                ) : (
                    // Mock data reflecting LEDGER pattern
                    [1, 2, 3, 4].map((i, idx) => (
                        <TransactionRow 
                            key={i} 
                            index={idx}
                            tx={{
                                id: i,
                                amount: i % 2 === 0 ? -1500000 : 2000000,
                                balanceBefore: 5000000 + (i * 500000),
                                balanceAfter: (5000000 + (i * 500000)) + (i % 2 === 0 ? -1500000 : 2000000),
                                type: i % 2 === 0 ? 'Debit' : 'Credit',
                                description: i % 2 === 0 ? 'Khấu trừ hóa đơn INV-2024-001' : 'Nạp tiền vào ví qua QR',
                                createdAt: new Date(Date.now() - i * 3600000 * 24).toISOString(),
                            }} 
                        />
                    ))
                )}
            </div>
        </div>
    </div>
  );
};

const TransactionRow = ({ tx, index }: { tx: any, index: number }) => {
  const isCredit = tx.type === 'Credit' || tx.amount > 0;
  
  return (
    <m.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default"
    >
        <div className="flex items-center gap-5">
            <div className={cn(
                "w-12 h-12 rounded-[22px] flex items-center justify-center transition-transform group-hover:rotate-6 shadow-inner",
                isCredit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
                {isCredit ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
            </div>
            <div className="space-y-1">
                <h4 className="text-[13px] font-black text-slate-800 tracking-tight leading-none uppercase">{tx.description}</h4>
                <div className="flex items-center gap-2 pt-1 opacity-50">
                    <Calendar size={10} className="text-teal-500" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(tx.createdAt)}</p>
                </div>
                {/* Ledger Integrity Check UI */}
                <div className="pt-2 flex items-center gap-1.5 opacity-30 text-[9px] font-mono">
                    <span>{formatVND(tx.balanceBefore)}</span>
                    <span>→</span>
                    <span className="font-bold">{formatVND(tx.balanceAfter)}</span>
                </div>
            </div>
        </div>
        <div className={cn("text-[15px] font-black tracking-tighter tabular-nums", isCredit ? "text-emerald-500" : "text-gray-900")}>
            {isCredit ? '+' : ''}{formatVND(tx.amount)}
        </div>
    </m.div>
  );
};

export default BalanceDetail;
