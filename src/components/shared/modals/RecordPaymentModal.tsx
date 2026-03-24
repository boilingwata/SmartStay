import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, Calendar, CreditCard, Wallet, Landmark,
  Smartphone, Upload, AlertCircle, Check, Info,
  Calculator, Save, CheckCircle, Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { PaymentMethod, PaymentStatus } from '@/models/Payment';
import { formatVND, cn } from '@/utils';
import { toast } from 'sonner';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: Pass an invoice object directly for quick actions */
  invoice?: {
    id: string;
    invoiceCode: string;
    totalAmount: number;
    paidAmount: number;
    roomCode?: string;
    tenantName?: string;
  } | null;
  /** Optional: Initial ID to select in the dropdown */
  initialInvoiceId?: string;
}

export const RecordPaymentModal = ({ isOpen, onClose, invoice, initialInvoiceId }: RecordPaymentModalProps) => {
  const queryClient = useQueryClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoice?.id || initialInvoiceId || '');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('BankTransfer');
  const [txCode, setTxCode] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState('');
  const [showOverpaymentDialog, setShowOverpaymentDialog] = useState(false);

  // Sync state if props change
  useEffect(() => {
    if (invoice?.id) {
       setSelectedInvoiceId(invoice.id);
    } else if (initialInvoiceId) {
       setSelectedInvoiceId(initialInvoiceId);
    }
  }, [invoice?.id, initialInvoiceId]);

  // Fetch unpaid invoices if we need to select one
  const { data: allInvoices } = useQuery({
    queryKey: ['unpaidInvoices'],
    queryFn: () => invoiceService.getInvoices(),
    enabled: isOpen && !invoice
  });

  const unpaidInvoices = allInvoices?.filter(i => i.status === 'Unpaid' || i.status === 'Overdue') || [];
  
  // Determine which invoice data to use for preview
  const activeInvoice = invoice ? invoice : unpaidInvoices.find(i => i.id === selectedInvoiceId);

  // Auto-generate TxCode for Cash
  useEffect(() => {
    if (method === 'Cash') {
      setTxCode(paymentService.generateCashCode());
    } else {
      setTxCode('');
    }
  }, [method]);

  // Set default amount when invoice is selected
  useEffect(() => {
    if (activeInvoice) {
      setAmount(activeInvoice.totalAmount - activeInvoice.paidAmount);
    }
  }, [activeInvoice?.id]);

  const remaining = activeInvoice ? (activeInvoice.totalAmount - activeInvoice.paidAmount) : 0;
  const balanceAfter = remaining - amount;

  const handleSubmit = (status: PaymentStatus) => {
    if (!activeInvoice) {
      toast.error('Vui lòng chọn hóa đơn');
      return;
    }
    if (amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }

    if (amount > remaining && !showOverpaymentDialog && status === 'Confirmed') {
      setShowOverpaymentDialog(true);
      return;
    }

    createMutation.mutate(status);
  };

  const createMutation = useMutation({
    mutationFn: (status: PaymentStatus) => paymentService.recordPayment({
      transactionCode: txCode || `TRX-${Date.now()}`,
      invoiceId: activeInvoice?.id || '',
      invoiceCode: activeInvoice?.invoiceCode,
      tenantId: (activeInvoice as any)?.tenantId || '',
      tenantName: activeInvoice?.tenantName || '',
      amount: amount,
      method: method,
      status: status,
      paidAt: new Date(paidAt).toISOString(),
      note: note
    }),
    onSuccess: () => {
      toast.success('Đã ghi nhận thanh toán');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
      setShowOverpaymentDialog(false);
    }
  });

  const paymentMethods: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
    { id: 'Cash', label: 'Tiền mặt', icon: Wallet, color: 'text-orange-500' },
    { id: 'BankTransfer', label: 'Chuyển khoản', icon: Landmark, color: 'text-blue-500' },
    { id: 'VNPay', label: 'VNPay', icon: Smartphone, color: 'text-blue-600' },
    { id: 'Momo', label: 'Momo', icon: Zap, color: 'text-pink-500' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/50">
        
        {/* Left: Form */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <CreditCard size={28} />
               </div>
               <div>
                  <h2 className="text-h2 text-primary">Ghi nhận thanh toán</h2>
                  <p className="text-[11px] text-muted font-black uppercase tracking-widest">
                    {activeInvoice ? `Hóa đơn: ${activeInvoice.invoiceCode}` : 'Hệ thống quản lý tài chính'}
                  </p>
               </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-all md:hidden">
              <X size={24} />
            </button>
          </div>

          {!invoice && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Chọn hóa đơn</label>
              <select 
                className="input-base w-full h-14 bg-bg/30 font-bold"
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
              >
                <option value="">-- Chọn hóa đơn chưa thanh toán --</option>
                {unpaidInvoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceCode} - {inv.tenantName} ({formatVND(inv.totalAmount - inv.paidAmount)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Số tiền thanh toán</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="input-base w-full h-14 pl-12 text-h4 font-black text-secondary"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Phương thức</label>
                <div className="grid grid-cols-2 gap-2">
                   {paymentMethods.map((m) => (
                     <button 
                       key={m.id}
                       onClick={() => setMethod(m.id)}
                       className={cn(
                         "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-small font-bold",
                         method === m.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-primary/30"
                       )}
                     >
                        <m.icon size={20} className={m.color} />
                        <span className="uppercase tracking-tighter">{m.label}</span>
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mã thực hiện (TxCode)</label>
                <input 
                  className="input-base w-full font-mono text-small h-12" 
                  placeholder="Mã tham chiếu ngân hàng..." 
                  value={txCode}
                  onChange={(e) => setTxCode(e.target.value)}
                />
                {method === 'Cash' && <p className="text-[9px] text-success font-black italic uppercase">* Tự động tạo mã Tiền mặt (RULE-07)</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Thời điểm nộp</label>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    className="input-base w-full h-14 pl-12 font-bold" 
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Minh chứng (Ảnh/PDF)</label>
                <div className="border-2 border-dashed border-border p-6 rounded-[24px] flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer transition-all bg-bg/20 group">
                   <Upload size={24} className="text-muted group-hover:text-primary transition-colors" />
                   <span className="text-[9px] text-muted font-black uppercase tracking-widest shadow-sm">Thả tệp hoặc Click để chọn</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Ghi chú đối soát</label>
                <textarea 
                  className="input-base w-full min-h-[100px] text-small p-4" 
                  placeholder="Ghi chú thêm về giao dịch..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-full md:w-[380px] bg-slate-900 p-10 text-white flex flex-col justify-between border-l border-white/5">
           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <h3 className="text-[12px] font-black uppercase tracking-[3px] text-slate-400">Xem trước</h3>
                 <Calculator size={20} className="text-slate-400" />
              </div>

              <div className="space-y-6">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-small">
                       <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Phòng</span>
                       <span className="font-black text-white uppercase">{activeInvoice?.roomCode || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center text-small">
                       <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cư dân</span>
                       <span className="font-black text-white uppercase">{activeInvoice?.tenantName || '---'}</span>
                    </div>
                    <div className="flex justify-between items-center text-small">
                       <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cần thanh toán</span>
                       <span className="font-black text-white">{formatVND(activeInvoice?.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-small">
                       <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Đã thu trước</span>
                       <span className="font-black text-success">{formatVND(activeInvoice?.paidAmount || 0)}</span>
                    </div>
                 </div>

                 <div className="py-8 border-t border-white/10 space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nộp lần này</span>
                       <span className="text-3xl font-black text-secondary font-display leading-none">{formatVND(amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Còn nợ sau nạp</span>
                       <span className={cn(
                         "text-xl font-black font-display",
                         balanceAfter <= 0 ? "text-success" : "text-destructive"
                       )}>
                         {formatVND(Math.max(0, balanceAfter))}
                       </span>
                    </div>
                 </div>

                 {balanceAfter < 0 && (
                   <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                      <Info size={18} className="text-blue-400 mt-1 shrink-0" />
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Ghi nhận dư thừa</p>
                         <p className="text-[11px] text-blue-100/70 font-medium">Cư dân nộp dư <strong>{formatVND(Math.abs(balanceAfter))}</strong>. Tiền sẽ được cộng vào ví quỹ cư dân.</p>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           <div className="space-y-3 pt-8">
              <button 
                onClick={() => handleSubmit('Pending')}
                disabled={createMutation.isPending}
                className="w-full py-5 rounded-[24px] bg-white/5 hover:bg-white/10 text-white text-small font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/5"
              >
                <Save size={20} /> Lưu tạm (Chờ duyệt)
              </button>
              <button 
                onClick={() => handleSubmit('Confirmed')}
                disabled={createMutation.isPending}
                className="w-full py-6 rounded-[24px] bg-secondary hover:bg-secondary-dark text-white text-small font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-secondary/20 transition-all active:scale-95"
              >
                {createMutation.isPending ? <div className="loading-spinner h-5 w-5 border-white" /> : (
                   <><CheckCircle size={22} /> Xác nhận & Cập nhật</>
                )}
              </button>
           </div>
        </div>

        {/* Overpayment Confirmation Logic */}
        {showOverpaymentDialog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-xl" onClick={() => setShowOverpaymentDialog(false)}></div>
            <div className="relative w-full max-w-sm bg-white rounded-[48px] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in-95">
               <div className="w-24 h-24 bg-secondary/10 text-secondary rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
                  <DollarSign size={48} />
               </div>
               <div className="space-y-3">
                  <h3 className="text-h2 font-black text-primary uppercase tracking-tighter">Xác nhận nộp dư</h3>
                  <p className="text-body text-muted">Hóa đơn chỉ còn <strong>{formatVND(remaining)}</strong>. Bạn muốn xử lý phần dư <strong>{formatVND(Math.abs(balanceAfter))}</strong> như thế nào?</p>
               </div>
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => createMutation.mutate('Confirmed')}
                    className="w-full py-5 bg-secondary hover:bg-secondary-dark text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20 transition-all"
                  >
                    Nạp vào ví cư dân
                  </button>
                  <button 
                    onClick={() => {
                      setAmount(remaining);
                      setShowOverpaymentDialog(false);
                    }}
                    className="w-full py-4 border-2 border-border hover:bg-bg rounded-[20px] font-black text-muted uppercase tracking-widest text-[11px]"
                  >
                    Chỉ thu đúng số nợ
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
