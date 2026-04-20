import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Home,
  Users,
  Wrench,
} from 'lucide-react';
import PortalLayout from '@/components/layout/PortalLayout';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { type ContractAddendum, type ContractDetail } from '@/models/Contract';
import portalService from '@/services/portalService';
import { getNormalizedHttpUrl } from '@/utils/security';
import { cn, formatDate, formatVND } from '@/utils';
import { getContractAddendumSourceLabel, getContractAddendumTypeLabel } from '@/lib/contractAddendums';

const ContractView = () => {
  const { data: contract, isLoading, isError, refetch } = useQuery<ContractDetail | null>({
    queryKey: ['portal-active-contract'],
    queryFn: () => portalService.getActiveContract(),
  });

  return (
    <PortalLayout title="Hợp đồng của tôi" showBack={true}>
      <div className="space-y-6 pb-24">
        {isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-[28px] bg-white">
            <Spinner className="h-10 w-10" />
            <p className="text-sm font-medium text-slate-500">Đang tải thông tin hợp đồng...</p>
          </div>
        ) : isError || !contract ? (
          <div className="rounded-[28px] border border-rose-100 bg-white p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle size={30} />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">Không tải được hợp đồng</h2>
            <p className="mt-2 text-sm text-slate-500">
              Không tìm thấy hợp đồng phù hợp cho tài khoản này hoặc dữ liệu chưa sẵn sàng.
            </p>
            <button onClick={() => refetch()} className="btn-primary mt-5">
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/20">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText size={22} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[2px] text-slate-400">
                        Mã hợp đồng: {contract.contractCode}
                      </p>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        Phòng {contract.roomCode}
                      </h1>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Home size={14} className="text-slate-300" />
                      {contract.buildingName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-slate-300" />
                      {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                    </span>
                  </div>
                </div>

                <StatusBadge status={contract.status} size="lg" />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <SummaryCard label="Người đại diện" value={contract.primaryTenant?.fullName || contract.tenantName || 'Chưa có'} />
                <SummaryCard label="Tiền phòng / kỳ" value={formatVND(contract.rentPriceSnapshot)} />
                <SummaryCard label="Số người ở" value={String(contract.occupants.filter((item) => item.status === 'active').length)} />
                <SummaryCard label="Phụ lục" value={String(contract.addendums?.length ?? 0)} />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <Card title="Thông tin hiệu lực">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoItem label="Ngày ký" value={formatDate(contract.signingDate || contract.startDate)} />
                    <InfoItem label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
                    <InfoItem label="Ngày kết thúc" value={formatDate(contract.endDate)} />
                    <InfoItem label="Báo trước" value={`${contract.noticePeriodDays ?? 30} ngày`} />
                    <InfoItem label="Chu kỳ thanh toán" value={`${contract.paymentCycle} tháng / lần`} />
                    <InfoItem label="Hạn thanh toán" value={`Ngày ${contract.paymentDueDay} hằng tháng`} />
                  </div>
                </Card>

                <Card title="Người cùng hợp đồng">
                  <div className="space-y-3">
                    {contract.occupants.length > 0 ? (
                      contract.occupants.map((occupant) => (
                        <div key={occupant.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center rounded-2xl',
                                  occupant.isPrimaryTenant ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-700'
                                )}
                              >
                                <Users size={18} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900">{occupant.fullName}</p>
                                <p className="text-sm text-slate-500">{occupant.phone || 'Chưa có số điện thoại'}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[1px]">
                              <span
                                className={cn(
                                  'rounded-full px-3 py-1',
                                  occupant.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-600'
                                )}
                              >
                                {occupant.status === 'active' ? 'Đang ở' : 'Đã rời'}
                              </span>
                              {occupant.isPrimaryTenant ? (
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Đại diện hợp đồng</span>
                              ) : null}
                            </div>
                          </div>

                          <p className="mt-3 text-sm text-slate-500">
                            Vào ở: {formatDate(occupant.moveInAt)}
                            {occupant.moveOutAt ? ` • Rời đi: ${formatDate(occupant.moveOutAt)}` : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState text="Chưa có danh sách occupant cho hợp đồng này." />
                    )}
                  </div>
                </Card>

                <Card title="Phụ lục hợp đồng">
                  <div className="space-y-3">
                    {contract.addendums?.length ? (
                      contract.addendums.map((addendum) => <AddendumCard key={addendum.id} addendum={addendum} />)
                    ) : (
                      <EmptyState text="Hợp đồng này chưa có phụ lục." />
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card title="Chi phí">
                  <div className="grid gap-4">
                    <InfoItem label="Tiền cọc" value={formatVND(contract.depositAmount)} />
                    <InfoItem label="Tiền phòng / kỳ" value={formatVND(contract.rentPriceSnapshot)} />
                    <InfoItem
                      label="Dịch vụ cố định / kỳ"
                      value={formatVND(contract.services.reduce((sum, item) => sum + item.totalPerCycle, 0))}
                    />
                  </div>
                </Card>

                <Card title="Dịch vụ áp dụng">
                  <div className="space-y-3">
                    {contract.services.length > 0 ? (
                      contract.services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                              <Wrench size={18} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{service.serviceName}</p>
                              <p className="text-sm text-slate-500">
                                {service.quantity} {service.unit || 'đơn vị'}
                              </p>
                            </div>
                          </div>
                          <p className="font-black text-slate-900">{formatVND(service.totalPerCycle)}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState text="Chưa có dịch vụ cố định đi kèm." />
                    )}
                  </div>
                </Card>

                <Card title="Lưu ý">
                  <div className="space-y-3 text-sm leading-6 text-slate-600">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" />
                      Hợp đồng này ở chế độ chỉ xem. Nếu cần chỉnh sửa, vui lòng liên hệ ban quản lý.
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock3 size={16} className="mt-1 shrink-0 text-amber-600" />
                      Khi muốn chấm dứt hoặc gia hạn hợp đồng, bạn cần báo trước {contract.noticePeriodDays ?? 30} ngày.
                    </p>
                  </div>
                </Card>
              </div>
            </section>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

const AddendumCard = ({ addendum }: { addendum: ContractAddendum }) => {
  const safeUrl =
    typeof addendum.fileUrl === 'string' ? getNormalizedHttpUrl(addendum.fileUrl) : null;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-900">{addendum.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            {addendum.addendumCode} • {getContractAddendumTypeLabel(addendum.type)} •{' '}
            {getContractAddendumSourceLabel(addendum.sourceType)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Hiệu lực: {formatDate(addendum.effectiveDate)} • Phiên bản {addendum.versionNo}
          </p>
        </div>
        <StatusBadge status={addendum.status} size="sm" />
      </div>

      {addendum.content ? <p className="mt-3 text-sm leading-6 text-slate-600">{addendum.content}</p> : null}

      {safeUrl ? (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          <Download size={14} />
          Xem tệp đính kèm
        </a>
      ) : null}
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/20">
    <h2 className="text-sm font-black uppercase tracking-[2px] text-slate-500">{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
);

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
  </div>
);

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">{text}</div>
);

export default ContractView;
