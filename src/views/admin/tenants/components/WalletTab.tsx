import React from 'react';
import { Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import { TenantBalanceTransaction } from '@/models/Tenant';
import { formatDate, formatVND, cn } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';

interface WalletTabProps {
  transactions: TenantBalanceTransaction[] | undefined;
  isLoading: boolean;
}

export const WalletTab: React.FC<WalletTabProps> = ({ transactions, isLoading }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="card-container p-10 bg-slate-900 border-none relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-[11px] text-white/50 font-black uppercase tracking-widest mb-2">Số dư Ledger hiện hữu</p>
          <h2 className="text-[48px] font-display font-black text-white tracking-tighter leading-none">
            {formatVND(24500000)}
          </h2>
        </div>
        <Wallet size={200} className="absolute -bottom-20 -right-20 text-white/5 group-hover:scale-110 transition-transform duration-700" />
      </div>

      <div className="card-container p-0 overflow-hidden bg-white/60">
        <div className="p-6 border-b flex justify-between items-center bg-bg/30">
          <h3 className="text-label text-muted font-black uppercase tracking-widest">Sổ cái giao dịch (Immutable Ledger)</h3>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-success/10 text-success rounded-lg">
              <ShieldCheck size={16} />
            </div>
            <span className="text-[10px] font-black uppercase text-success">Blockchain Verified</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-20 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-bg/50 border-b text-[9px] font-black uppercase text-muted tracking-widest">
                <tr>
                  <th className="px-8 py-4">Ngày giao dịch</th>
                  <th className="px-8 py-4">Mô tả</th>
                  <th className="px-8 py-4">Loại</th>
                  <th className="px-8 py-4 text-right">Số tiền</th>
                  <th className="px-8 py-4 text-right">Số dư sau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {transactions?.map((tx) => (
                  <tr key={tx.id} className="hover:bg-bg/20 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-small font-bold text-primary">{formatDate(tx.createdAt)}</p>
                      <p className="text-[9px] text-muted font-mono">{tx.id}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-small font-medium text-slate-700">{tx.description}</p>
                      {tx.referenceId && <p className="text-[9px] text-primary font-bold">Ref: {tx.referenceId}</p>}
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                        tx.type === 'Payment' ? "bg-success/10 text-success" :
                        tx.type === 'Correction' ? "bg-warning/10 text-warning" : "bg-bg text-muted"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={cn("px-8 py-5 text-right font-mono font-black", tx.amount > 0 ? "text-success" : "text-danger")}>
                      {tx.amount > 0 ? '+' : ''}{formatVND(tx.amount)}
                    </td>
                    <td className="px-8 py-5 text-right font-mono font-bold text-primary">
                      {formatVND(tx.balanceAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-6 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={18} />
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            **RULE-07 Notice:** Đây là sổ cái bất biến (Immutable Ledger). Toàn bộ giao dịch không thể bị sửa đổi hoặc xóa sau khi đã ghi nhận. Mọi sai sót phải được xử lý bằng một bút toán đảo (Reversal Entry) mới.
          </p>
        </div>
      </div>
    </div>
  );
};
