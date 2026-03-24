import React, { useState } from 'react';
import { X, LogOut, AlertTriangle, Info } from 'lucide-react';
import { cn, formatVND } from '@/utils';

interface TerminateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
}

export const TerminateContractModal = ({ isOpen, onClose, contract }: TerminateContractModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    reason: '',
    note: '',
    penalty: 0
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-danger/10 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl border border-danger/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b bg-danger/5">
          <h2 className="text-h2 text-danger flex items-center gap-2">
            <LogOut size={24} /> {step === 1 ? 'Xác nhận chấm dứt' : 'Chi tiết chấm dứt'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-danger/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {step === 1 ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-display text-primary">Bạn có chắc chắn?</p>
                <p className="text-body text-muted">Hợp đồng <span className="font-bold text-danger">{contract?.contractCode}</span> sẽ bị vô hiệu và phòng sẽ chuyển về trạng thái trống.</p>
              </div>
              
              <div className="bg-danger/5 p-4 rounded-xl border border-danger/10 flex items-start gap-3 text-left">
                <Info size={18} className="text-danger shrink-0 mt-0.5" />
                <p className="text-[11px] text-danger font-bold uppercase">Lưu ý: Hệ thống sẽ tự động cập nhật nhật ký hoạt động (Audit Log) cho hành động này.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Ngày chấm dứt</label>
                <input type="date" className="input-base w-full" value={formData.terminationDate} onChange={(e) => setFormData({...formData, terminationDate: e.target.value})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Lý do chính</label>
                <select className="input-base w-full" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
                  <option value="">Chọn lý do...</option>
                  <option value="Expiry">Hết hạn hợp đồng</option>
                  <option value="Violation">Vi phạm hợp đồng</option>
                  <option value="Mutual">Hai bên đồng thuận</option>
                  <option value="Other">Lý do khác</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Phí bồi thường (nếu có)</label>
                <input type="number" className="input-base w-full font-display font-bold" value={formData.penalty} onChange={(e) => setFormData({...formData, penalty: Number(e.target.value)})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-bold text-muted">Ghi chú chi tiết</label>
                <textarea className="input-base w-full min-h-[100px]" placeholder="Yêu cầu tối thiểu 20 ký tự..." value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-bg/50 border-t flex justify-end gap-3">
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
