import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, ShieldCheck, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import type { ContractDetail } from '@/models/Contract';
import { contractService } from '@/services/contractService';
import { cn } from '@/utils';

interface TransferContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractDetail;
}

export function TransferContractModal({ isOpen, onClose, contract }: TransferContractModalProps) {
  const queryClient = useQueryClient();
  const activeSecondaryOccupants = useMemo(
    () => contract.occupants.filter((occupant) => occupant.status === 'active' && !occupant.isPrimaryTenant),
    [contract.occupants]
  );

  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextRepresentativeId, setNextRepresentativeId] = useState(activeSecondaryOccupants[0]?.tenantId ?? '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTransferDate(new Date().toISOString().split('T')[0]);
    setNextRepresentativeId(activeSecondaryOccupants[0]?.tenantId ?? '');
    setNote('');
  }, [activeSecondaryOccupants, isOpen]);

  const selectedOccupant = activeSecondaryOccupants.find((occupant) => occupant.tenantId === nextRepresentativeId);

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
      toast.success(`Đã chuyển người đứng tên sang ${selectedOccupant?.fullName || 'thành viên mới'}.`);
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể chuyển người đứng tên.');
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
              <ArrowRightLeft size={24} className="text-sky-500" />
              Chuyển người đứng tên hợp đồng
            </h2>
            <p className="mt-1 text-xs font-black uppercase tracking-widest text-slate-400">
              {contract.contractCode} • Hiện tại: {contract.primaryTenant?.fullName || 'Chưa cập nhật'}
            </p>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl p-3 text-slate-400 transition-all hover:bg-white hover:text-slate-900 hover:shadow-sm">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] space-y-8 overflow-y-auto p-8">
          {activeSecondaryOccupants.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-amber-100 bg-amber-50/30 py-10">
              <p className="text-sm font-black uppercase tracking-widest text-amber-700">Chưa có người để nhận chuyển</p>
              <p className="mt-2 max-w-xs text-center text-xs font-medium text-amber-600">
                Muốn chuyển người đứng tên, hợp đồng phải có ít nhất một người ở cùng còn hiệu lực để tiếp nhận vai trò này.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-[1fr_240px]">
                <div className="space-y-4">
                  <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn người nhận chuyển</label>
                  <div className="space-y-3">
                    {activeSecondaryOccupants.map((occupant) => (
                      <button
                        key={occupant.id}
                        type="button"
                        onClick={() => setNextRepresentativeId(occupant.tenantId)}
                        className={cn(
                          'group flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all duration-300',
                          occupant.tenantId === nextRepresentativeId
                            ? 'border-sky-500 bg-sky-50/50 shadow-lg shadow-sky-900/5 ring-1 ring-sky-500'
                            : 'border-slate-100 bg-white hover:border-slate-300'
                        )}
                      >
                        <div>
                          <p className="text-base font-black text-slate-900">{occupant.fullName}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {occupant.phone || 'Chưa có số điện thoại'}
                          </p>
                        </div>

                        {occupant.tenantId === nextRepresentativeId ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white">
                            <UserCheck size={16} />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full border border-slate-100 bg-slate-50 transition-colors group-hover:bg-slate-100" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 rounded-3xl border border-slate-100 bg-slate-50/50 p-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hệ thống sẽ làm gì</h3>
                  <div className="space-y-4 text-xs font-bold leading-relaxed text-slate-600">
                    <p>1. Kết thúc hợp đồng cũ của người đứng tên hiện tại.</p>
                    <p>2. Tạo hợp đồng mới nối tiếp với người đứng tên mới.</p>
                    <p>3. Chuyển toàn bộ tiền cọc sang hồ sơ mới.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày chuyển</label>
                  <input
                    type="date"
                    className="input-base h-12 w-full rounded-2xl border-slate-100 font-bold"
                    value={transferDate}
                    onChange={(event) => setTransferDate(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Người nhận chuyển</label>
                  <div className="flex h-12 w-full items-center rounded-2xl border border-slate-100 bg-slate-50 px-4 text-sm font-black text-slate-900">
                    {selectedOccupant?.fullName || 'Vui lòng chọn'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú bàn giao</label>
                <textarea
                  className="input-base min-h-[120px] w-full rounded-2xl border-slate-100 p-4 font-medium leading-relaxed"
                  placeholder="Ghi rõ lý do chuyển người đứng tên hoặc lưu ý cần đối soát"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-4 border-t border-slate-50 bg-slate-50/30 px-8 py-6">
          <button type="button" onClick={onClose} className="h-12 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-900">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => transferMutation.mutate()}
            className="inline-flex h-12 items-center gap-3 rounded-2xl bg-slate-900 px-10 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-sky-600 disabled:opacity-50"
            disabled={transferMutation.isPending || activeSecondaryOccupants.length === 0 || !nextRepresentativeId}
          >
            <ShieldCheck size={18} />
            {transferMutation.isPending ? 'Đang xử lý...' : 'Xác nhận chuyển quyền'}
          </button>
        </div>
      </div>
    </div>
  );
}
