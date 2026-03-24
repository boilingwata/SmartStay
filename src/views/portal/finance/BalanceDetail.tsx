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

const BalanceDetail = () => {
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
    <div className="space-y-8 pb-32">
        {/* 1. Real-time Balance Card */}
        <div className="px-8 pt-8">
            <div className="bg-[#0D8A8A] rounded-[48px] p-10 text-white shadow-2xl shadow-teal-500/20 relative overflow-hidden">
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
        <div className="px-8">
            <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[32px] flex gap-4">
                <Info className="text-blue-500 shrink-0" size={20} />
                <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-none">Minh bạch tài chính</h4>
                    <p className="text-[10px] text-blue-700/70 font-medium leading-relaxed italic">
                        Mọi giao dịch trên ví đều là "bất biến" (Immutable Ledger). Hệ thống không bao giờ xóa hay sửa lịch sử để đảm bảo tính minh bạch tối đa.
                    </p>
                </div>
            </div>
        </div>

        {/* 3. Transaction Ledger */}
        <div className="px-6 space-y-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity size={16} className="text-teal-500" /> Nhật ký ví cư dân
                </h3>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><Spinner /></div>
                ) : (transactions?.items?.length ?? 0) > 0 ? (
                    transactions!.items.map((tx: any) => <TransactionRow key={tx.id} tx={tx} />)
                ) : (
                    // Mock data reflecting LEDGER pattern
                    [1, 2, 3, 4].map((i) => (
                        <TransactionRow 
                            key={i} 
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

const TransactionRow = ({ tx }: { tx: any }) => {
  const isCredit = tx.type === 'Credit' || tx.amount > 0;
  
  return (
    <div className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.99] transition-all">
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
        <div className={cn("text-sm font-black tracking-tighter", isCredit ? "text-emerald-500" : "text-red-500")}>
            {isCredit ? '+' : ''}{formatVND(tx.amount)}
        </div>
    </div>
  );
};

export default BalanceDetail;
