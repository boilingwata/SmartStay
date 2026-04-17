import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calculator, Receipt, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { contractService } from '@/services/contractService';
import type { ContractDetail } from '@/models/Contract';
import { cn, formatVND } from '@/utils';

interface LiquidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetail;
  defaultReason?: string;
}

export const LiquidationModal = ({
  isOpen,
  onClose,
  contract,
  defaultReason,
}: LiquidationModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    liquidationDate: new Date().toISOString().split('T')[0],
    depositUsed: 0,
    additionalCharge: 0,
    reason: defaultReason ?? '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      liquidationDate: new Date().toISOString().split('T')[0],
      depositUsed: 0,
      additionalCharge: 0,
      reason: defaultReason ?? '',
    });
  }, [defaultReason, isOpen]);

  const refundAmount = useMemo(() => {
    return (contract.depositAmount || 0) - formData.depositUsed - formData.additionalCharge;
  }, [contract.depositAmount, formData.additionalCharge, formData.depositUsed]);

  const liquidateMutation = useMutation({
    mutationFn: () =>
      contractService.liquidateContract({
        contractId: contract.id,
        terminationDate: formData.liquidationDate,
        reason: formData.reason.trim() || 'Thanh lý hợp đồng',
        depositUsed: formData.depositUsed,
        additionalCharges: formData.additionalCharge,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Đã thanh lý hợp đồng.');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể thanh lý hợp đồng.');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[680px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-amber-50 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <Receipt size={22} className="text-amber-600" />
              Thanh lý hợp đồng
            </h2>
            <p className="mt-1 text-sm text-slate-500">{contract.contractCode}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Ngày thanh lý</label>
              <input
                type="date"
                className="input-base w-full"
                value={formData.liquidationDate}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    liquidationDate: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Lý do thanh lý</label>
              <textarea
                className="input-base min-h-[120px] w-full"
                placeholder="Ví dụ: cả người đại diện và occupant đều đã rời khỏi phòng."
                value={formData.reason}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Khấu trừ từ cọc</label>
                <input
                  type="number"
                  min={0}
                  className="input-base w-full"
                  value={formData.depositUsed}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      depositUsed: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Chi phí phát sinh</label>
                <input
                  type="number"
                  min={0}
                  className="input-base w-full"
                  value={formData.additionalCharge}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      additionalCharge: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>
                  Hệ thống sẽ kết thúc hợp đồng, đóng toàn bộ occupant còn hiệu lực và trả phòng về trạng thái
                  trống nếu không còn hợp đồng active nào khác trên phòng này.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[1px] text-slate-500">
              <Calculator size={16} />
              Tóm tắt tài chính
            </div>

            <div className="rounded-2xl border border-white bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[1px] text-slate-400">Tiền cọc hiện tại</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{formatVND(contract.depositAmount)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Khấu trừ cọc</span>
                <span className="font-bold text-rose-600">-{formatVND(formData.depositUsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chi phí phát sinh</span>
                <span className="font-bold text-rose-600">-{formatVND(formData.additionalCharge)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[1px] text-emerald-700">Dự kiến hoàn lại</p>
              <p
                className={cn(
                  'mt-2 text-3xl font-black',
                  refundAmount < 0 ? 'text-rose-600' : 'text-emerald-700'
                )}
              >
                {formatVND(refundAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
          <button onClick={onClose} className="btn-outline">
            Hủy
          </button>
          <button
            onClick={() => liquidateMutation.mutate()}
            className="btn-primary flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
            disabled={liquidateMutation.isPending}
          >
            <ShieldCheck size={18} />
            {liquidateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh lý'}
          </button>
        </div>
      </div>
    </div>
  );
};
