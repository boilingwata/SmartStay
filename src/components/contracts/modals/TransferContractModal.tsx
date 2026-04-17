import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, ShieldCheck, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { contractService } from '@/services/contractService';
import type { ContractDetail } from '@/models/Contract';

interface TransferContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetail;
}

export const TransferContractModal = ({
  isOpen,
  onClose,
  contract,
}: TransferContractModalProps) => {
  const queryClient = useQueryClient();
  const activeSecondaryOccupants = useMemo(
    () =>
      contract.occupants.filter(
        (occupant) => occupant.status === 'active' && !occupant.isPrimaryTenant
      ),
    [contract.occupants]
  );

  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextRepresentativeId, setNextRepresentativeId] = useState(
    activeSecondaryOccupants[0]?.tenantId ?? ''
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTransferDate(new Date().toISOString().split('T')[0]);
    setNextRepresentativeId(activeSecondaryOccupants[0]?.tenantId ?? '');
    setNote('');
  }, [activeSecondaryOccupants, isOpen]);

  const selectedOccupant = activeSecondaryOccupants.find(
    (occupant) => occupant.tenantId === nextRepresentativeId
  );

  const transferMutation = useMutation({
    mutationFn: () =>
      contractService.transferContract({
        contractId: contract.id,
        toTenantId: nextRepresentativeId,
        transferDate,
        note: note.trim() || undefined,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      await queryClient.invalidateQueries({ queryKey: ['contract', String(result.newContractId)] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success(`Đã chuyển hợp đồng sang ${selectedOccupant?.fullName || 'tenant mới'}.`);
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể chuyển hợp đồng.');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[640px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-sky-50 px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
              <ArrowRightLeft size={22} className="text-sky-600" />
              Chuyển hợp đồng
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {contract.contractCode} • Người đại diện hiện tại: {contract.primaryTenant?.fullName || 'Chưa có dữ liệu'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {activeSecondaryOccupants.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-900">
              Không còn occupant nào ở lại để nhận chuyển hợp đồng. Trường hợp này cần thanh lý hợp đồng.
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-[1fr_220px]">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Chọn người đại diện mới</label>
                  <div className="space-y-3">
                    {activeSecondaryOccupants.map((occupant) => (
                      <button
                        key={occupant.id}
                        type="button"
                        onClick={() => setNextRepresentativeId(occupant.tenantId)}
                        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                          occupant.tenantId === nextRepresentativeId
                            ? 'border-sky-300 bg-sky-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-black text-slate-900">{occupant.fullName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {occupant.phone || 'Chưa có số điện thoại'}
                          </p>
                        </div>

                        {occupant.tenantId === nextRepresentativeId && (
                          <UserCheck size={18} className="text-sky-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-[1px] text-slate-400">Tác động hệ thống</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <ArrowRightLeft size={16} className="mt-0.5 shrink-0 text-sky-600" />
                      <p>Đóng hợp đồng cũ của người đại diện hiện tại.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRightLeft size={16} className="mt-0.5 shrink-0 text-sky-600" />
                      <p>Tạo hợp đồng mới với người nhận chuyển là tenant chính.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ArrowRightLeft size={16} className="mt-0.5 shrink-0 text-sky-600" />
                      <p>Carry-over tiền cọc sang hợp đồng mới để giữ flow đơn giản.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ngày chuyển hợp đồng</label>
                  <input
                    type="date"
                    className="input-base w-full"
                    value={transferDate}
                    onChange={(event) => setTransferDate(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Người nhận chuyển</label>
                  <input
                    value={selectedOccupant?.fullName || 'Chưa chọn'}
                    className="input-base w-full bg-slate-50"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Ghi chú</label>
                <textarea
                  className="input-base min-h-[110px] w-full"
                  placeholder="Ví dụ: Người đại diện cũ chuyển công tác, occupant B tiếp tục ở lại."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5">
          <button onClick={onClose} className="btn-outline">
            Hủy
          </button>
          <button
            onClick={() => transferMutation.mutate()}
            className="btn-primary flex items-center gap-2 bg-sky-600 hover:bg-sky-700"
            disabled={transferMutation.isPending || activeSecondaryOccupants.length === 0 || !nextRepresentativeId}
          >
            <ShieldCheck size={18} />
            {transferMutation.isPending ? 'Đang xử lý...' : 'Xác nhận chuyển hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
};
