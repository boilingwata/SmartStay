import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Download, Eye, 
  CreditCard, Send, MoreVertical,
  Plus
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatVND, formatDate } from '@/utils';

interface InvoiceTabProps {
  invoices?: any[];
}

export const InvoiceTab: React.FC<InvoiceTabProps> = ({ invoices }) => {
  const navigate = useNavigate();
  
  // Dummy data for visual excellence if empty
  const displayInvoices = invoices || [
    { id: 'INV-001', code: 'INV/2024/001', amount: 3500000, status: 'Pending', dueDate: '2024-03-05' },
    { id: 'INV-002', code: 'INV/2024/002', amount: 15450000, status: 'Paid', dueDate: '2024-02-05' },
    { id: 'INV-003', code: 'INV/2024/003', amount: 1200000, status: 'Overdue', dueDate: '2024-01-05' },
  ];
  
  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex justify-between items-center px-2">
         <div>
            <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Danh sách Hoá đơn</h3>
            <p className="text-[10px] text-muted font-bold uppercase tracking-tighter italic">Lịch sử tài chính của cư dân</p>
         </div>
         <button className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
            <Plus size={16} /> Tạo hoá đơn lẻ
         </button>
      </div>

      <div className="card-container p-0 overflow-hidden bg-white/40 border-none shadow-2xl shadow-primary/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 border-b text-[9px] font-black uppercase text-white tracking-[3px]">
              <tr>
                <th className="px-8 py-5">Mã Hoá đơn</th>
                <th className="px-6 py-5 border-l border-white/5">Hạn thanh toán</th>
                <th className="px-6 py-5 border-l border-white/5">Trạng thái</th>
                <th className="px-6 py-5 border-l border-white/5 text-right">Tổng tiền</th>
                <th className="px-8 py-5 border-l border-white/5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {displayInvoices.map((inv) => (
                <tr key={inv.id} className="group hover:bg-white transition-all cursor-pointer" onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                  <td className="px-8 py-5">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-bg rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                           <FileText size={18} />
                        </div>
                        <span className="text-small font-black text-primary uppercase tracking-tighter">{inv.code}</span>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                     <span className="text-[12px] font-bold text-muted font-mono">{formatDate(inv.dueDate)}</span>
                  </td>
                  <td className="px-6 py-5">
                     <StatusBadge status={inv.status} size="sm" />
                  </td>
                  <td className="px-6 py-5 text-right">
                     <span className="text-[14px] font-black text-secondary font-mono">{formatVND(inv.amount)}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors" title="Xem chi tiết"><Eye size={16} /></button>
                        <button className="p-2 hover:bg-success/10 text-success rounded-lg transition-colors" title="Gửi email"><Send size={16} /></button>
                        <button className="p-2 hover:bg-bg text-muted rounded-lg transition-colors"><MoreVertical size={16} /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
               <CreditCard size={24} />
            </div>
            <div>
               <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none mb-1">Thanh toán tự động</p>
               <p className="text-small text-muted font-medium italic">Tiết kiệm thời gian với cổng thanh toán VNPay/App cư dân</p>
            </div>
         </div>
         <button className="btn-outline px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Thiết lập ngay</button>
      </div>
    </div>
  );
};
