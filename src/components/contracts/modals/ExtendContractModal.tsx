import React, { useState } from 'react';
import { X, Calendar, DollarSign, FileEdit, AlertCircle } from 'lucide-react';
import { cn, formatVND } from '@/utils';

interface ExtendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

export const ExtendContractModal = ({ isOpen, onClose, contract }: ExtendContractModalProps) => {
  const [formData, setFormData] = useState({
    newEndDate: '',
    newRentPrice: contract?.rentPriceSnapshot || 0,
    reason: '',
    approvedBy: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-[600px] bg-white rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-h2 text-primary flex items-center gap-2">
            <Calendar className="text-primary" size={24} /> Gia hạn hợp đồng
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-warning/5 p-4 rounded-2xl border border-warning/20 flex gap-3">
            <AlertCircle className="text-warning shrink-0" size={20} />
            <p className="text-small text-warning font-medium">
              Giá thuê mới chỉ áp dụng cho hóa đơn từ kỳ tiếp theo — không ảnh hưởng hóa đơn đã tạo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-small font-bold text-muted">Ngày kết thúc cũ</label>
               <input type="text" className="input-base w-full bg-bg/50 cursor-not-allowed" value={contract?.endDate} readOnly />
             </div>
             <div className="space-y-1.5">
               <label className="text-small font-bold text-muted">Ngày kết thúc mới</label>
               <input 
                 type="date" 
                 className="input-base w-full border-primary/50 focus:ring-primary" 
                 value={formData.newEndDate}
                 onChange={(e) => setFormData({...formData, newEndDate: e.target.value})}
               />
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Giá thuê mới (VND)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="number" 
                className="input-base w-full pl-10 font-display font-bold text-lg" 
                value={formData.newRentPrice}
                onChange={(e) => setFormData({...formData, newRentPrice: Number(e.target.value)})}
              />
            </div>
            <p className="text-[10px] text-muted">Giá hiện tại: {formatVND(contract?.rentPriceSnapshot)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Lý do gia hạn</label>
            <textarea 
              className="input-base w-full min-h-[100px]" 
              placeholder="Nhập lý do chi tiết..."
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            />
          </div>
        </div>

        <div className="p-6 bg-bg/50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Hủy bỏ</button>
          <button className="btn-primary">Gia hạn ngay</button>
        </div>
      </div>
    </div>
  );
};
