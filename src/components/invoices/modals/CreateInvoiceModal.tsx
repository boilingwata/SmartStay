import React, { useState, useEffect } from 'react';
import { 
  X, Calculator, Calendar, FileText, 
  AlertTriangle, CheckCircle2, ChevronRight, 
  Info, DollarSign 
} from 'lucide-react';
import { cn, formatVND } from '@/utils';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateInvoiceModal = ({ isOpen, onClose }: CreateInvoiceModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contractId: '',
    monthYear: new Date().toISOString().slice(0, 7),
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    discountAmount: 0,
    discountReason: '',
    note: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-h2 text-primary">Tạo hóa đơn lẻ</h2>
            <p className="text-small text-muted">Lập hóa đơn cho một hợp đồng cụ thể.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Step indicator */}
          <div className="flex items-center gap-4 mb-4">
             <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", step >= 1 ? "bg-primary text-white" : "bg-bg text-muted")}>1</div>
             <div className="flex-1 h-px bg-border"></div>
             <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", step >= 2 ? "bg-primary text-white" : "bg-bg text-muted")}>2</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-label text-muted">Hợp đồng</label>
                <select 
                  className="input-base w-full"
                  value={formData.contractId}
                  onChange={(e) => setFormData({...formData, contractId: e.target.value})}
                >
                   <option value="">Chọn hợp đồng...</option>
                   <option value="C001">HD-VH01-2025-0001 - Nguyễn Văn A</option>
                   <option value="C002">HD-VH01-2025-0002 - Trần Thị B</option>
                </select>
             </div>
             
             <div className="space-y-2">
                <label className="text-label text-muted">Kỳ thanh toán (Tháng/Năm)</label>
                <input 
                  type="month" 
                  className="input-base w-full" 
                  value={formData.monthYear}
                  onChange={(e) => setFormData({...formData, monthYear: e.target.value})}
                />
             </div>

             <div className="space-y-2">
                <label className="text-label text-muted">Hạn thanh toán</label>
                <input 
                   type="date" 
                   className="input-base w-full"
                   value={formData.dueDate}
                   onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
             </div>

             <div className="space-y-2">
                <label className="text-label text-muted">Giảm trừ (VND)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input 
                    type="number" 
                    className="input-base w-full pl-10" 
                    placeholder="0"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData({...formData, discountAmount: Number(e.target.value)})}
                  />
                </div>
             </div>
          </div>

          {formData.discountAmount > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
               <label className="text-label text-muted">Lý do giảm trừ</label>
               <input 
                 type="text" 
                 className="input-base w-full" 
                 placeholder="VD: Hỗ trợ dịch bệnh, khuyến mãi..."
                 value={formData.discountReason}
                 onChange={(e) => setFormData({...formData, discountReason: e.target.value})}
               />
            </div>
          )}

          <div className="space-y-2">
             <label className="text-label text-muted">Ghi chú hóa đơn</label>
             <textarea 
               className="input-base w-full min-h-[80px]" 
               placeholder="Thông tin thêm cho cư dân..."
               value={formData.note}
               onChange={(e) => setFormData({...formData, note: e.target.value})}
             ></textarea>
          </div>

          {/* Warning placeholder for missing meter readings */}
          {formData.contractId && (
            <div className="bg-warning/10 p-4 rounded-2xl border border-warning/20 flex gap-3 animate-in shake-1 duration-500">
               <AlertTriangle className="text-warning shrink-0" size={20} />
               <p className="text-small text-warning font-medium">
                 Chưa có chỉ số đồng hồ tháng {formData.monthYear.split('-')[1]} — hóa đơn điện/nuoc sẽ không được tạo tự động. 
                 <button className="underline ml-1">Nhập chỉ số ngay</button>
               </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t bg-bg/20 flex items-center justify-between">
           <p className="text-[10px] text-muted font-medium max-w-[200px]">
             Hệ thống sẽ tự động hạch toán các khoản phí cố định từ hợp đồng.
           </p>
           <div className="flex items-center gap-3">
              <button onClick={onClose} className="btn-outline">Hủy</button>
              <button className="btn-primary flex items-center gap-2">
                Tiếp tục xem trước <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
