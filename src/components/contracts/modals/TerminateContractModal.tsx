import React, { useState } from 'react';
import { AlertTriangle, Info, LogOut, X } from 'lucide-react';
import type { Contract } from '@/models/Contract';

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Pick<Contract, 'contractCode'> | null;
}

export const TerminateContractModal = ({ isOpen, onClose, contract }: TerminateContractModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    reason: '',
    note: '',
    penalty: 0,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-in bg-danger/10 backdrop-blur-sm fade-in duration-300" onClick={onClose} />

      <div className="relative w-full max-w-[500px] animate-in overflow-hidden rounded-3xl border border-danger/20 bg-white shadow-2xl zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b bg-danger/5 p-6">
          <h2 className="flex items-center gap-2 text-h2 text-danger">
            <LogOut size={24} /> {step === 1 ? 'Xác nhận chấm dứt' : 'Chi tiết chấm dứt'}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-danger/10">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-8">
          {step === 1 ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-display text-primary">Bạn có chắc chắn?</p>
                <p className="text-body text-muted">
                  Hợp đồng <span className="font-bold text-danger">{contract?.contractCode}</span> sẽ bị vô hiệu và phòng sẽ chuyển về trạng thái trống.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-danger/10 bg-danger/5 p-4 text-left">
                <Info size={18} className="mt-0.5 shrink-0 text-danger" />
                <p className="text-[11px] font-bold uppercase text-danger">Lưu ý: hệ thống sẽ tự động cập nhật nhật ký hoạt động cho hành động này.</p>
              </div>
            </div>
          ) : (
            <div className="animate-in space-y-4 slide-in-from-right-4">
              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Ngày chấm dứt</label>
                <input
                  type="date"
                  className="input-base w-full"
                  value={formData.terminationDate}
                  onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Lý do chính</label>
                <select className="input-base w-full" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}>
                  <option value="">Chọn lý do...</option>
                  <option value="Expiry">Hết hạn hợp đồng</option>
                  <option value="Violation">Vi phạm hợp đồng</option>
                  <option value="Mutual">Hai bên đồng thuận</option>
                  <option value="Other">Lý do khác</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Phí bồi thường (nếu có)</label>
                <input
                  type="number"
                  className="input-base w-full font-bold font-display"
                  value={formData.penalty}
                  onChange={(e) => setFormData({ ...formData, penalty: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Ghi chú chi tiết</label>
                <textarea
                  className="input-base min-h-[100px] w-full"
                  placeholder="Yêu cầu tối thiểu 20 ký tự..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t bg-bg/50 p-6">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="btn-outline">Quay lại</button>
              <button onClick={() => setStep(2)} className="btn-danger">Tiếp tục</button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="btn-outline">Quay lại</button>
              <button className="btn-danger shadow-lg shadow-danger/20">Xác nhận chấm dứt</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
