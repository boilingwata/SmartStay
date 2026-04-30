import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, parseISO } from 'date-fns';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Download,
  FileText,
  LayoutGrid,
  List,
  Plus,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ContractDateRange } from '@/components/contracts/ContractDateRange';
import { ContractPriceDisplay } from '@/components/contracts/ContractPriceDisplay';
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { ROUTES } from '@/constants/routes';
import { getContractStatusLabel } from '@/lib/contractPresentation';
import { buildingService } from '@/services/buildingService';
import { ContractFilter, contractService } from '@/services/contractService';
import { cn } from '@/utils';

const DEFAULT_FILTERS: ContractFilter = {
  buildingId: '',
  status: '',
  search: '',
  roomCode: '',
  endDateFrom: '',
  endDateTo: '',
  minRent: undefined,
  maxRent: undefined,
  expiringSoon: false,
};

const STATUS_FILTERS = [
  { key: '', label: 'Tất cả hợp đồng' },
  { key: 'Active', label: 'Đang hiệu lực' },
  { key: 'Signed', label: 'Chờ ký' },
  { key: 'Draft', label: 'Bản nháp' },
  { key: 'Expired', label: 'Hết hạn' },
  { key: 'Terminated', label: 'Đã thanh lý' },
  { key: 'Cancelled', label: 'Đã hủy' },
] as const;

function getRemainingDays(endDate: string) {
  const days = differenceInDays(parseISO(endDate), new Date());
  if (days < 0) return { label: `Quá hạn ${Math.abs(days)} ngày`, tone: 'rose' as const };
  if (days === 0) return { label: 'Hết hạn hôm nay', tone: 'rose' as const };
  if (days <= 30) return { label: `Còn ${days} ngày`, tone: 'rose' as const };
  if (days <= 60) return { label: `Còn ${days} ngày`, tone: 'amber' as const };
  return { label: `Còn ${days} ngày`, tone: 'slate' as const };
}

