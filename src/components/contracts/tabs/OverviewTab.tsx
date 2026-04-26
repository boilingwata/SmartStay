import { Calendar, DollarSign, FileText, Info, Receipt, Users } from 'lucide-react';
import { InfoItem } from '@/components/contracts/detail/ContractDetailSections';
import type { ContractDetail as ContractDetailModel } from '@/models/Contract';
import { getContractDepositStatusLabel } from '@/lib/contractPresentation';
import { formatDate, formatVND } from '@/utils';

interface OverviewTabProps {
  contract: ContractDetailModel;
}

export function OverviewTab({ contract }: OverviewTabProps) {
  const activeOccupantsCount = contract.occupants.filter((occupant) => occupant.status === 'active').length;
  const recurringServiceTotal = contract.services.reduce((sum, service) => sum + service.totalPerCycle, 0);
  const recurringEstimate = contract.rentPriceSnapshot + recurringServiceTotal;
  const latestInvoice = contract.invoices?.[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-slate-950" />
            <h3 className="text-sm font-bold text-slate-950">Thông tin cốt lõi</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Mã hợp đồng" value={contract.contractCode} icon={FileText} />
            <InfoItem label="Vị trí" value={`${contract.buildingName} • ${contract.roomCode}`} icon={Info} />
            <InfoItem label="Ngày bắt đầu" value={formatDate(contract.startDate)} icon={Calendar} />
            <InfoItem label="Ngày kết thúc" value={formatDate(contract.endDate)} icon={Calendar} />
            <InfoItem label="Ngày ký" value={formatDate(contract.signingDate)} icon={Calendar} />
            <InfoItem label="Ngày thu tiền" value={`Ngày ${contract.paymentDueDay} mỗi kỳ`} icon={Receipt} />
            <InfoItem label="Báo trước khi kết thúc" value={`${contract.noticePeriodDays ?? 30} ngày`} icon={Info} />
            <InfoItem label="Tình trạng tiền cọc" value={getContractDepositStatusLabel(contract.depositStatus)} icon={DollarSign} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-950">Chi phí định kỳ</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Tiền thuê mỗi kỳ" value={formatVND(contract.rentPriceSnapshot)} icon={DollarSign} />
            <InfoItem label="Dịch vụ cố định" value={formatVND(recurringServiceTotal)} icon={Receipt} />
            <InfoItem
              label="Tổng dự kiến mỗi kỳ"
              value={formatVND(recurringEstimate)}
              icon={Receipt}
              className="border-slate-900 bg-slate-900 text-white [&_p:last-child]:text-white [&_p:first-child]:text-slate-300 [&_svg]:text-slate-300"
            />
            <InfoItem label="Số người đang ở" value={`${activeOccupantsCount} người`} icon={Users} />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Người chịu trách nhiệm chính</h3>
          <div className="mt-4 rounded-[20px] border border-slate-200 bg-white p-4">
            <p className="text-base font-bold text-slate-950">{contract.primaryTenant?.fullName || contract.tenantName || 'Chưa cập nhật'}</p>
            <p className="mt-1 text-sm text-slate-500">{contract.primaryTenant?.phone || 'Chưa cập nhật số điện thoại'}</p>
            <p className="mt-3 text-sm text-slate-600">
              CCCD / định danh: <span className="font-medium text-slate-950">{contract.primaryTenant?.cccd || 'Chưa cung cấp'}</span>
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chỉ báo nhanh</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Người ở cùng đang hoạt động</p>
              <p className="mt-2 text-xl font-black text-slate-950">{Math.max(activeOccupantsCount - 1, 0)}</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Số phụ lục đã lập</p>
              <p className="mt-2 text-xl font-black text-slate-950">{contract.addendums?.length ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hóa đơn gần nhất</h3>
          {latestInvoice ? (
            <div className="mt-4 space-y-4 rounded-[20px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Kỳ thanh toán</span>
                <span className="text-sm font-semibold text-slate-950">{latestInvoice.billingPeriod || 'Chưa xác định'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Tổng hóa đơn</span>
                <span className="text-sm font-semibold text-slate-950">{formatVND(latestInvoice.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">Số tiền còn nợ</span>
                <span className="text-base font-bold text-rose-700">{formatVND(latestInvoice.balanceDue)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[20px] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
              Hợp đồng này chưa phát sinh hóa đơn.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
