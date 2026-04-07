import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  ChevronRight,
  FileText,
  User,
  Zap,
  ShieldCheck,
  Clock,
  FilePlus,
  Receipt,
  Edit,
  LogOut,
  Building2,
  AlertTriangle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { contractService } from '@/services/contractService';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ContractTimelineBar } from '@/components/contracts/ContractTimelineBar';
import { cn, formatVND } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { ExtendContractModal } from '@/components/contracts/modals/ExtendContractModal';
import { TerminateContractModal } from '@/components/contracts/modals/TerminateContractModal';
import { CreateAddendumModal } from '@/components/contracts/modals/CreateAddendumModal';
import { LiquidationModal } from '@/components/contracts/modals/LiquidationModal';
import type { ContractDetail as ContractDetailModel, ContractInvoice, ContractRenewal } from '@/models/Contract';

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có dữ liệu';
  return format(parseISO(value), 'dd/MM/yyyy');
};

const getDaysToEnd = (endDate: string) => differenceInCalendarDaysSafe(endDate);

const differenceInCalendarDaysSafe = (endDate: string) => {
  try {
    return Math.ceil((parseISO(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

const getExpiryTone = (endDate: string) => {
  const days = getDaysToEnd(endDate);
  if (days < 0) return 'text-danger';
  if (days <= 30) return 'text-warning';
  return 'text-slate-900';
};

const getExpiryLabel = (endDate: string) => {
  const days = getDaysToEnd(endDate);
  if (days < 0) return `Quá hạn ${Math.abs(days)} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  return `Còn ${days} ngày`;
};

const getDepositStatusLabel = (raw?: string, fallback?: string) => {
  switch (raw) {
    case 'pending':
      return 'Chờ thu cọc';
    case 'received':
      return 'Đã nhận cọc';
    case 'partially_refunded':
      return 'Hoàn cọc một phần';
    case 'refunded':
      return 'Đã hoàn cọc';
    case 'forfeited':
      return 'Khấu trừ cọc';
    default:
      return fallback || 'Chưa có dữ liệu';
  }
};

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isExtendModalOpen, setExtendModalOpen] = useState(false);
  const [isTerminateModalOpen, setTerminateModalOpen] = useState(false);
  const [isAddendumModalOpen, setAddendumModalOpen] = useState(false);
  const [isLiquidationModalOpen, setLiquidationModalOpen] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetail(id as string),
    enabled: !!id,
  });

  const dataWarnings = useMemo(() => {
    if (!contract) return [];

    const warnings: string[] = [];
    if (!contract.tenants?.length) warnings.push('Chưa có liên kết cư dân trong `contract_tenants`.');
    if (!contract.services?.length) warnings.push('Chưa có dịch vụ gắn với hợp đồng trong `contract_services`.');
    if (!contract.renewals?.length) warnings.push('Chưa có bản ghi gia hạn trong `contract_renewals`.');
    if (!contract.invoices?.length) warnings.push('Chưa có hóa đơn gắn với hợp đồng trong `invoices`.');
    if (!contract.addendumSourceAvailable) warnings.push('Nguồn `contract_addendums` chưa tồn tại trong schema Supabase đang kết nối.');
    if (!contract.tenantName) warnings.push('Thiếu người đại diện chính vì hợp đồng chưa có tenant link.');
    if (!contract.signingDate) warnings.push('`signing_date` hiện đang để trống.');
    warnings.push('`payment_due_day` chưa tồn tại trong bảng `contracts`, nên frontend đang hiển thị mặc định mùng 5.');
    return warnings;
  }, [contract]);

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-20 text-center">
        <h2 className="mb-4 text-2xl font-black text-primary">Không tìm thấy hợp đồng</h2>
        <button onClick={() => navigate('/admin/contracts')} className="btn-outline mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: FileText },
    { id: 'tenants', label: 'Cư dân', icon: User },
    { id: 'services', label: 'Dịch vụ', icon: Zap },
    { id: 'signers', label: 'Đại diện ký', icon: ShieldCheck },
    { id: 'extensions', label: 'Gia hạn', icon: Clock },
    { id: 'addendums', label: 'Phụ lục', icon: FilePlus },
    { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/40 sm:p-6 lg:p-8">
        <div className="mb-5 flex flex-wrap items-center gap-2 overflow-hidden text-[10px] font-black uppercase tracking-[2px] text-slate-400">
          <Link to="/admin/dashboard" className="flex items-center gap-1 transition-colors hover:text-primary">
            <Home size={12} /> Tổng quan
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link to="/admin/contracts" className="transition-colors hover:text-primary">
            Hợp đồng
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="truncate font-bold text-primary">{contract.contractCode}</span>
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 lg:text-[30px]">{contract.contractCode}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-300" />
                    {contract.buildingName} · {contract.roomCode}
                  </span>
                  <span className={cn('font-bold', getExpiryTone(contract.endDate))}>{getExpiryLabel(contract.endDate)}</span>
                </div>
              </div>
              <StatusBadge status={contract.status} size="lg" />
            </div>

            {dataWarnings.length > 0 && (
              <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" />
                  <div className="space-y-1">
                    <p className="text-sm font-black text-warning">Một số phần đang thiếu dữ liệu nguồn</p>
                    <p className="text-sm text-warning/90">
                      Frontend đã sẵn sàng hiển thị. Các mục dưới đây đang trống vì dữ liệu trong Supabase hiện chưa có đủ.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-outline flex items-center gap-2" onClick={() => toast.info('Chức năng chỉnh sửa đang được phát triển')}>
              <Edit size={18} /> Sửa
            </button>
            <button className="btn-outline flex items-center gap-2" onClick={() => setAddendumModalOpen(true)}>
              <FilePlus size={18} /> Tạo phụ lục
            </button>
            <button className="btn-outline flex items-center gap-2" onClick={() => setLiquidationModalOpen(true)}>
              <Receipt size={18} /> Thanh lý
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => setExtendModalOpen(true)}>
              Gia hạn
            </button>
            <button className="btn-danger-outline flex items-center gap-2" onClick={() => setTerminateModalOpen(true)}>
              <LogOut size={18} /> Chấm dứt
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/30 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Tiến độ thời gian hợp đồng</h2>
            <p className="mt-1 text-sm text-slate-500">Theo dõi nhanh trạng thái hiệu lực và mốc thời gian quan trọng.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-2 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">Ký / hiệu lực</p>
            <p className="text-sm font-black text-slate-900">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
          </div>
        </div>
        <ContractTimelineBar startDate={contract.startDate} endDate={contract.endDate} />
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-2 sm:px-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'border-primary bg-white text-primary'
                  : 'border-transparent text-slate-500 hover:bg-white hover:text-primary'
              )}
            >
              <tab.icon size={17} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab contract={contract} />}
          {activeTab === 'tenants' && <TenantsTab contract={contract} />}
          {activeTab === 'services' && <ServicesTab contract={contract} />}
          {activeTab === 'signers' && <SignersTab contract={contract} />}
          {activeTab === 'extensions' && <ExtensionsTab renewals={contract.renewals || []} />}
          {activeTab === 'addendums' && (
            <AddendumsTab addendumSourceAvailable={contract.addendumSourceAvailable ?? false} addendums={contract.addendums || []} />
          )}
          {activeTab === 'invoices' && <InvoicesTab invoices={contract.invoices || []} />}
        </div>
      </section>

      <ExtendContractModal isOpen={isExtendModalOpen} onClose={() => setExtendModalOpen(false)} contract={contract} />
      <TerminateContractModal isOpen={isTerminateModalOpen} onClose={() => setTerminateModalOpen(false)} contract={contract} />
      <CreateAddendumModal isOpen={isAddendumModalOpen} onClose={() => setAddendumModalOpen(false)} contract={contract} />
      <LiquidationModal isOpen={isLiquidationModalOpen} onClose={() => setLiquidationModalOpen(false)} contract={contract} />
    </div>
  );
};

const OverviewTab = ({ contract }: { contract: ContractDetailModel }) => {
  const summaryCards = [
    { label: 'Tiền thuê cố định', value: formatVND(contract.rentPriceSnapshot), tone: 'text-success' },
    { label: 'Tiền đặt cọc', value: formatVND(contract.depositAmount), tone: 'text-slate-900' },
    { label: 'Chu kỳ thanh toán', value: `${contract.paymentCycle} tháng / kỳ`, tone: 'text-slate-900' },
    { label: 'Đến hạn thanh toán', value: `Mùng ${contract.paymentDueDay} hàng tháng`, tone: 'text-slate-900' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{item.label}</p>
            <p className={cn('mt-2 text-lg font-black', item.tone)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-slate-100 bg-white p-5">
          <SectionTitle title="Tổng quan hợp đồng" icon={FileText} />
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoItem label="Mã hợp đồng" value={contract.contractCode} mono />
            <InfoItem label="Loại hợp đồng" value={contract.type === 'Residential' ? 'Cư dân' : contract.type} />
            <InfoItem label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
            <InfoItem label="Ngày kết thúc" value={formatDate(contract.endDate)} />
            <InfoItem label="Ngày ký" value={contract.signingDate ? formatDate(contract.signingDate) : 'Chưa có dữ liệu'} />
            <InfoItem label="Tự động gia hạn" value={contract.autoRenew ? 'Có' : 'Không'} />
            <InfoItem label="Thời hạn báo trước" value={`${contract.noticePeriodDays || 30} ngày`} />
            <InfoItem label="Trạng thái cọc" value={getDepositStatusLabel(contract.depositStatusRaw, contract.depositStatus)} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-100 bg-slate-50/60 p-5">
            <SectionTitle title="Phòng áp dụng" icon={Building2} />
            <div className="mt-5 rounded-[24px] border border-slate-100 bg-white p-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">Tòa nhà</p>
              <p className="mt-1 text-base font-black text-slate-900">{contract.buildingName || 'Chưa có dữ liệu'}</p>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[1px] text-slate-400">Phòng</p>
              <p className="mt-1 text-2xl font-black text-primary">{contract.roomCode || '---'}</p>
              <Link to={`/admin/rooms/${contract.roomId}`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-secondary hover:underline">
                Chi tiết phòng <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {contract.terminationReason && (
            <div className="rounded-[24px] border border-danger/10 bg-danger/5 p-5">
              <SectionTitle title="Lý do chấm dứt" icon={AlertTriangle} tone="danger" />
              <p className="mt-4 text-sm font-medium leading-6 text-danger">{contract.terminationReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TenantsTab = ({ contract }: { contract: ContractDetailModel }) => {
  if (!contract.tenants.length) {
    return (
      <EmptyState
        title="Chưa có cư dân trong hợp đồng"
        message="Frontend đã sẵn sàng, nhưng hợp đồng này hiện chưa có bản ghi trong `contract_tenants`, nên không thể hiển thị cư dân hoặc đại diện ký."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {contract.tenants.map((tenant) => (
          <div key={tenant.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-black text-primary">
                {tenant.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[15px] font-black text-slate-900">{tenant.fullName}</p>
                  {tenant.isRepresentative && <StatusBadge status="Info" size="sm" label="Đại diện chính" />}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoItem label="CCCD" value={tenant.cccd || 'Chưa có dữ liệu'} />
                  <InfoItem label="Ngày tham gia" value={tenant.joinedAt || 'Chưa có dữ liệu'} />
                  <InfoItem label="Số điện thoại" value={tenant.phone || 'Chưa có dữ liệu'} />
                  <InfoItem label="Email" value={tenant.email || 'Chưa có dữ liệu'} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ServicesTab = ({ contract }: { contract: ContractDetailModel }) => {
  const total = contract.services.reduce((sum, item) => sum + item.totalPerCycle, 0);

  if (!contract.services.length) {
    return (
      <EmptyState
        title="Chưa có dịch vụ gắn với hợp đồng"
        message="Không tìm thấy bản ghi nào trong `contract_services` cho hợp đồng này."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Số dịch vụ" value={String(contract.services.length)} />
        <StatCard label="Tổng thu theo kỳ" value={formatVND(total)} tone="success" />
        <StatCard label="Chu kỳ hiện tại" value={`${contract.paymentCycle} tháng / kỳ`} />
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-100">
        <div className="grid grid-cols-12 gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-4 text-[11px] font-black uppercase tracking-[1px] text-slate-500 sm:px-6">
          <div className="col-span-12 md:col-span-4">Dịch vụ</div>
          <div className="col-span-4 md:col-span-2 md:text-right">Đơn giá</div>
          <div className="col-span-4 md:col-span-2 md:text-center">Đơn vị</div>
          <div className="col-span-4 md:col-span-2 md:text-center">Số lượng</div>
          <div className="col-span-12 md:col-span-2 md:text-right">Thành tiền / kỳ</div>
        </div>
        <div className="divide-y divide-slate-100">
          {contract.services.map((service) => (
            <div key={service.id} className="grid grid-cols-12 gap-3 px-4 py-4 sm:px-6">
              <div className="col-span-12 md:col-span-4">
                <p className="font-black text-slate-900">{service.serviceName}</p>
              </div>
              <div className="col-span-4 md:col-span-2 md:text-right">
                <p className="font-black text-slate-900">{formatVND(service.unitPriceSnapshot)}</p>
              </div>
              <div className="col-span-4 md:col-span-2 md:text-center">
                <p className="font-medium text-slate-500">{service.unit || '---'}</p>
              </div>
              <div className="col-span-4 md:col-span-2 md:text-center">
                <p className="font-black text-slate-900">{service.quantity}</p>
              </div>
              <div className="col-span-12 md:col-span-2 md:text-right">
                <p className="font-black text-primary">{formatVND(service.totalPerCycle)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SignersTab = ({ contract }: { contract: ContractDetailModel }) => {
  const signers = contract.tenants.filter((tenant) => tenant.isRepresentative);

  if (!signers.length) {
    return (
      <EmptyState
        title="Chưa xác định được đại diện ký"
        message="Hiện không có tenant nào được đánh dấu `is_primary = true` trong `contract_tenants`, nên chưa thể hiện mục đại diện ký."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {signers.map((signer) => (
        <div key={signer.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <SectionTitle title="Đại diện ký hợp đồng" icon={ShieldCheck} />
          <div className="mt-5 space-y-4">
            <InfoItem label="Họ tên" value={signer.fullName} />
            <InfoItem label="CCCD" value={signer.cccd || 'Chưa có dữ liệu'} />
            <InfoItem label="Ngày ký dự kiến" value={formatDate(contract.startDate)} />
            <InfoItem label="Vai trò" value="Người đại diện chính" />
          </div>
        </div>
      ))}
    </div>
  );
};

const ExtensionsTab = ({ renewals }: { renewals: ContractRenewal[] }) => {
  if (!renewals.length) {
    return (
      <EmptyState
        title="Chưa có lịch sử gia hạn"
        message="Không tìm thấy bản ghi nào trong `contract_renewals` cho hợp đồng này."
      />
    );
  }

  return (
    <div className="space-y-4">
      {renewals.map((renewal) => (
        <div key={renewal.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status="Info" size="sm" label="Gia hạn" />
                <p className="text-sm font-bold text-slate-500">{renewal.createdAt ? formatDate(renewal.createdAt) : 'Chưa có ngày tạo'}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoItem label="Hạn cũ" value={formatDate(renewal.previousEndDate)} />
                <InfoItem label="Hạn mới" value={formatDate(renewal.newEndDate)} />
                <InfoItem label="Tiền thuê mới" value={formatVND(renewal.newMonthlyRent)} />
              </div>
            </div>
            <div className="max-w-xl rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {renewal.reason || 'Không có ghi chú gia hạn.'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AddendumsTab = ({
  addendumSourceAvailable,
  addendums,
}: {
  addendumSourceAvailable: boolean;
  addendums: ContractDetailModel['addendums'];
}) => {
  if (!addendumSourceAvailable) {
    return (
      <EmptyState
        title="Nguồn phụ lục chưa sẵn sàng"
        message="Schema Supabase đang kết nối chưa có bảng `contract_addendums`, nên frontend không thể lấy dữ liệu phụ lục thật."
        tone="warning"
      />
    );
  }

  if (!addendums?.length) {
    return <EmptyState title="Chưa có phụ lục" message="Chưa có bản ghi phụ lục nào cho hợp đồng này." />;
  }

  return (
    <div className="space-y-4">
      {addendums.map((addendum) => (
        <div key={addendum.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-sm font-black text-primary">{addendum.addendumCode}</p>
            <StatusBadge status={addendum.status} size="sm" />
          </div>
          <p className="mt-3 text-base font-black text-slate-900">{addendum.title}</p>
          <p className="mt-1 text-sm text-slate-500">Hiệu lực từ {formatDate(addendum.effectiveDate)}</p>
          {addendum.content && <p className="mt-3 text-sm leading-6 text-slate-600">{addendum.content}</p>}
        </div>
      ))}
    </div>
  );
};

const InvoicesTab = ({ invoices }: { invoices: ContractInvoice[] }) => {
  if (!invoices.length) {
    return (
      <EmptyState
        title="Chưa có hóa đơn"
        message="Không tìm thấy hóa đơn nào đang liên kết với hợp đồng này trong bảng `invoices`."
      />
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-sm font-black text-primary">{invoice.invoiceCode}</p>
                <StatusBadge size="sm" status="Info" label={invoice.status || 'Chưa có trạng thái'} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoItem label="Kỳ hóa đơn" value={invoice.billingPeriod || 'Chưa có dữ liệu'} />
                <InfoItem label="Hạn thanh toán" value={invoice.dueDate ? formatDate(invoice.dueDate) : 'Chưa có dữ liệu'} />
                <InfoItem label="Ngày thanh toán" value={invoice.paidDate ? formatDate(invoice.paidDate) : 'Chưa thanh toán'} />
              </div>
            </div>
            <div className="grid min-w-[240px] grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MiniInfo label="Tổng tiền" value={formatVND(invoice.totalAmount)} />
              <MiniInfo label="Đã thu" value={formatVND(invoice.amountPaid)} tone="success" />
              <MiniInfo label="Còn lại" value={formatVND(invoice.balanceDue)} tone={invoice.balanceDue > 0 ? 'danger' : 'default'} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SectionTitle = ({
  title,
  icon: Icon,
  tone = 'primary',
}: {
  title: string;
  icon: React.ElementType;
  tone?: 'primary' | 'danger';
}) => (
  <div className="flex items-center gap-2">
    <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary')}>
      <Icon size={18} />
    </div>
    <h3 className="text-base font-black text-slate-900">{title}</h3>
  </div>
);

const InfoItem = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="space-y-1">
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className={cn('text-sm font-black text-slate-900', mono && 'font-mono')}>{value}</p>
  </div>
);

const StatCard = ({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className={cn('mt-2 text-lg font-black', tone === 'success' ? 'text-success' : 'text-slate-900')}>{value}</p>
  </div>
);

const MiniInfo = ({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger';
}) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3">
    <p className="text-[10px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className={cn('mt-1 text-sm font-black', tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-slate-900')}>{value}</p>
  </div>
);

const EmptyState = ({
  title,
  message,
  tone = 'default',
}: {
  title: string;
  message: string;
  tone?: 'default' | 'warning';
}) => (
  <div className={cn('rounded-[24px] border p-6', tone === 'warning' ? 'border-warning/20 bg-warning/5' : 'border-slate-100 bg-slate-50/70')}>
    <div className="flex items-start gap-3">
      {tone === 'warning' ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" /> : <Info size={18} className="mt-0.5 shrink-0 text-slate-400" />}
      <div>
        <p className={cn('text-sm font-black', tone === 'warning' ? 'text-warning' : 'text-slate-900')}>{title}</p>
        <p className={cn('mt-2 text-sm leading-6', tone === 'warning' ? 'text-warning/90' : 'text-slate-500')}>{message}</p>
      </div>
    </div>
  </div>
);

export default ContractDetail;
