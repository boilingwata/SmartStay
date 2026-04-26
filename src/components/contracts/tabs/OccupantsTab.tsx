import { AlertCircle, LogOut, RefreshCcw, ShieldCheck, UserPlus } from 'lucide-react';
import { OccupantCard } from '@/components/contracts/detail/ContractDetailSections';
import type { ContractDetail as ContractDetailModel, ContractOccupant } from '@/models/Contract';

interface OccupantsTabProps {
  contract: ContractDetailModel;
  onAddOccupant: () => void;
  onTransfer: () => void;
  onLiquidate: () => void;
  onRemoveOccupant: (occupant: ContractOccupant) => void;
  isRemoving: boolean;
}

export function OccupantsTab({
  contract,
  onAddOccupant,
  onTransfer,
  onLiquidate,
  onRemoveOccupant,
  isRemoving,
}: OccupantsTabProps) {
  const primaryOccupant = contract.occupants.find((occupant) => occupant.isPrimaryTenant && occupant.status === 'active');
  const secondaryOccupants = contract.occupants.filter((occupant) => !occupant.isPrimaryTenant);
  const activeSecondaryOccupants = secondaryOccupants.filter((occupant) => occupant.status === 'active');

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-slate-950" />
              <h3 className="text-base font-bold text-slate-950">Người đứng tên hợp đồng</h3>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Đây là người chịu trách nhiệm chính về pháp lý và thanh toán. Nếu cần đổi người đứng tên, hãy dùng chức năng chuyển quyền thay vì xóa khỏi danh sách cư trú.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onTransfer}
              disabled={activeSecondaryOccupants.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw size={16} />
              Chuyển người đứng tên
            </button>
            <button
              type="button"
              onClick={onLiquidate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut size={16} />
              Thanh lý hợp đồng
            </button>
          </div>
        </div>

        <div className="mt-5">
          {primaryOccupant ? (
            <OccupantCard occupant={primaryOccupant} emphasis="primary" />
          ) : (
            <div className="flex items-start gap-3 rounded-[20px] border border-rose-200 bg-white p-4 text-sm text-rose-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              Không tìm thấy người đứng tên còn hiệu lực trong hồ sơ này.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-950">Người ở cùng</h3>
            <p className="text-sm text-slate-500">{secondaryOccupants.length} bản ghi liên quan đến cư trú trong hợp đồng này</p>
          </div>
          <button
            type="button"
            onClick={onAddOccupant}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <UserPlus size={16} />
            Thêm người ở cùng
          </button>
        </div>

        {secondaryOccupants.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Hợp đồng này chưa có người ở cùng. Bạn có thể thêm để đồng bộ tình trạng cư trú và số người tính phí.
          </div>
        ) : (
          <div className="grid gap-4">
            {secondaryOccupants.map((occupant) => (
              <OccupantCard key={occupant.id} occupant={occupant} onRemove={() => onRemoveOccupant(occupant)} isRemoving={isRemoving} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
