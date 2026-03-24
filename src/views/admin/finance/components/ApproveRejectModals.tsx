import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, AlertCircle, 
  Info, DollarSign, Calendar, User, 
  FileText, ShieldCheck, X
} from 'lucide-react';
import { PaymentTransaction } from '@/models/Payment';
import { formatVND, formatDate, cn } from '@/utils';

interface ApproveModalProps {
  payment: PaymentTransaction;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export const ApprovePaymentModal = ({ payment, onConfirm, onCancel, isPending }: ApproveModalProps) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={onCancel}></div>
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/40">
        <div className="h-3 bg-success w-full"></div>
        <div className="p-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 size={40} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-h3 font-black text-primary uppercase tracking-tight">Xác nhận Giao dịch</h3>
              <p className="text-small text-muted font-medium">Bạn đang phê duyệt giao dịch sau vào hệ thống sổ cái.</p>
            </div>

            <div className="w-full bg-bg/40 rounded-3xl p-6 border border-border/50 space-y-4">
              <div className="flex justify-between items-center text-small">
                <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Mã Giao Dịch</span>
                <span className="font-mono font-bold text-primary">{payment.transactionCode}</span>
              </div>
              <div className="flex justify-between items-center text-small">
                <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Số tiền</span>
                <span className="text-h4 font-black text-secondary">{formatVND(payment.amount)}</span>
              </div>
              <div className="flex justify-between items-center text-small">
                <span className="text-muted font-bold uppercase tracking-widest text-[10px]">Cư dân</span>
                <span className="font-bold flex items-center gap-1"><User size={12} /> {payment.tenantName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-2xl w-full border border-blue-100 italic text-[11px] font-medium">
               <ShieldCheck size={14} /> 
               Hành động này sẽ cập nhật số dư cư dân và không thể hoàn tác.
            </div>

            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={onConfirm}
                disabled={isPending}
                className="btn-primary w-full py-4 rounded-2xl bg-success hover:bg-success-dark border-none shadow-xl shadow-success/20 font-black uppercase tracking-widest"
              >
                {isPending ? 'Đang xử lý...' : 'Xác nhận & Cập nhật'}
              </button>
              <button 
                onClick={onCancel}
                className="btn-ghost w-full py-4 text-muted font-bold"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RejectModalProps {
  payment: PaymentTransaction;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}

export const RejectPaymentModal = ({ payment, onConfirm, onCancel, isPending }: RejectModalProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (reason.length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/40">
        <div className="h-3 bg-danger w-full"></div>
        <div className="p-10">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-danger/10 text-danger rounded-2xl flex items-center justify-center">
                <XCircle size={28} />
              </div>
              <div>
                 <h3 className="text-h3 font-black text-primary uppercase tracking-tight">Từ chối Giao dịch</h3>
                 <p className="text-[11px] text-muted font-bold uppercase tracking-widest">{payment.transactionCode}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Lý do từ chối (Bắt buộc)</span>
                <textarea 
                  className={cn(
                    "input-base w-full min-h-[120px] mt-2 bg-bg/30 p-4 border-2 focus:ring-4 transition-all duration-300",
                    error ? "border-danger/50 focus:ring-danger/10" : "border-border/50 focus:ring-primary/10"
                  )}
                  placeholder="Ví dụ: Hình ảnh minh chứng không hợp lệ, số tiền không khớp, giao dịch đã bị hủy trên ngân hàng..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.length >= 10) setError('');
                  }}
                ></textarea>
                {error && <p className="text-[10px] text-danger font-bold mt-2 flex items-center gap-1 animate-in shake-1 border-l-2 border-danger pl-2">{error}</p>}
              </label>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-2">
                 <p className="text-[10px] text-orange-800 font-bold flex items-center gap-1 uppercase tracking-widest">
                    <AlertCircle size={12} /> Lưu ý quan trọng
                 </p>
                 <p className="text-[11px] text-orange-700 leading-relaxed font-medium">
                    Hệ thống sẽ gửi thông báo cho cư dân về lý do từ chối. Trạng thái hóa đơn sẽ không đổi.
                 </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
               <button 
                onClick={onCancel}
                className="btn-outline flex-1 py-4 font-bold border-2"
              >
                Đóng
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isPending}
                className="btn-primary flex-[2] py-4 bg-danger hover:bg-red-700 border-none shadow-xl shadow-danger/20 font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isPending ? 'Đang lưu...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
