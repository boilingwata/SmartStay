import React, { useState } from 'react';
import { AlertCircle, Calendar, DollarSign, X } from 'lucide-react';
import type { Contract } from '@/models/Contract';
import { formatVND } from '@/utils';

interface ExtendContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Pick<Contract, 'contractCode' | 'endDate' | 'rentPriceSnapshot'> | null;
}

export const ExtendContractModal = ({ isOpen, onClose, contract }: ExtendContractModalProps) => {
  const [formData, setFormData] = useState({
    newEndDate: '',
    newRentPrice: contract?.rentPriceSnapshot || 0,
    reason: '',
    approvedBy: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-in bg-primary/20 backdrop-blur-sm fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-[600px] animate-in overflow-hidden rounded-3xl border border-border bg-white shadow-2xl zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="flex items-center gap-2 text-h2 text-primary">
            <Calendar className="text-primary" size={24} /> Gia hạn hợp đồng
          </h2>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-bg">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-8">
          <div className="flex gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
            <AlertCircle className="shrink-0 text-warning" size={20} />
            <p className="text-small font-medium text-warning">
              Giá thuê mới chỉ áp dụng cho hóa đơn từ kỳ tiếp theo, không ảnh hưởng hóa đơn đã tạo trước đó.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Ngày kết thúc cũ</label>
              <input type="text" className="input-base w-full cursor-not-allowed bg-bg/50" value={contract?.endDate || ''} readOnly />
            </div>
            <div className="space-y-1.5">
              <label className="text-small font-bold text-muted">Ngày kết thúc mới</label>
              <input
                type="date"
                className="input-base w-full border-primary/50 focus:ring-primary"
                value={formData.newEndDate}
                onChange={(e) => setFormData({ ...formData, newEndDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Giá thuê mới (VND)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="number"
                className="input-base w-full pl-10 text-lg font-bold font-display"
                value={formData.newRentPrice}
                onChange={(e) => setFormData({ ...formData, newRentPrice: Number(e.target.value) })}
              />
            </div>
            <p className="text-[10px] text-muted">Giá hiện tại: {formatVND(contract?.rentPriceSnapshot || 0)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Lý do gia hạn</label>
            <textarea
              className="input-base min-h-[100px] w-full"
              placeholder="Nhập lý do chi tiết..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-small font-bold text-muted">Người phê duyệt</label>
            <input
              type="text"
              className="input-base w-full"
              placeholder="Nhập người phê duyệt nếu cần"
              value={formData.approvedBy}
              onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t bg-bg/50 p-6">
          <button onClick={onClose} className="btn-outline">Hủy bỏ</button>
          <button className="btn-primary">Gia hạn ngay</button>
        </div>
      </div>
    </div>
  );
};
