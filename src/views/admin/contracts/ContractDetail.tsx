import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  ChevronLeft,
  FileText,
  LogOut,
  Plus,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { AddOccupantModal } from '@/components/contracts/modals/AddOccupantModal';
import { CreateAddendumModal } from '@/components/contracts/modals/CreateAddendumModal';
import { LiquidationModal } from '@/components/contracts/modals/LiquidationModal';
import { TransferContractModal } from '@/components/contracts/modals/TransferContractModal';
import { ContractDateRange } from '@/components/contracts/ContractDateRange';
import { SummaryCard } from '@/components/contracts/detail/ContractDetailSections';
import { ContractPriceDisplay } from '@/components/contracts/ContractPriceDisplay';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { AddendumsTab } from '@/components/contracts/tabs/AddendumsTab';
import { InvoicesTab } from '@/components/contracts/tabs/InvoicesTab';
import { OccupantsTab } from '@/components/contracts/tabs/OccupantsTab';
import { OverviewTab } from '@/components/contracts/tabs/OverviewTab';
import { TransfersTab } from '@/components/contracts/tabs/TransfersTab';
import { Spinner } from '@/components/ui/Feedback';
import { ROUTES } from '@/constants/routes';
import { getContractDepositStatusLabel } from '@/lib/contractPresentation';
import { contractService } from '@/services/contractService';
import { cn, formatDate, formatVND } from '@/utils';

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: FileText },
  { id: 'occupants', label: 'Cư trú', icon: Users },
  { id: 'addendums', label: 'Phụ lục', icon: FileText },
  { id: 'transfers', label: 'Chuyển quyền', icon: ArrowRightLeft },
  { id: 'invoices', label: 'Hóa đơn', icon: Receipt },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isAddOccupantModalOpen, setAddOccupantModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isLiquidationModalOpen, setLiquidationModalOpen] = useState(false);
  const [isCreateAddendumModalOpen, setCreateAddendumModalOpen] = useState(false);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractService.getContractDetail(id as string),
    enabled: Boolean(id),
  });

  const removeOccupantMutation = useMutation({
    mutationFn: (occupant: { tenantId: string; fullName: string }) =>
      contractService.removeOccupant({
        contractId: contract!.id,
        tenantId: occupant.tenantId,
        moveOutDate: new Date().toISOString().split('T')[0],
        note: `${occupant.fullName} rời khỏi danh sách cư trú của hợp đồng`,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contract', id] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Đã cập nhật danh sách cư trú của hợp đồng.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật danh sách cư trú.');
    },
  });

  const activeOccupants = useMemo(() => {
    return contract ? contract.occupants.filter((occupant) => occupant.status === 'active') : [];
  }, [contract]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Spinner className="h-10 w-10 text-slate-900" />
        <p className="text-sm text-slate-500">Đang tải hồ sơ hợp đồng...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FileText size={24} />
        </div>
        <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Không tìm thấy hợp đồng</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Hồ sơ có thể đã bị xóa hoặc đường dẫn hiện tại không còn hợp lệ trong hệ thống.
        </p>
        <button
          type="button"
          onClick={() => navigate(ROUTES.OWNER.CONTRACTS)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-5">
            <Link to={ROUTES.OWNER.CONTRACTS} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
              <ChevronLeft size={16} />
              Quay lại danh sách hợp đồng
            </Link>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                  <FileText size={14} />
                  Hồ sơ hợp đồng
                </span>
                <ContractStatusBadge status={contract.status} />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{contract.contractCode}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                  {contract.primaryTenant?.fullName || contract.tenantName || 'Chưa có người đứng tên'} • {contract.buildingName} • {contract.roomCode}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Thời hạn hợp đồng</p>
                <div className="mt-2">
                  <ContractDateRange startDate={contract.startDate} endDate={contract.endDate} compact showDuration />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Giá thuê đang áp dụng</p>
                <div className="mt-2">
                  <ContractPriceDisplay amount={contract.rentPriceSnapshot} size="lg" />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Thu tiền và tiền cọc</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Ngày {contract.paymentDueDay} mỗi kỳ</p>
                <p className="mt-1 text-xs text-slate-500">{getContractDepositStatusLabel(contract.depositStatus)}</p>
                <p className="mt-1 text-xs text-slate-500">Tiền cọc: {formatVND(contract.depositAmount)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 xl:w-[360px]">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Việc nên làm tiếp</p>
              <div className="mt-3 grid gap-3">
                <button
                  type="button"
                  onClick={() => setCreateAddendumModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <FileText size={16} />
                  Lập phụ lục
                </button>
                <button
                  type="button"
                  onClick={() => setAddOccupantModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Users size={16} />
                  Thêm người ở cùng
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600">Hành động nguy hiểm</p>
              <button
                type="button"
                onClick={() => setLiquidationModalOpen(true)}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut size={16} />
                Thanh lý hợp đồng
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Người đứng tên" value={contract.primaryTenant?.fullName || contract.tenantName || 'Chưa cập nhật'} icon={ShieldCheck} tone="slate" />
        <SummaryCard label="Người đang ở" value={`${activeOccupants.length} người`} icon={Users} tone="sky" />
        <SummaryCard label="Số phụ lục" value={`${contract.addendums?.length ?? 0} bản`} icon={FileText} tone="emerald" />
        <SummaryCard label="Ngày ký gần nhất" value={formatDate(contract.signingDate)} icon={Receipt} tone="amber" />
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 sm:px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition',
                activeTab === tab.id ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {activeTab === 'overview' ? <OverviewTab contract={contract} /> : null}
          {activeTab === 'occupants' ? (
            <OccupantsTab
              contract={contract}
              onAddOccupant={() => setAddOccupantModalOpen(true)}
              onTransfer={() => setTransferModalOpen(true)}
              onLiquidate={() => setLiquidationModalOpen(true)}
              onRemoveOccupant={(occupant) => removeOccupantMutation.mutate(occupant)}
              isRemoving={removeOccupantMutation.isPending}
            />
          ) : null}
          {activeTab === 'addendums' ? <AddendumsTab contract={contract} onCreateAddendum={() => setCreateAddendumModalOpen(true)} /> : null}
          {activeTab === 'transfers' ? <TransfersTab contract={contract} onTransfer={() => setTransferModalOpen(true)} /> : null}
          {activeTab === 'invoices' ? <InvoicesTab contract={contract} /> : null}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 p-4 backdrop-blur lg:hidden">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCreateAddendumModalOpen(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
          >
            <Plus size={16} />
            Phụ lục
          </button>
          <button
            type="button"
            onClick={() => setAddOccupantModalOpen(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-medium text-white"
          >
            <Users size={16} />
            Cư trú
          </button>
        </div>
      </div>

      <TransferContractModal isOpen={isTransferModalOpen} onClose={() => setTransferModalOpen(false)} contract={contract} />
      <AddOccupantModal isOpen={isAddOccupantModalOpen} onClose={() => setAddOccupantModalOpen(false)} contract={contract} />
      <LiquidationModal
        isOpen={isLiquidationModalOpen}
        onClose={() => setLiquidationModalOpen(false)}
        contract={contract}
        defaultReason="Kết thúc hợp đồng và chốt công nợ với người đang đứng tên."
      />
      <CreateAddendumModal isOpen={isCreateAddendumModalOpen} onClose={() => setCreateAddendumModalOpen(false)} contract={contract} />
    </div>
  );
}
