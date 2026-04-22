import React, { useState } from 'react';
import { 
  X, DollarSign, Calculator, AlertCircle, 
  Check, ArrowUpRight, ArrowDownRight, TrendingUp,
  FileText, Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { formatVND, cn } from '@/utils';
import { toast } from 'sonner';

interface ModalProps {
  tenantId: string;
  onClose: () => void;
}

export const TopUpModal = ({ tenantId, onClose }: ModalProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('Nạp tiền mặt');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentService.manualBalanceAdjustment(tenantId, amount, 'ManualTopUp', `${reason}: ${note}`),
    onSuccess: () => {
      toast.success('Đã nạp tiền vào ví');
      queryClient.invalidateQueries({ queryKey: ['tenantBalance', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenantLedger', tenantId] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-success/20 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-success text-white rounded-2xl flex items-center justify-center shadow-lg shadow-success/20">
                <ArrowUpRight size={24} />
             </div>
             <div>
                <h3 className="text-h3 text-primary uppercase font-black">Nạp tiền thủ công</h3>
                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">Chủ sở hữu / Thủ quỹ ghi nhận</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Số tiền nạp</label>
               <input 
                type="number" 
                className="input-base w-full h-14 pl-12 text-h4 font-black text-success bg-bg/30"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Lý do</label>
               <select className="input-base w-full h-12 bg-bg/30 font-bold" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option>Nạp tiền mặt</option>
                  <option>Nạp chuyển khoản</option>
                  <option>Điều chỉnh số dư</option>
                  <option>Khác</option>
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Ghi chú</label>
               <textarea className="input-base w-full p-4 min-h-[80px] bg-bg/30" placeholder="..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
             <button onClick={onClose} className="btn-outline flex-1 py-4 font-bold border-2">Hủy</button>
             <button 
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending || amount <= 0}
              className="btn-primary flex-[2] py-4 bg-success hover:bg-success-dark border-none shadow-xl shadow-success/20 font-black uppercase tracking-widest transition-all"
             >
                {mutation.isPending ? 'Đang nạp...' : 'Xác nhận nạp'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeductModal = ({ tenantId, onClose }: ModalProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('Khấu trừ phí phát sinh');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentService.manualBalanceAdjustment(tenantId, -amount, 'ManualDeduct', `${reason}: ${note}`),
    onSuccess: () => {
      toast.warning('Đã khấu trừ từ ví');
      queryClient.invalidateQueries({ queryKey: ['tenantBalance', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenantLedger', tenantId] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-danger/10 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden border border-white/50 animate-in zoom-in-95 duration-300">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-danger text-white rounded-2xl flex items-center justify-center shadow-lg shadow-danger/20">
                <ArrowDownRight size={24} />
             </div>
             <div>
                <h3 className="text-h3 text-primary uppercase font-black">Khấu trừ thủ công</h3>
                <p className="text-[10px] text-muted font-bold tracking-widest uppercase">Chủ sở hữu ghi nhận khấu trừ</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Số tiền khấu trừ</label>
               <input 
                type="number" 
                className="input-base w-full h-14 pl-12 text-h4 font-black text-danger bg-bg/30"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
               />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Lý do</label>
               <select className="input-base w-full h-12 bg-bg/30 font-bold" value={reason} onChange={(e) => setReason(e.target.value)}>
                  <option>Khấu trừ phí phát sinh</option>
                  <option>Phạt vi phạm hợp đồng</option>
                  <option>Điều chỉnh số dư</option>
                  <option>Khác</option>
               </select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Ghi chú</label>
               <textarea className="input-base w-full p-4 min-h-[80px] bg-bg/30" placeholder="..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
             <button onClick={onClose} className="btn-outline flex-1 py-4 font-bold border-2">Hủy</button>
             <button 
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending || amount <= 0}
              className="btn-primary flex-[2] py-4 bg-danger hover:bg-danger-dark border-none shadow-xl shadow-danger/20 font-black uppercase tracking-widest transition-all"
             >
                {mutation.isPending ? 'Đang trừ...' : 'Xác nhận khấu trừ'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AutoOffsetModal = ({ tenantId, onClose }: ModalProps) => {
  const queryClient = useQueryClient();
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const { data: balance } = useQuery({
    queryKey: ['tenantBalance', tenantId],
    queryFn: () => paymentService.getTenantBalance(tenantId)
  });

  const { data } = useQuery({
    queryKey: ['tenantInvoices', tenantId],
    queryFn: () => invoiceService.getInvoices({ tenantId })
  });

  const unpaidInvoices = (data?.items || []).filter(i => (i.status === 'Unpaid' || i.status === 'Overdue') && i.tenantId === tenantId);
  const totalOffset = unpaidInvoices
    .filter(i => selectedInvoices.includes(i.id))
    .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  const balanceAfter = (balance?.currentBalance || 0) - totalOffset;

  const mutation = useMutation({
    mutationFn: () => paymentService.autoOffsetInvoices(tenantId, selectedInvoices),
    onSuccess: () => {
      toast.success('Đã bù trừ hóa đơn thành công');
      queryClient.invalidateQueries({ queryKey: ['tenantBalance', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenantLedger', tenantId] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/50 animate-in zoom-in-95 duration-500">
        <div className="flex-1 p-10 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                 <TrendingUp size={24} />
              </div>
              <div>
                 <h3 className="text-h3 text-primary uppercase font-black">Bù trừ hóa đơn</h3>
                 <p className="text-[10px] text-muted font-bold tracking-widest uppercase">Sử dụng số dư ví để thanh toán</p>
              </div>
           </div>

           <div className="space-y-4">
              <p className="text-[11px] font-black text-muted uppercase tracking-widest border-b pb-2">Danh sách hóa đơn còn nợ</p>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {unpaidInvoices.map(inv => (
                  <label key={inv.id} className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all",
                    selectedInvoices.includes(inv.id) ? "border-primary bg-primary/5" : "border-border/50 hover:bg-bg/50"
                  )}>
                    <div className="flex items-center gap-3">
                       <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-2"
                        checked={selectedInvoices.includes(inv.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedInvoices([...selectedInvoices, inv.id]);
                          else setSelectedInvoices(selectedInvoices.filter(id => id !== inv.id));
                        }}
                       />
                       <div>
                          <p className="text-small font-black text-primary">{inv.invoiceCode}</p>
                          <p className="text-[10px] text-muted font-bold uppercase">{inv.period}</p>
                       </div>
                    </div>
                    <span className="text-small font-black text-secondary">{formatVND(inv.totalAmount - inv.paidAmount)}</span>
                  </label>
                ))}
                {unpaidInvoices.length === 0 && <p className="text-center py-10 text-muted font-bold italic">Không có hóa đơn nợ</p>}
              </div>
           </div>
        </div>

        <div className="w-full md:w-[260px] bg-bg/50 border-l border-border/50 p-10 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="space-y-1">
                 <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Số dư ví hiện tại</p>
                 <p className="text-h4 font-black text-success">{formatVND(balance?.currentBalance || 0)}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Sẽ bù trừ</p>
                 <p className="text-h4 font-black text-danger">-{formatVND(totalOffset)}</p>
              </div>
              <div className="h-px bg-border/50"></div>
              <div className="space-y-1">
                 <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Sau khi bù trừ</p>
                 <p className={cn(
                    "text-h3 font-black",
                    balanceAfter < 0 ? "text-danger" : "text-primary"
                 )}>
                    {formatVND(balanceAfter)}
                 </p>
              </div>

              {balanceAfter < 0 && (
                <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-2 animate-in pulse duration-1000">
                   <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
                   <p className="text-[9px] text-danger font-bold leading-tight uppercase">Không đủ số dư ví để bù trừ hoàn toàn.</p>
                </div>
              )}
           </div>

           <div className="space-y-3 pt-6">
              <button 
                disabled={mutation.isPending || selectedInvoices.length === 0 || balanceAfter < 0}
                onClick={() => mutation.mutate()}
                className="btn-primary w-full py-4 bg-primary hover:bg-primary-dark border-none font-black uppercase tracking-widest text-[11px] disabled:opacity-50"
              >
                 {mutation.isPending ? 'Đang xử lý...' : 'Xác nhận bù trừ'}
              </button>
              <button onClick={onClose} className="btn-outline w-full py-4 border-2 font-bold text-[11px]">Hủy bỏ</button>
           </div>
        </div>
      </div>
    </div>
  );
};

