import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Building2, Calendar, DollarSign, Edit, History, Home, Package, Plus, Search, ShieldCheck, SlidersHorizontal, Star, Trash2, X, Zap, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import useUIStore from '@/stores/uiStore';
import { Asset, AssetCondition, AssetType } from '@/models/Asset';
import { AssetModal } from './AssetModal';
import { Spinner } from '@/components/ui/Feedback';
import { assetService } from '@/services/assetService';
import { cn, formatDate, formatVND } from '@/utils';

const AssetCatalog = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((state) => state.activeBuildingId);

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: 'All' as AssetType | 'All',
    status: 'All' as AssetCondition | 'All',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== 'All') count++;
    if (filters.status !== 'All') count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets', activeBuildingId, search, filters],
    queryFn: () =>
      assetService.getAssets({
        buildingId: activeBuildingId,
        search,
        type: filters.type === 'All' ? null : filters.type,
        status: filters.status === 'All' ? null : filters.status,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
  });

  const stats = useMemo(() => {
    if (!assets) return { totalValue: 0, maintenanceCount: 0, poorCount: 0 };
    return {
      totalValue: assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0) * (asset.quantity || 1), 0),
      maintenanceCount: assets.filter((asset) => asset.condition === 'Fair').length,
      poorCount: assets.filter((asset) => asset.condition === 'Poor').length,
    };
  }, [assets]);

  const statCards: Array<{ label: string; value: string; icon: LucideIcon; color: 'primary' | 'warning' | 'danger' }> = [
    { label: 'Tong gia tri (VND)', value: formatVND(stats.totalValue), icon: DollarSign, color: 'primary' },
    { label: 'Can bao duong', value: `${stats.maintenanceCount} thiet bi`, icon: History, color: 'warning' },
    { label: 'Can xu ly', value: `${stats.poorCount} thiet bi`, icon: Trash2, color: 'danger' },
  ];

  const refreshRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    queryClient.invalidateQueries({ queryKey: ['room'] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      refreshRelatedQueries();
      toast.success('Da xoa tai san thanh cong');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: Parameters<typeof assetService.createAsset>[0]) => {
      if (selectedAsset) return assetService.updateAsset(selectedAsset.id, data);
      return assetService.createAsset(data);
    },
    onSuccess: () => {
      refreshRelatedQueries();
      toast.success(selectedAsset ? 'Cap nhat tai san thanh cong' : 'Da them tai san moi');
      setIsModalOpen(false);
      setSelectedAsset(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const renderStars = (condition: AssetCondition) => {
    const score = condition === 'New' ? 5 : condition === 'Good' ? 4 : condition === 'Fair' ? 3 : 2;
    return Array.from({ length: 5 }).map((_, index) => (
      <Star key={index} size={10} className={cn('fill-current', index < score ? 'text-warning' : 'text-bg')} />
    ));
  };

  const resetFilters = () => {
    setFilters({
      type: 'All',
      status: 'All',
      minPrice: '',
      maxPrice: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setSearch('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-display leading-tight text-primary">Danh muc Tai san</h1>
          <p className="text-body font-medium italic text-muted">
            Quan ly catalog tai san, trang thai gan phong va billing trong scope hien tai.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAsset(null);
            setIsModalOpen(true);
          }}
          className="btn-primary flex h-11 items-center gap-2 rounded-xl px-6 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> Them tai san moi
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFilters((prev) => ({ ...prev, status: 'All', type: 'All' }))}
          className={cn(
            'rounded-2xl border-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all',
            filters.status === 'All' && filters.type === 'All'
              ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
              : 'border-transparent bg-white/50 text-muted hover:bg-white hover:border-primary/20',
          )}
        >
          Tat ca tai san
        </button>
        <button
          onClick={() => setFilters((prev) => ({ ...prev, status: 'New' }))}
          className={cn(
            'rounded-2xl border-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all',
            filters.status === 'New'
              ? 'border-success bg-success text-white shadow-lg shadow-success/20'
              : 'border-transparent bg-white/50 text-muted hover:bg-white hover:border-success/20',
          )}
        >
          Moi
        </button>
        <button
          onClick={() => setFilters((prev) => ({ ...prev, status: 'Poor' }))}
          className={cn(
            'rounded-2xl border-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all',
            filters.status === 'Poor'
              ? 'border-danger bg-danger text-white shadow-lg shadow-danger/20'
              : 'border-transparent bg-white/50 text-muted hover:bg-white hover:border-danger/20',
          )}
        >
          Can xu ly
        </button>
        <button
          onClick={() => setFilters((prev) => ({ ...prev, type: 'Appliance' }))}
          className={cn(
            'rounded-2xl border-2 px-5 py-2 text-[11px] font-black uppercase tracking-widest transition-all',
            filters.type === 'Appliance'
              ? 'border-warning bg-warning text-white shadow-lg shadow-warning/20'
              : 'border-transparent bg-white/50 text-muted hover:bg-white hover:border-warning/20',
          )}
        >
          Thiet bi dien
        </button>
      </div>

      <div className="card-container space-y-6 border-none bg-white/60 p-4 shadow-2xl shadow-primary/5 backdrop-blur-md lg:p-6">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-4">
            <div className="relative min-w-[300px] flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" size={18} />
              <input
                type="text"
                placeholder="Tim ten, QR, serial hoac phong..."
                className="input-base h-12 w-full bg-white/50 pl-12 font-bold focus:bg-white"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search ? (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 px-1 text-muted hover:text-danger">
                  <X size={14} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <select
                className="input-base h-12 w-48 border-2 border-transparent font-bold focus:border-primary/20"
                value={filters.type}
                onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value as AssetType | 'All' }))}
              >
                <option value="All">Phan loai</option>
                <option value="Furniture">Noi that</option>
                <option value="Appliance">Gia dung</option>
                <option value="Electronics">Dien tu</option>
                <option value="Fixture">Co dinh</option>
                <option value="Other">Khac</option>
              </select>

              <select
                className="input-base h-12 w-44 border-2 border-transparent font-bold focus:border-primary/20"
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(event) => {
                  const [field, order] = event.target.value.split('-');
                  setFilters((prev) => ({ ...prev, sortBy: field, sortOrder: order as 'asc' | 'desc' }));
                }}
              >
                <option value="createdAt-desc">Moi nhat</option>
                <option value="purchasePrice-desc">Gia tri cao nhat</option>
                <option value="purchasePrice-asc">Gia tri thap nhat</option>
                <option value="assetName-asc">Ten A-Z</option>
              </select>

              <button
                onClick={() => setIsAdvancedOpen((current) => !current)}
                className={cn(
                  'relative flex h-12 items-center gap-2 rounded-xl border-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all',
                  isAdvancedOpen || activeFilterCount > 0
                    ? 'border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/5'
                    : 'border-transparent bg-white/50 text-muted hover:bg-white',
                )}
              >
                <SlidersHorizontal size={16} />
                <span>Bo loc nang cao</span>
                {activeFilterCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] text-white shadow-lg">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted lg:flex">
            <span className="flex items-center gap-2 rounded-xl bg-bg px-4 py-2">
              <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
              Hien thi: <span className="text-primary">{assets?.length || 0}</span>
            </span>
          </div>
        </div>

        <AnimatePresence>
          {isAdvancedOpen ? (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-1 gap-6 border-t border-dashed border-border/20 pt-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                    <ShieldCheck size={12} /> Tinh trang
                  </label>
                  <select
                    className="input-base h-11 w-full bg-white/50 font-bold"
                    value={filters.status}
                    onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as AssetCondition | 'All' }))}
                  >
                    <option value="All">Tat ca tinh trang</option>
                    <option value="New">Moi</option>
                    <option value="Good">Tot</option>
                    <option value="Fair">Trung binh</option>
                    <option value="Poor">Kem / Hong</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                    <DollarSign size={12} /> Khoang gia (VND)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Tu..."
                      className="input-base h-11 w-full bg-white/50 text-[13px] font-bold"
                      value={filters.minPrice}
                      onChange={(event) => setFilters((prev) => ({ ...prev, minPrice: event.target.value }))}
                    />
                    <span className="text-lg text-muted">-</span>
                    <input
                      type="number"
                      placeholder="Den..."
                      className="input-base h-11 w-full bg-white/50 text-[13px] font-bold"
                      value={filters.maxPrice}
                      onChange={(event) => setFilters((prev) => ({ ...prev, maxPrice: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                    <Calendar size={12} /> Ngay mua
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="input-base h-11 w-full bg-white/50 text-[12px] font-bold"
                      value={filters.startDate}
                      onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                    />
                    <input
                      type="date"
                      className="input-base h-11 w-full bg-white/50 text-[12px] font-bold"
                      value={filters.endDate}
                      onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-end justify-end gap-3">
                  <button
                    onClick={resetFilters}
                    className="h-11 rounded-xl border-2 border-border/10 px-6 text-[10px] font-black uppercase tracking-widest text-muted transition-all hover:bg-white hover:text-danger"
                  >
                    Dat lai
                  </button>
                  <button onClick={() => setIsAdvancedOpen(false)} className="h-11 rounded-xl bg-slate-900 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-black">
                    Ap dung
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Spinner />
        </div>
      ) : (
        <div className="card-container overflow-hidden border-none bg-white/40 p-0 shadow-2xl shadow-primary/5">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-[1000px] w-full table-fixed border-collapse text-left shadow-sm">
              <thead>
                <tr className="bg-slate-900 text-[10px] font-black uppercase tracking-[3px] text-white">
                  <th className="w-[25%] px-6 py-6 tracking-[4px]">Thong tin Tai san</th>
                  <th className="w-[10%] border-l border-white/5 px-5 py-6 text-center">Vi tri</th>
                  <th className="w-[10%] border-l border-white/5 px-5 py-6 text-center tracking-[1px]">Tinh trang</th>
                  <th className="w-[18%] border-l border-white/5 px-6 py-6">Thong tin ky thuat</th>
                  <th className="w-[15%] border-l border-white/5 px-6 py-6 text-right">Gia tri & SL</th>
                  <th className="w-[12%] border-l border-white/5 px-6 py-6 text-center">Bao tri</th>
                  <th className="w-[10%] border-l border-white/5 px-6 py-6 text-center tracking-[2px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {assets?.map((asset) => (
                  <tr key={asset.id} className="group border-b border-border/5 transition-all hover:bg-white/80">
                    <td className="overflow-hidden px-6 py-6 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg text-primary shadow-inner transition-transform group-hover:scale-110 group-hover:bg-primary/5">
                          {asset.type === 'Appliance' ? <Zap size={20} /> : <Package size={20} />}
                        </div>
                        <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden">
                          <p className="truncate text-[13px] font-black uppercase leading-tight tracking-tight text-primary" title={asset.assetName}>
                            {asset.assetName}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 rounded border border-border/10 bg-bg px-2 py-0.5 text-[8.5px] font-black uppercase tracking-widest text-muted">
                              {t(`assetType.${asset.type}`, asset.type)}
                            </span>
                            <span className="shrink-0 truncate text-[9px] font-mono font-medium text-muted/50">
                              {asset.assetCode || 'NO-QR'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-6 align-middle text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-black uppercase text-primary">
                          <Home size={13} className="text-primary/40" /> {asset.roomCode || 'Chua gan'}
                        </div>
                        <div className="flex w-full items-center justify-center gap-1 truncate text-[8.5px] font-bold uppercase tracking-widest text-muted italic">
                          <Building2 size={11} className="text-muted/40" /> {asset.buildingName || 'Catalog'}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-6 align-middle text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter shadow-sm whitespace-nowrap',
                            asset.condition === 'New'
                              ? 'bg-success text-white'
                              : asset.condition === 'Poor'
                                ? 'bg-danger text-white'
                                : 'border border-warning/20 bg-warning/20 text-warning',
                          )}
                        >
                          {t(`assetCondition.${asset.condition}`, asset.condition)}
                        </span>
                        <div className="flex scale-75 items-center justify-center gap-0.5">{renderStars(asset.condition)}</div>
                      </div>
                    </td>

                    <td className="overflow-hidden px-6 py-6 align-middle">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 truncate text-[10px] font-black uppercase text-primary/70" title={asset.brand || 'No Brand'}>
                          <div className="h-3 w-1 rounded-full bg-primary/20" />
                          {asset.brand || 'No Brand'}
                        </div>
                        <div className="inline-flex w-fit truncate whitespace-nowrap rounded-lg border border-border/10 bg-bg px-2 py-0.5 text-[9px] font-mono font-medium text-muted/60">
                          SN: {asset.serialNumber || 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 align-middle text-right">
                      <div className="flex flex-col gap-1">
                        <span className="whitespace-nowrap font-mono text-[15px] font-black text-[#00a86b]">{formatVND(asset.purchasePrice || 0)}</span>
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="whitespace-nowrap text-[8.5px] font-black uppercase tracking-[1.5px] text-muted">
                            So luong: {asset.quantity || 1}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-6 align-middle text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap text-[10px] font-black uppercase text-muted">
                          <Activity size={12} className="text-muted/30" />
                          {asset.lastMaintenance ? formatDate(asset.lastMaintenance) : 'Chua bao tri'}
                        </div>
                        <span className="whitespace-nowrap rounded border border-muted/5 bg-bg px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-widest text-muted/40">
                          WRT: {asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '-'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-6 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-bg text-muted shadow-sm transition-all hover:border-primary/10 hover:bg-primary/10 hover:text-primary active:scale-90"
                          title="Sua"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Ban co chac muon xoa tai san ${asset.assetName}?`)) {
                              deleteMutation.mutate(asset.id);
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-bg text-muted shadow-sm transition-all hover:border-danger/10 hover:bg-danger/10 hover:text-danger active:scale-90 disabled:opacity-50"
                          title="Xoa"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="card-container flex items-center gap-6 border-none bg-white/60 p-8 shadow-xl shadow-primary/5">
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-[24px] shadow-lg',
                stat.color === 'primary'
                  ? 'bg-primary text-white'
                  : stat.color === 'warning'
                    ? 'bg-warning text-white'
                    : 'bg-danger text-white',
              )}
            >
              <stat.icon size={28} />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[3px] text-muted">{stat.label}</p>
              <p className="font-mono text-[20px] font-black text-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <AssetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAsset(null);
        }}
        initialData={selectedAsset}
        onSubmit={(data) => submitMutation.mutate(data)}
        onDelete={(id) => deleteMutation.mutate(id)}
        isSubmitting={submitMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
};

export default AssetCatalog;
