import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Calculator, Receipt, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractDetail } from '@/models/Contract';
import { contractService } from '@/services/contractService';
import { cn, formatVND } from '@/utils';

interface LiquidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetail;
  defaultReason?: string;
}

export function LiquidationModal({ isOpen, onClose, contract, defaultReason }: LiquidationModalProps) {
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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-[720px] overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-8 py-6">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
              <Receipt size={24} className="text-amber-500" />
              Thanh lý hợp đồng
            </h2>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">{contract.contractCode}</p>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl p-3 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-10 p-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày thanh lý</label>
              <input
                type="date"
                className="input-base h-12 w-full rounded-2xl border-slate-100 font-bold"
                value={formData.liquidationDate}
                onChange={(event) => setFormData((current) => ({ ...current, liquidationDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Lý do thanh lý</label>
              <textarea
                className="input-base min-h-[140px] w-full rounded-2xl border-slate-100 p-4 font-medium leading-relaxed"
                placeholder="Ghi rõ lý do thanh lý để tiện tra soát về sau"
                value={formData.reason}
                onChange={(event) => setFormData((current) => ({ ...current, reason: event.target.value }))}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Khấu trừ từ tiền cọc</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    className="input-base h-12 w-full rounded-2xl border-slate-100 pr-10 font-black"
                    value={formData.depositUsed}
                    onChange={(event) => setFormData((current) => ({ ...current, depositUsed: Number(event.target.value || 0) }))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">VND</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Chi phí phát sinh</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    className="input-base h-12 w-full rounded-2xl border-slate-100 pr-10 font-black"
                    value={formData.additionalCharge}
                    onChange={(event) => setFormData((current) => ({ ...current, additionalCharge: Number(event.target.value || 0) }))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">VND</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-100 bg-amber-50/50 p-5">
              <div className="flex items-start gap-4">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-xs font-bold leading-relaxed text-amber-800">
                  Khi thanh lý, hệ thống sẽ kết thúc hợp đồng, đóng toàn bộ trạng thái cư trú đang hoạt động và giải phóng phòng nếu không còn hợp đồng hiệu lực nào khác.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-[32px] border border-slate-100 bg-slate-50/50 p-6">
            <div className="mb-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Calculator size={16} />
              Quyết toán tiền cọc
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tiền cọc hiện tại</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{formatVND(contract.depositAmount)}</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Khấu trừ</span>
                <span className="text-sm font-black text-rose-600">-{formatVND(formData.depositUsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chi phí khác</span>
                <span className="text-sm font-black text-rose-600">-{formatVND(formData.additionalCharge)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-lg shadow-emerald-900/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Số tiền dự kiến hoàn / thu thêm</p>
              <p className={cn('mt-3 text-3xl font-black tracking-tight', refundAmount < 0 ? 'text-rose-600' : 'text-emerald-700')}>
                {formatVND(refundAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-slate-50 bg-slate-50/30 px-8 py-6">
          <button type="button" onClick={onClose} className="h-12 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">
            Đóng
          </button>
          <button
            type="button"
            onClick={() => liquidateMutation.mutate()}
            className="inline-flex h-12 items-center gap-3 rounded-2xl bg-slate-900 px-10 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-rose-600 disabled:opacity-50"
            disabled={liquidateMutation.isPending}
          >
            <ShieldCheck size={18} />
            {liquidateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận thanh lý'}
          </button>
        </div>
      </div>
    </div>
  );
}
