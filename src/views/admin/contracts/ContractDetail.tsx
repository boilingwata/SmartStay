import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  Building2,
  CalendarDays,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Receipt,
  RefreshCcw,
  User,
  Users,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { ContractDetail as ContractDetailModel, ContractOccupant } from '@/models/Contract';
import { LiquidationModal } from '@/components/contracts/modals/LiquidationModal';
import { AddOccupantModal } from '@/components/contracts/modals/AddOccupantModal';
import { TransferContractModal } from '@/components/contracts/modals/TransferContractModal';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { contractService } from '@/services/contractService';
import { cn, formatVND } from '@/utils';

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có dữ liệu';
  return format(parseISO(value), 'dd/MM/yyyy');
};

const getActiveOccupants = (contract: ContractDetailModel) =>
  contract.occupants.filter((occupant) => occupant.status === 'active');

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'occupants' | 'transfers' | 'invoices'>('overview');
  const [isAddOccupantModalOpen, setAddOccupantModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isLiquidationModalOpen, setLiquidationModalOpen] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetail(id as string),
    enabled: !!id,
  });

  const removeOccupantMutation = useMutation({
    mutationFn: (occupant: ContractOccupant) =>
      contractService.removeOccupant({
        contractId: contract!.id,
        tenantId: occupant.tenantId,
        moveOutDate: new Date().toISOString().split('T')[0],
        note: `Occupant ${occupant.fullName} rời phòng`,
      }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['contract', id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      if (result.autoLiquidated) {
        toast.success('Occupant cuối cùng đã rời đi, hệ thống tự động thanh lý hợp đồng.');
      } else {
        toast.success('Đã ghi nhận occupant rời phòng.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật occupant.');
    },
  });

  const activeOccupants = useMemo(() => (contract ? getActiveOccupants(contract) : []), [contract]);
  const activeSecondaryOccupants = activeOccupants.filter((occupant) => !occupant.isPrimaryTenant);

  if (isLoading) {
    return (
      <div className="flex h-[420px] items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-2xl font-black text-slate-900">Không tìm thấy hợp đồng</h2>
        <button onClick={() => navigate('/admin/contracts')} className="btn-outline mt-6">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan', icon: FileText },
    { id: 'occupants' as const, label: 'Người ở cùng', icon: Users },
    { id: 'transfers' as const, label: 'Chuyển hợp đồng', icon: ArrowRightLeft },
    { id: 'invoices' as const, label: 'Hóa đơn', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/30">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[2px] text-slate-400">
          <Link to="/admin/dashboard" className="flex items-center gap-1 transition-colors hover:text-primary">
            <Home size={12} />
            Tổng quan
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <Link to="/admin/contracts" className="transition-colors hover:text-primary">
            Hợp đồng
          </Link>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-bold text-primary">{contract.contractCode}</span>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText size={22} />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{contract.contractCode}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-slate-300" />
                    {contract.buildingName} • {contract.roomCode}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-slate-300" />
                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                  </span>
                </div>
              </div>

              <StatusBadge status={contract.status} size="lg" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard label="Người đại diện" value={contract.primaryTenant?.fullName || contract.tenantName || 'Chưa có'} />
              <SummaryCard label="Occupant đang ở" value={String(activeOccupants.length)} />
              <SummaryCard label="Tiền cọc" value={formatVND(contract.depositAmount)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAddOccupantModalOpen(true)}
              className="btn-outline flex items-center gap-2"
            >
              <Users size={18} />
              Thêm occupant
            </button>
            <button
              onClick={() => {
                if (activeSecondaryOccupants.length > 0) {
                  setTransferModalOpen(true);
                  return;
                }
                setLiquidationModalOpen(true);
              }}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCcw size={18} />
              A rời đi
            </button>
            <button
              onClick={() => setLiquidationModalOpen(true)}
              className="btn-primary flex items-center gap-2 bg-amber-600 hover:bg-amber-700"
            >
              <LogOut size={18} />
              Thanh lý hợp đồng
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl shadow-slate-200/30">
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/70 px-3">
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

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab contract={contract} />}
          {activeTab === 'occupants' && (
            <OccupantsTab
              contract={contract}
              onAddOccupant={() => setAddOccupantModalOpen(true)}
              onTransfer={() => setTransferModalOpen(true)}
              onLiquidate={() => setLiquidationModalOpen(true)}
              onRemoveOccupant={(occupant) => removeOccupantMutation.mutate(occupant)}
              isRemoving={removeOccupantMutation.isPending}
            />
          )}
          {activeTab === 'transfers' && <TransfersTab contract={contract} onTransfer={() => setTransferModalOpen(true)} />}
          {activeTab === 'invoices' && <InvoicesTab contract={contract} />}
        </div>
      </section>

      <TransferContractModal
        isOpen={isTransferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        contract={contract}
      />

      <AddOccupantModal
        isOpen={isAddOccupantModalOpen}
        onClose={() => setAddOccupantModalOpen(false)}
        contract={contract}
      />

      <LiquidationModal
        isOpen={isLiquidationModalOpen}
        onClose={() => setLiquidationModalOpen(false)}
        contract={contract}
        defaultReason={
          activeOccupants.length === 0
            ? 'Tất cả occupant đã rời phòng.'
            : 'Người đại diện chính rời đi và không tiếp tục duy trì hợp đồng.'
        }
      />
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
  </div>
);

const OverviewTab = ({ contract }: { contract: ContractDetailModel }) => {
  const activeSecondaryOccupants = contract.occupants.filter(
    (occupant) => occupant.status === 'active' && !occupant.isPrimaryTenant
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Logic đang áp dụng</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>1 hợp đồng chỉ có 1 người đại diện ký hợp đồng.</p>
            <p>Các occupant chỉ ở cùng, không có quyền ký hay chuyển nghĩa vụ pháp lý của hợp đồng hiện tại.</p>
            <p>
              Khi occupant phụ rời đi, hợp đồng giữ nguyên. Khi người đại diện rời đi, hệ thống buộc chọn chuyển hợp đồng cho occupant còn ở lại hoặc thanh lý.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-100 bg-white p-5">
          <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Thông tin hợp đồng</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Mã hợp đồng" value={contract.contractCode} />
            <InfoItem label="Phòng" value={`${contract.buildingName} • ${contract.roomCode}`} />
            <InfoItem label="Ngày bắt đầu" value={formatDate(contract.startDate)} />
            <InfoItem label="Ngày kết thúc" value={formatDate(contract.endDate)} />
            <InfoItem label="Ngày ký" value={formatDate(contract.signingDate)} />
            <InfoItem label="Đến hạn thanh toán" value={`Ngày ${contract.paymentDueDay} hàng tháng`} />
            <InfoItem label="Tiền thuê" value={formatVND(contract.rentPriceSnapshot)} />
            <InfoItem label="Tiền cọc" value={formatVND(contract.depositAmount)} />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
          <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Người đại diện hiện tại</h3>
          <div className="mt-4 rounded-[24px] border border-white bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <User size={20} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">
                  {contract.primaryTenant?.fullName || contract.tenantName || 'Chưa có dữ liệu'}
                </p>
                <p className="text-sm text-slate-500">{contract.primaryTenant?.phone || 'Chưa có số điện thoại'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
          <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Tình huống 2 theo source of truth</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>Nếu A rời đi và còn occupant ở lại: chuyển hợp đồng, tạo hợp đồng mới cho người nhận chuyển.</p>
            <p>Nếu A rời đi và không còn ai ở lại: thanh lý hợp đồng.</p>
            <p>Hiện tại hợp đồng này có {activeSecondaryOccupants.length} occupant phụ còn ở lại.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

const OccupantsTab = ({
  contract,
  onAddOccupant,
  onTransfer,
  onLiquidate,
  onRemoveOccupant,
  isRemoving,
}: {
  contract: ContractDetailModel;
  onAddOccupant: () => void;
  onTransfer: () => void;
  onLiquidate: () => void;
  onRemoveOccupant: (occupant: ContractOccupant) => void;
  isRemoving: boolean;
}) => {
  const primaryOccupant = contract.occupants.find(
    (occupant) => occupant.isPrimaryTenant && occupant.status === 'active'
  );
  const secondaryOccupants = contract.occupants.filter((occupant) => !occupant.isPrimaryTenant);
  const activeSecondaryOccupants = secondaryOccupants.filter((occupant) => occupant.status === 'active');

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Người đại diện</h3>
            <p className="mt-1 text-sm text-slate-500">
              Khi người đại diện rời đi, hệ thống phải chuyển hợp đồng hoặc thanh lý.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={onTransfer} className="btn-outline" disabled={activeSecondaryOccupants.length === 0}>
              Chuyển hợp đồng cho B
            </button>
            <button onClick={onLiquidate} className="btn-primary bg-amber-600 hover:bg-amber-700">
              Thanh lý hợp đồng
            </button>
          </div>
        </div>

        {primaryOccupant ? (
          <OccupantCard occupant={primaryOccupant} emphasis="primary" />
        ) : (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            Hợp đồng chưa có occupant nào được đánh dấu là tenant chính.
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-slate-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Occupant ở cùng</h3>
            <p className="mt-1 text-sm text-slate-500">
              Khi B rời đi, chỉ cần cập nhật occupant sang trạng thái rời đi. Hợp đồng của A không đổi.
            </p>
          </div>
        </div>

        {secondaryOccupants.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Hợp đồng này hiện chưa có occupant phụ.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {secondaryOccupants.map((occupant) => (
              <div
                key={occupant.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <OccupantCard occupant={occupant} />
                  {occupant.status === 'active' ? (
                    <button
                      onClick={() => onRemoveOccupant(occupant)}
                      className="btn-outline"
                      disabled={isRemoving}
                    >
                      {isRemoving ? 'Đang xử lý...' : 'Ghi nhận B rời đi'}
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[1px] text-slate-600">
                      Đã rời đi
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-sky-900">
        <p className="font-black uppercase tracking-[2px]">Auto thanh lý</p>
        <p className="mt-2">
          Nếu occupant cuối cùng rời đi và không còn ai ở trong hợp đồng, service sẽ tự gọi thanh lý để giữ phòng về trạng thái trống.
        </p>
      </section>
    </div>
  );
};

const TransfersTab = ({
  contract,
  onTransfer,
}: {
  contract: ContractDetailModel;
  onTransfer: () => void;
}) => (
  <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-100 bg-slate-50 p-5">
      <div>
        <h3 className="text-sm font-black uppercase tracking-[2px] text-slate-500">Lịch sử chuyển hợp đồng</h3>
        <p className="mt-1 text-sm text-slate-500">
          Lưu lại ai bàn giao, ai nhận chuyển, và cọc được carry-over như thế nào.
        </p>
      </div>

      <button onClick={onTransfer} className="btn-outline">
        Tạo chuyển hợp đồng
      </button>
    </div>

    {contract.transfers?.length ? (
      <div className="space-y-3">
        {contract.transfers.map((transfer) => (
          <div key={transfer.id} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {transfer.fromTenantName} → {transfer.toTenantName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ngày chuyển: {formatDate(transfer.transferDate)} • Cọc carry-over:{' '}
                  {formatVND(transfer.carryOverDepositAmount)}
                </p>
              </div>

              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-[1px] text-sky-700">
                {transfer.status}
              </span>
            </div>

            {transfer.note && <p className="mt-3 text-sm leading-6 text-slate-600">{transfer.note}</p>}
          </div>
        ))}
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
        Chưa có bản ghi chuyển hợp đồng nào.
      </div>
    )}
  </div>
);

const InvoicesTab = ({ contract }: { contract: ContractDetailModel }) => {
  if (!contract.invoices?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
        Hợp đồng này chưa có hóa đơn.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-black uppercase tracking-[1px] text-slate-500">
            <th className="px-4 py-3">Mã hóa đơn</th>
            <th className="px-4 py-3">Kỳ</th>
            <th className="px-4 py-3 text-right">Tổng tiền</th>
            <th className="px-4 py-3 text-right">Còn thiếu</th>
            <th className="px-4 py-3">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {contract.invoices.map((invoice) => (
            <tr key={invoice.id} className="text-sm">
              <td className="px-4 py-4 font-black text-slate-900">{invoice.invoiceCode}</td>
              <td className="px-4 py-4 text-slate-600">{invoice.billingPeriod || 'Chưa có'}</td>
              <td className="px-4 py-4 text-right font-bold text-slate-900">{formatVND(invoice.totalAmount)}</td>
              <td className="px-4 py-4 text-right font-bold text-rose-600">{formatVND(invoice.balanceDue)}</td>
              <td className="px-4 py-4 text-slate-600">{invoice.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const OccupantCard = ({
  occupant,
  emphasis,
}: {
  occupant: ContractOccupant;
  emphasis?: 'primary';
}) => (
  <div className="min-w-[260px]">
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl',
          emphasis === 'primary' ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-700'
        )}
      >
        <Users size={18} />
      </div>
      <div>
        <p className="font-black text-slate-900">{occupant.fullName}</p>
        <p className="text-sm text-slate-500">{occupant.phone || 'Chưa có số điện thoại'}</p>
      </div>
    </div>

    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[1px]">
      <span
        className={cn(
          'rounded-full px-3 py-1',
          occupant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
        )}
      >
        {occupant.status === 'active' ? 'Đang ở' : 'Đã rời'}
      </span>

      {occupant.isPrimaryTenant && (
        <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Tenant chính</span>
      )}
    </div>

    <p className="mt-3 text-sm text-slate-500">
      Vào ở: {formatDate(occupant.moveInAt)}
      {occupant.moveOutAt ? ` • Rời đi: ${formatDate(occupant.moveOutAt)}` : ''}
    </p>
  </div>
);

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
    <p className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
  </div>
);

export default ContractDetail;
