import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  Download,
  FileText,
  Filter,
  History,
  LayoutGrid,
  List,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { AddendumStatusBadge } from '@/components/contracts/AddendumStatusBadge';
import { ADDENDUM_TYPE_OPTIONS, getContractAddendumSourceLabel, getContractAddendumTypeLabel } from '@/lib/contractPresentation';
import portalAddendumService from '@/services/portalAddendumService';
import { cn, formatDate } from '@/utils';

export default function AddendumListPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const { data: addendums = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['contract-addendums-admin'],
    queryFn: () => portalAddendumService.listAdminAddendums(),
  });

  const filteredAddendums = useMemo(() => {
    return addendums.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.addendumCode.toLowerCase().includes(query) ||
        item.contractCode.toLowerCase().includes(query) ||
        item.tenantName?.toLowerCase().includes(query) ||
        item.roomCode.toLowerCase().includes(query) ||
        item.buildingName.toLowerCase().includes(query);

      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [addendums, search, typeFilter]);

  const stats = useMemo(() => {
    const recent = addendums.filter((item) => {
      const createdAt = new Date(item.createdAt || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt > weekAgo;
    }).length;

    return {
      total: addendums.length,
      signed: addendums.filter((item) => item.status === 'Signed').length,
      recent,
      rentChanges: addendums.filter((item) => item.type === 'RentChange').length,
    };
  }, [addendums]);

  const summaryCards = [
    { label: 'Tổng phụ lục', value: stats.total },
    { label: 'Đã ký', value: stats.signed },
    { label: 'Mới trong 7 ngày', value: stats.recent },
    { label: 'Điều chỉnh giá thuê', value: stats.rentChanges },
  ] as const;

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-24">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              <History size={14} />
              Theo dõi phụ lục
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Phụ lục hợp đồng</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Tất cả thay đổi của hợp đồng được gom tại đây theo đúng mã phụ lục, hợp đồng gốc, loại thay đổi, ngày hiệu lực và tình trạng ký để bạn đối chiếu nhanh.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toast.info('Phụ lục được tạo từ màn chi tiết hợp đồng khi có thay đổi về giá, dịch vụ, phòng hoặc điều kiện áp dụng.')}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <FileText size={16} />
            Cách tạo phụ lục
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã phụ lục, mã hợp đồng, người thuê, phòng hoặc tòa nhà"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-12 min-w-[240px] rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                <option value="All">Tất cả loại phụ lục</option>
                {ADDENDUM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => setViewMode('list')} className={cn('rounded-xl p-2 transition', viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400')}>
                <List size={16} />
              </button>
              <button type="button" onClick={() => setViewMode('grid')} className={cn('rounded-xl p-2 transition', viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400')}>
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
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-950">Danh sách phụ lục</h2>
            <p className="text-sm text-slate-500">{filteredAddendums.length} bản ghi phù hợp với bộ lọc hiện tại</p>
          </div>
        </div>

        {isLoading ? (
          <div className={cn('grid gap-4 p-5 sm:p-6', viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[24px] border border-slate-100 bg-slate-50" />
            ))}
          </div>
        ) : filteredAddendums.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="rounded-3xl bg-slate-100 p-4 text-slate-400">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Không tìm thấy phụ lục phù hợp</h3>
            <p className="max-w-md text-sm text-slate-500">Hãy đổi từ khóa hoặc bộ lọc loại phụ lục để xem lại lịch sử thay đổi của hợp đồng.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {filteredAddendums.map((addendum) => (
              <article key={addendum.id} className="flex h-full flex-col gap-5 rounded-[28px] border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold text-slate-950">{addendum.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {addendum.addendumCode} • {addendum.contractCode}
                    </p>
                  </div>
                  <AddendumStatusBadge status={addendum.status} />
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Loại thay đổi</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{getContractAddendumTypeLabel(addendum.type)}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Hiệu lực</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(addendum.effectiveDate)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Nguồn tạo</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{getContractAddendumSourceLabel(addendum.sourceType)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{addendum.roomCode || 'Áp dụng toàn bộ hợp đồng'}</p>
                    <p className="truncate text-xs text-slate-500">{addendum.buildingName}</p>
                  </div>
                  {addendum.fileUrl ? (
                    <a href={addendum.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                      <Download size={16} />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAddendums.map((addendum) => (
              <article key={addendum.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-950">{addendum.title}</p>
                    <AddendumStatusBadge status={addendum.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {addendum.addendumCode} • {addendum.contractCode} • phiên bản {addendum.versionNo}
                  </p>
                  {addendum.content ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{addendum.content}</p> : null}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">{getContractAddendumTypeLabel(addendum.type)}</p>
                  <p className="mt-1 text-xs text-slate-500">{getContractAddendumSourceLabel(addendum.sourceType)}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatDate(addendum.effectiveDate)}</p>
                  <p className="mt-1 text-xs text-slate-500">{addendum.createdAt ? `Tạo lúc ${formatDate(addendum.createdAt)}` : 'Chưa có ngày tạo'}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">{addendum.roomCode || 'Áp dụng toàn bộ hợp đồng'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {addendum.buildingName}
                    {addendum.tenantName ? ` • ${addendum.tenantName}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 justify-self-start lg:justify-self-end">
                  {addendum.type === 'RoomChange' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      <ArrowRightLeft size={12} />
                      Chuyển phòng
                    </span>
                  ) : null}
                  {addendum.fileUrl ? (
                    <a href={addendum.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
                      <Download size={16} />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