export default function ContractList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState<ContractFilter>(() => ({
    ...DEFAULT_FILTERS,
    status: searchParams.get('status') ?? '',
    roomCode: searchParams.get('roomId') ?? '',
  }));

  const { data: contracts = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => contractService.getContracts(filters),
  });

  const summary = useMemo(() => {
    const active = contracts.filter((item) => item.status === 'Active').length;
    const waitingSignature = contracts.filter((item) => item.status === 'Signed').length;
    const drafts = contracts.filter((item) => item.status === 'Draft').length;
    const expiringSoon = contracts.filter((item) => {
      if (item.status !== 'Active') return false;
      return differenceInDays(parseISO(item.endDate), new Date()) <= 30;
    }).length;

    return {
      total: contracts.length,
      active,
      waitingSignature,
      drafts,
      expiringSoon,
    };
  }, [contracts]);

  const activeFilters = useMemo(() => {
    return [
      filters.buildingId,
      filters.status,
      filters.roomCode,
      filters.endDateFrom,
      filters.endDateTo,
      filters.minRent,
      filters.maxRent,
      filters.expiringSoon,
    ].filter(Boolean).length;
  }, [filters]);

  const loadBuildings = async (search: string) => {
    const buildings = await buildingService.getBuildings();
    return buildings
      .filter((building) => building.buildingName.toLowerCase().includes(search.toLowerCase()))
      .map((building) => ({ label: building.buildingName, value: String(building.id) }));
  };

  const updateFilter = <K extends keyof ContractFilter>(key: K, value: ContractFilter[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const exportContracts = async () => {
    try {
      toast.info('Đang chuẩn bị file xuất danh sách hợp đồng...');
      await contractService.exportContracts(filters);
      toast.success('Đã tạo file xuất. Bạn có thể tải lại nếu cần.');
    } catch {
      toast.error('Không thể xuất danh sách hợp đồng.');
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-24">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
              <FileText size={14} />
              Quản lý hợp đồng
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Danh sách hợp đồng</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Theo dõi hợp đồng theo tòa nhà, phòng, người đứng tên và thời hạn. Mỗi dòng chỉ giữ những gì người vận hành cần để biết nên mở hồ sơ nào và xử lý tiếp việc gì.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={exportContracts}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Download size={16} />
              Xuất danh sách
            </button>
            <button
              type="button"
              onClick={() => navigate(`${ROUTES.OWNER.CONTRACTS}/create`)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Tạo hợp đồng mới
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryTile label="Tổng số hợp đồng" value={summary.total} tone="slate" />
        <SummaryTile label="Đang hiệu lực" value={summary.active} tone="emerald" />
        <SummaryTile label="Chờ ký" value={summary.waitingSignature} tone="sky" />
        <SummaryTile label="Bản nháp" value={summary.drafts} tone="amber" />
        <SummaryTile label="Sắp hết hạn" value={summary.expiringSoon} tone="rose" />
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search ?? ''}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Tìm theo mã hợp đồng, người thuê, phòng hoặc tòa nhà"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_200px_auto_auto]">
            <SelectAsync
              label="Tòa nhà"
              icon={Building2}
              placeholder="Tất cả tòa nhà"
              loadOptions={loadBuildings}
              value={filters.buildingId}
              onChange={(value) => updateFilter('buildingId', value)}
              onClear={() => updateFilter('buildingId', '')}
            />

            <select
              value={filters.status ?? ''}
              onChange={(event) => updateFilter('status', event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
            >
              {STATUS_FILTERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className={cn(
                'inline-flex h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition',
                showAdvanced ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <SlidersHorizontal size={16} />
              Bộ lọc nâng cao
              {activeFilters > 0 ? (
                <span className={cn('rounded-full px-2 py-0.5 text-xs', showAdvanced ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-700')}>
                  {activeFilters}
                </span>
              ) : null}
            </button>

            <div className="flex items-center gap-2 justify-self-end">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn('rounded-xl p-2 transition', viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400')}
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn('rounded-xl p-2 transition', viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400')}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50',
                  isFetching && 'animate-spin'
                )}
              >
                <RefreshCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {showAdvanced ? (
          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-5">
            <input
              type="text"
              value={filters.roomCode ?? ''}
              onChange={(event) => updateFilter('roomCode', event.target.value)}
              placeholder="Lọc theo mã phòng"
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
            />
            <input
              type="date"
              value={filters.endDateFrom ?? ''}
              onChange={(event) => updateFilter('endDateFrom', event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
            />
            <input
              type="date"
              value={filters.endDateTo ?? ''}
              onChange={(event) => updateFilter('endDateTo', event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={filters.minRent ?? ''}
                onChange={(event) => updateFilter('minRent', event.target.value ? Number(event.target.value) : undefined)}
                placeholder="Từ giá thuê"
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
              <input
                type="number"
                value={filters.maxRent ?? ''}
                onChange={(event) => updateFilter('maxRent', event.target.value ? Number(event.target.value) : undefined)}
                placeholder="Đến giá thuê"
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Chỉ xem hồ sơ sắp hết hạn trong 30 ngày</span>
              <input
                type="checkbox"
                checked={Boolean(filters.expiringSoon)}
                onChange={(event) => updateFilter('expiringSoon', event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300"
              />
            </label>
            <div className="lg:col-span-5 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Xóa toàn bộ bộ lọc
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-950">Kết quả đang hiển thị</h2>
            <p className="text-sm text-slate-500">{contracts.length} hồ sơ phù hợp với bộ lọc hiện tại</p>
          </div>
        </div>

        {isLoading ? (
          <div className={cn('grid gap-4 p-5 sm:p-6', viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[24px] border border-slate-100 bg-slate-50" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="rounded-3xl bg-slate-100 p-4 text-slate-400">
              <CalendarClock size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Không có hợp đồng phù hợp</h3>
            <p className="max-w-md text-sm text-slate-500">
              Hãy đổi bộ lọc hoặc tạo hợp đồng mới nếu bạn đang chuẩn bị tiếp nhận người thuê cho một phòng trống.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {contracts.map((contract) => {
              const remaining = getRemainingDays(contract.endDate);

              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => navigate(`${ROUTES.OWNER.CONTRACTS}/${contract.id}`)}
                  className="flex h-full flex-col gap-4 rounded-[28px] border border-slate-200 p-5 text-left transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-slate-950">{contract.tenantName || 'Chưa có người đứng tên'}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {contract.contractCode} • {contract.roomCode}
                      </p>
                    </div>
                    <ContractStatusBadge status={contract.status} />
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Vị trí</p>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{contract.buildingName}</p>
                  </div>

                  <div className="grid gap-3">
                    <ContractPriceDisplay amount={contract.rentPriceSnapshot} label="Giá thuê đang áp dụng" size="lg" />
                    <ContractDateRange startDate={contract.startDate} endDate={contract.endDate} compact showDuration />
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        remaining.tone === 'rose' && 'bg-rose-50 text-rose-700',
                        remaining.tone === 'amber' && 'bg-amber-50 text-amber-700',
                        remaining.tone === 'slate' && 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {remaining.label}
                    </span>
                    <ArrowRight size={18} className="text-slate-300" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <div className="hidden grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] gap-4 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 lg:grid">
              <span>Hồ sơ</span>
              <span>Phòng / tòa nhà</span>
              <span>Trạng thái</span>
              <span className="text-right">Giá thuê</span>
              <span className="text-right">Thời hạn</span>
            </div>

            {contracts.map((contract) => {
              const remaining = getRemainingDays(contract.endDate);

              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => navigate(`${ROUTES.OWNER.CONTRACTS}/${contract.id}`)}
                  className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-950">{contract.tenantName || 'Chưa có người đứng tên'}</p>
                    <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{contract.contractCode}</span>
                      <span>•</span>
                      <span>{getContractStatusLabel(contract.status)}</span>
                      <span>•</span>
                      <span>{contract.occupantCount ?? 0} người ở</span>
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{contract.roomCode}</p>
                    <p className="truncate text-xs text-slate-500">{contract.buildingName}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <ContractStatusBadge status={contract.status} />
                  </div>

                  <ContractPriceDisplay
                    amount={contract.rentPriceSnapshot}
                    label="Giá thuê"
                    sublabel={`Chu kỳ ${contract.paymentCycle} tháng`}
                    align="right"
                    className="lg:justify-self-end"
                  />

                  <div className="lg:justify-self-end">
                    <ContractDateRange startDate={contract.startDate} endDate={contract.endDate} compact className="items-end text-right" />
                    <p className="mt-2 text-xs font-medium text-slate-500 lg:text-right">{remaining.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'sky' | 'amber' | 'rose';
}) {
  const toneClasses = {
    slate: 'bg-slate-100 text-slate-900',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <div className={cn('rounded-2xl p-3', toneClasses[tone])}>
          <FileText size={18} />
        </div>
      </div>
    </div>
  );
}
