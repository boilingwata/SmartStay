import { ArrowRightLeft, History, MoveRight } from 'lucide-react';
import type { ContractDetail as ContractDetailModel } from '@/models/Contract';
import { getContractTransferStatusLabel } from '@/lib/contractPresentation';
import { formatDate, formatVND } from '@/utils';

interface TransfersTabProps {
  contract: ContractDetailModel;
  onTransfer: () => void;
}

export function TransfersTab({ contract, onTransfer }: TransfersTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-950">Lịch sử chuyển người đứng tên</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Theo dõi các lần bàn giao vai trò người đứng tên hợp đồng và số tiền cọc đi kèm giữa các thành viên đang ở trong cùng phòng.
          </p>
        </div>
        <button
          type="button"
          onClick={onTransfer}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowRightLeft size={16} />
          Tạo chuyển quyền
        </button>
      </div>

      {contract.transfers?.length ? (
        <div className="space-y-4">
          {contract.transfers.map((transfer) => (
            <article key={transfer.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <ArrowRightLeft size={18} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-950">
                      <span>{transfer.fromTenantName}</span>
                      <MoveRight size={14} className="text-slate-300" />
                      <span>{transfer.toTenantName}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>Ngày chuyển: {formatDate(transfer.transferDate)}</span>
                      <span>Tiền cọc bàn giao: {formatVND(transfer.carryOverDepositAmount)}</span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {getContractTransferStatusLabel(transfer.status)}
                </span>
              </div>

              {transfer.note ? <div className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{transfer.note}</div> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <History size={16} />
            Chưa có lịch sử chuyển người đứng tên cho hợp đồng này.
          </div>
        </div>
      )}
    </div>
  );
}
