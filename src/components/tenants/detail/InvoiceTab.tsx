import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText } from 'lucide-react';

import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge';
import { formatDate, formatVND } from '@/utils';

interface InvoiceTabProps {
  invoices?: Array<{
    id: string;
    code: string;
    dueDate: string;
    status: string;
    amount: number;
    amountPaid?: number;
  }>;
}

export const InvoiceTab: React.FC<InvoiceTabProps> = ({ invoices }) => {
  const navigate = useNavigate();
  const displayInvoices = invoices || [];

  if (displayInvoices.length === 0) {
    return (
      <div className="card-container space-y-4 border-2 border-dashed bg-white/40 p-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-bg text-muted">
          <FileText size={40} />
        </div>
        <h3 className="text-h3 font-black uppercase tracking-widest text-primary">Chưa có hóa đơn</h3>
        <p className="mx-auto max-w-xs text-small italic text-muted">
          Cư dân này hiện chưa có hóa đơn tài chính nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="px-2">
        <h3 className="text-h3 font-black uppercase tracking-widest text-primary">Danh sách hóa đơn</h3>
        <p className="text-[10px] font-bold uppercase italic tracking-tighter text-muted">
          Dữ liệu tham khảo từ module tài chính
        </p>
      </div>

      <div className="card-container overflow-hidden border-none bg-white/40 p-0 shadow-2xl shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="border-b bg-slate-900 text-[9px] font-black uppercase tracking-[3px] text-white">
              <tr>
                <th className="px-8 py-5">Mã hóa đơn</th>
                <th className="border-l border-white/5 px-6 py-5">Hạn thanh toán</th>
                <th className="border-l border-white/5 px-6 py-5">Trạng thái</th>
                <th className="border-l border-white/5 px-6 py-5 text-right">Tổng tiền</th>
                <th className="border-l border-white/5 px-8 py-5 text-right">Thanh toán</th>
                <th className="border-l border-white/5 px-8 py-5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {displayInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="group cursor-pointer transition-all hover:bg-white"
                  onClick={() => navigate(`/owner/invoices/${invoice.id}`)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-primary transition-transform group-hover:scale-110">
                        <FileText size={18} />
                      </div>
                      <span className="text-small font-black uppercase tracking-tighter text-primary">{invoice.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono text-[12px] font-bold text-muted">{formatDate(invoice.dueDate)}</span>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={invoice.status as StatusBadgeProps['status']} size="sm" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-mono text-[14px] font-black text-secondary">{formatVND(invoice.amount)}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="font-mono text-[12px] font-bold text-muted">
                      {formatVND(invoice.amountPaid ?? 0)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/owner/invoices/${invoice.id}`);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
