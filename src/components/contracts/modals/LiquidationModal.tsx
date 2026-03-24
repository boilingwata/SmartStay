import React, { useState, useEffect } from 'react';
import { X, Receipt, Calculator, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn, formatVND } from '@/utils';
import { toast } from 'sonner';

interface LiquidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

export const LiquidationModal = ({ isOpen, onClose, contract }: LiquidationModalProps) => {
  const [formData, setFormData] = useState({
    liquidationDate: new Date().toISOString().split('T')[0],
    depositUsed: 0,
    additionalCharge: 0,
    reason: '',
    status: 'Draft'
  });

  const depositAmount = contract?.depositAmount || 0;
  const refundAmount = depositAmount - formData.depositUsed - formData.additionalCharge;

  if (!isOpen) return null;

  const handleComplete = () => {
    toast.success('Thanh lý hợp đồng thành công!');
    toast.info('Trigger: Đã gửi NPS Survey và yêu cầu feedback Check-out cho cư dân.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-accent/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-[650px] bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b bg-accent/5">
          <h2 className="text-h2 text-accent flex items-center gap-2">
            <Receipt size={24} /> Thanh lý hợp đồng (Nghiệm thu)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-accent/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-small font-bold text-muted uppercase">Ngày thanh lý</label>
                  <input type="date" className="input-base w-full" value={formData.liquidationDate} onChange={(e) => setFormData({...formData, liquidationDate: e.target.value})} />
               </div>

               <div className="space-y-4 p-5 bg-bg/50 rounded-2xl border border-border/50">
                  <div className="flex justify-between items-center">
                    <span className="text-small text-muted font-medium">Tổng tiền cọc:</span>
                    <span className="font-display font-bold text-primary">{formatVND(depositAmount)}</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-danger uppercase tracking-tighter">Bồi thường từ cọc (-)</label>
                    <input 
                      type="number" 
                      className="input-base w-full font-display font-bold text-danger bg-white" 
                      value={formData.depositUsed} 
                      onChange={(e) => setFormData({...formData, depositUsed: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-danger uppercase tracking-tighter">Phụ phí phát sinh (-)</label>
                    <input 
                      type="number" 
                      className="input-base w-full font-display font-bold text-danger bg-white" 
                      value={formData.additionalCharge} 
                      onChange={(e) => setFormData({...formData, additionalCharge: Number(e.target.value)})}
                    />
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex-1 bg-success/5 border border-success/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2">
                 <Calculator className="text-success mb-2" size={32} />
                 <p className="text-[10px] font-bold text-success uppercase tracking-widest">Tiền hoàn lại cư dân</p>
                 <p className={cn(
                   "text-h1 font-display font-bold",
                   refundAmount < 0 ? 'text-danger' : 'text-success'
                 )}>
                   {formatVND(refundAmount)}
                 </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted uppercase">Lý do thanh lý</label>
                <textarea 
                  className="input-base w-full min-h-[120px]" 
                  placeholder="Nghiệm thu tài sản, trừ tiền vệ sinh..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-bg/50 border-t flex justify-between items-center">
          <div className="flex items-center gap-2 text-muted truncate max-w-[200px]">
            <AlertTriangle size={14} className="text-warning shrink-0" />
            <span className="text-[10px] font-medium leading-tight italic">Hợp đồng sẽ chuyển thành 'Terminated' sau khi hoàn tất.</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline">Hủy bỏ</button>
            <button onClick={handleComplete} className="btn-primary bg-accent hover:bg-accent/80 border-accent flex items-center gap-2">
               <ShieldCheck size={18} /> Hoàn tất thanh lý
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
