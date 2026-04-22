import { FilePlus, FileText } from 'lucide-react';
import { AddendumStatusBadge } from '@/components/contracts/AddendumStatusBadge';
import type { ContractDetail as ContractDetailModel } from '@/models/Contract';
import { getContractAddendumSourceLabel, getContractAddendumTypeLabel } from '@/lib/contractPresentation';
import { formatDate } from '@/utils';

interface AddendumsTabProps {
  contract: ContractDetailModel;
  onCreateAddendum: () => void;
}

export function AddendumsTab({ contract, onCreateAddendum }: AddendumsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-950">Lịch sử phụ lục</h3>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Mỗi phụ lục ghi lại một thay đổi có chủ đích của hợp đồng: thay đổi giá, dịch vụ, phòng hoặc điều kiện áp dụng. Người vận hành chỉ cần xem loại thay đổi, ngày hiệu lực và tình trạng ký.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateAddendum}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <FilePlus size={16} />
          Lập phụ lục mới
        </button>
      </div>

      {contract.addendums?.length ? (
        <div className="space-y-4">
          {contract.addendums.map((addendum) => (
            <article key={addendum.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-950">{addendum.title}</p>
                      <AddendumStatusBadge status={addendum.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span>{addendum.addendumCode}</span>
                      <span>{getContractAddendumTypeLabel(addendum.type)}</span>
                      <span>{getContractAddendumSourceLabel(addendum.sourceType)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ngày hiệu lực</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{formatDate(addendum.effectiveDate)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Phiên bản</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">v{addendum.versionNo}</p>
                  </div>
                </div>
              </div>

              {addendum.content ? (
                <div className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{addendum.content}</div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Hợp đồng này chưa có phụ lục nào.
        </div>
      )}
    </div>
  );
}
