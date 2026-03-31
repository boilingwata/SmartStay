import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Filter, Plus, 
  MoreVertical, Edit, Trash2, 
  Zap, Layout, Printer, Download,
  Home, Building2, ShieldCheck, Star,
  ChevronDown, X, SlidersHorizontal, ArrowUpDown,
  History, Calendar, DollarSign, Info, Activity
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/assetService';
import { Asset, AssetType, AssetCondition } from '@/models/Asset';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { AssetModal } from './AssetModal';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const AssetList = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // Filter States
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: 'All' as AssetType | 'All',
    status: 'All' as AssetCondition | 'All',
    minPrice: '',
    maxPrice: '',
    startDate: '',
    endDate: '',
    sortBy: 'id',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets', search, filters],
    queryFn: () => assetService.getAssets({ 
      search, 
      type: filters.type === 'All' ? null : filters.type,
      status: filters.status === 'All' ? null : filters.status,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })
  });

  const stats = useMemo(() => {
    if (!assets) return { totalValue: 0, maintenanceCount: 0, poorCount: 0 };
    return {
      totalValue: assets.reduce((sum, a) => sum + (a.purchasePrice || 0) * (a.quantity || 1), 0),
      maintenanceCount: assets.filter(a => a.condition === 'Fair').length,
      poorCount: assets.filter(a => a.condition === 'Poor').length
    };
  }, [assets]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Đã xóa tài sản thành công');
    }
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      if (selectedAsset) return assetService.updateAsset(selectedAsset.id, data);
      return assetService.createAsset(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(selectedAsset ? 'Cập nhật tài sản thành công!' : 'Đã thêm tài sản mới thành công!');
      setIsModalOpen(false);
    }
  });

  const renderStars = (condition: string) => {
    const score = condition === 'New' ? 5 : condition === 'Good' ? 4 : condition === 'Fair' ? 3 : 2;
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={10} 
        className={cn(
          "fill-current",
          i < score ? "text-warning" : "text-bg"
        )} 
      />
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-primary leading-tight">Danh mục Tài sản</h1>
          <p className="text-body text-muted font-medium italic">Quản lý chuyên sâu trang thiết bị, nội thất và lịch trình bảo trì.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-outline h-11 px-6 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[11px] hover:bg-white"><Printer size={18} /> In danh sách</button>
           <button 
             onClick={() => { setSelectedAsset(null); setIsModalOpen(true); }}
             className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px]"
           >
              <Plus size={18} /> Thêm tài sản mới
           </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-3">
         <button 
           onClick={() => setFilters(prev => ({ ...prev, status: 'All', type: 'All' }))}
           className={cn(
             "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
             filters.status === 'All' && filters.type === 'All' 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
              : "bg-white/50 text-muted border-transparent hover:bg-white hover:border-primary/20"
           )}
         >
           Tất cả tài sản
         </button>
         <button 
           onClick={() => setFilters(prev => ({ ...prev, status: 'New' }))}
           className={cn(
             "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
             filters.status === 'New' 
              ? "bg-success text-white border-success shadow-lg shadow-success/20" 
              : "bg-white/50 text-muted border-transparent hover:bg-white hover:border-success/20"
           )}
         >
           ✨ Mới (Brand New)
         </button>
         <button 
           onClick={() => setFilters(prev => ({ ...prev, status: 'Poor' }))}
           className={cn(
             "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
             filters.status === 'Poor' 
              ? "bg-danger text-white border-danger shadow-lg shadow-danger/20" 
              : "bg-white/50 text-muted border-transparent hover:bg-white hover:border-danger/20"
           )}
         >
           🛠️ Cần thanh lý/sửa
         </button>
         <button 
           onClick={() => setFilters(prev => ({ ...prev, type: 'Appliance' }))}
           className={cn(
             "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
             filters.type === 'Appliance' 
              ? "bg-warning text-white border-warning shadow-lg shadow-warning/20" 
              : "bg-white/50 text-muted border-transparent hover:bg-white hover:border-warning/20"
           )}
         >
           ⚡ Thiết bị điện
         </button>
      </div>

      <div className="card-container p-4 lg:p-6 bg-white/60 backdrop-blur-md space-y-6 shadow-2xl shadow-primary/5 border-none">
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4 flex-1">
               <div className="relative group flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Tìm tên, thương hiệu, serial hoặc phòng..."
                    className="input-base w-full pl-12 h-12 bg-white/50 focus:bg-white font-bold"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button 
                      onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-danger px-1"
                    >
                      <X size={14} />
                    </button>
                  )}
               </div>

               <div className="flex items-center gap-3">
                  <select
                    className="input-base h-12 w-48 font-bold border-2 border-transparent focus:border-primary/20"
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as AssetType }))}
                  >
                    <option value="All">Phân loại</option>
                    <option value="Furniture">Nội thất</option>
                    <option value="Appliance">Gia dụng</option>
                    <option value="Electronics">Điện tử</option>
                    <option value="Fixture">Cố định</option>
                    <option value="Other">Khác</option>
                  </select>

                  <select
                    className="input-base h-12 w-44 font-bold border-2 border-transparent focus:border-primary/20"
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order as any }));
                    }}
                  >
                    <option value="id-desc">Mới nhất</option>
                    <option value="purchasePrice-desc">Giá trị cao nhất</option>
                    <option value="purchasePrice-asc">Giá trị thấp nhất</option>
                    <option value="assetName-asc">Tên A-Z</option>
                  </select>

                  <button 
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className={cn(
                      "h-12 px-6 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all relative border-2",
                      isAdvancedOpen || activeFilterCount > 0
                        ? "bg-primary/10 text-primary border-primary/20 shadow-lg shadow-primary/5"
                        : "bg-white/50 text-muted border-transparent hover:bg-white"
                    )}
                  >
                    <SlidersHorizontal size={16} />
                    <span>Bộ lọc nâng cao</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] shadow-lg border-2 border-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
               </div>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-muted font-black uppercase tracking-widest text-[10px] shrink-0">
               <span className="flex items-center gap-2 bg-bg px-4 py-2 rounded-xl">
                 <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div> 
                 Hiển thị: <span className="text-primary">{assets?.length || 0}</span>
               </span>
            </div>
         </div>

         {/* Advanced Filter Panel */}
         <AnimatePresence>
           {isAdvancedOpen && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="overflow-hidden"
             >
                <div className="pt-6 border-t border-dashed border-border/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {/* Status Filter */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={12} /> Tình trạng</label>
                      <select
                        className="input-base h-11 w-full font-bold bg-white/50"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                      >
                        <option value="All">Tất cả tình trạng</option>
                        <option value="New">Mới (New)</option>
                        <option value="Good">Tốt (Good)</option>
                        <option value="Fair">Trung bình (Fair)</option>
                        <option value="Poor">Kém/Hỏng (Poor)</option>
                      </select>
                   </div>

                   {/* Price Range */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><DollarSign size={12} /> Khoảng giá (VND)</label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           placeholder="Từ..."
                           className="input-base h-11 w-full font-bold bg-white/50 text-[13px]"
                           value={filters.minPrice}
                           onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                         />
                         <span className="text-muted text-lg">-</span>
                         <input 
                           type="number" 
                           placeholder="Đến..."
                           className="input-base h-11 w-full font-bold bg-white/50 text-[13px]"
                           value={filters.maxPrice}
                           onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                         />
                      </div>
                   </div>

                   {/* Date Range */}
                   <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Ngày mua hàng</label>
                      <div className="flex items-center gap-2">
                         <input 
                           type="date" 
                           className="input-base h-11 w-full font-bold bg-white/50 text-[12px]"
                           value={filters.startDate}
                           onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                         />
                         <input 
                           type="date" 
                           className="input-base h-11 w-full font-bold bg-white/50 text-[12px]"
                           value={filters.endDate}
                           onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                         />
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex items-end gap-3 justify-end">
                      <button 
                        onClick={() => {
                          setFilters({
                            type: 'All',
                            status: 'All',
                            minPrice: '',
                            maxPrice: '',
                            startDate: '',
                            endDate: '',
                            sortBy: 'id',
                            sortOrder: 'desc'
                          });
                          setSearch('');
                        }}
                        className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted border-2 border-border/10 hover:bg-white hover:text-danger transition-all"
                      >
                        Đặt lại
                      </button>
                      <button 
                        onClick={() => setIsAdvancedOpen(false)}
                        className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all shadow-lg"
                      >
                        Áp dụng
                      </button>
                   </div>
                </div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center">
           <Spinner />
        </div>
      ) : (
         <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5 bg-white/40">
           <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px] shadow-sm">
               <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px]">
                     <th className="px-6 py-6 w-[25%] tracking-[4px]">Thông tin Tài sản</th>
                     <th className="px-5 py-6 border-l border-white/5 w-[10%] text-center">Vị trí</th>
                     <th className="px-5 py-6 border-l border-white/5 w-[10%] text-center tracking-[1px]">Tình trạng</th>
                     <th className="px-6 py-6 border-l border-white/5 w-[18%]">Thông tin kỹ thuật</th>
                     <th className="px-6 py-6 border-l border-white/5 w-[15%] text-right font-black">Giá trị & SL</th>
                     <th className="px-6 py-6 border-l border-white/5 w-[12%] text-center">Bảo trì</th>
                     <th className="px-6 py-6 border-l border-white/5 w-[10%] text-center tracking-[2px]">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border/10">
                  {assets?.map((asset) => (
                       <tr key={asset.id} className="group hover:bg-white/80 transition-all border-b border-border/5">
                          {/* Asset Info */}
                          <td className="px-6 py-6 align-middle overflow-hidden">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 shrink-0 bg-bg rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform group-hover:bg-primary/5 shadow-inner">
                                   {asset.type === 'Appliance' ? <Zap size={20} /> : <Package size={20} />}
                                </div>
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                   <p className="text-[13px] font-black text-primary uppercase tracking-tight leading-tight truncate" title={asset.assetName}>{asset.assetName}</p>
                                   <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-bg rounded text-[8.5px] font-black uppercase text-muted tracking-widest border border-border/10 shrink-0">
                                        {t(`assetType.${asset.type}`, asset.type)}
                                      </span>
                                      <span className="text-[9px] font-mono text-muted/50 font-medium truncate shrink-0">{asset.assetCode}</span>
                                   </div>
                                </div>
                             </div>
                          </td>

                          {/* Location */}
                          <td className="px-5 py-6 align-middle text-center">
                             <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5 text-[12px] font-black text-primary uppercase whitespace-nowrap">
                                  <Home size={13} className="text-primary/40" /> {asset.roomCode}
                                </div>
                                <div className="flex items-center justify-center gap-1 text-[8.5px] text-muted font-bold tracking-widest uppercase italic truncate w-full">
                                  <Building2 size={11} className="text-muted/40" /> {asset.buildingName || 'N/A'}
                                </div>
                             </div>
                          </td>

                          {/* Condition & Stars */}
                          <td className="px-5 py-6 align-middle text-center">
                             <div className="flex flex-col items-center gap-1.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm whitespace-nowrap",
                                  asset.condition === 'New' ? "bg-success text-white" : 
                                  asset.condition === 'Poor' ? "bg-danger text-white" : "bg-warning/20 text-warning border border-warning/20"
                                )}>{t(`assetCondition.${asset.condition}`, asset.condition)}</span>
                                <div className="flex gap-0.5 items-center justify-center scale-75">{renderStars(asset.condition)}</div>
                             </div>
                          </td>

                          {/* Technical Info */}
                          <td className="px-6 py-6 align-middle overflow-hidden">
                             <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-primary/70 uppercase truncate" title={asset.brand || 'No Brand'}>
                                  <div className="w-1 h-3 bg-primary/20 rounded-full"></div>
                                  {asset.brand || 'No Brand'}
                                </div>
                                <div className="inline-flex text-[9px] font-mono font-medium text-muted/60 bg-bg px-2 py-0.5 rounded-lg border border-border/10 truncate whitespace-nowrap w-fit">
                                  SN: {asset.serialNumber || 'N/A'}
                                </div>
                             </div>
                          </td>

                          {/* Price & Quantity */}
                          <td className="px-6 py-6 align-middle text-right">
                             <div className="flex flex-col gap-1">
                                <span className="text-[15px] font-black text-[#00a86b] font-mono whitespace-nowrap">{formatVND(asset.purchasePrice || 0)}</span>
                                <div className="flex items-center justify-end gap-1.5">
                                   <span className="text-[8.5px] text-muted font-black uppercase tracking-[1.5px] whitespace-nowrap uppercase">Số lượng: {asset.quantity}</span>
                                </div>
                             </div>
                          </td>

                          {/* Maintenance & Warranty */}
                          <td className="px-6 py-6 align-middle text-center">
                             <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-muted uppercase whitespace-nowrap">
                                  <Activity size={12} className="text-muted/30" /> {asset.lastMaintenance ? formatDate(asset.lastMaintenance) : 'Chưa bảo trì'}
                                </div>
                                <span className="text-[8.5px] text-muted/40 font-bold uppercase tracking-widest whitespace-nowrap px-1.5 py-0.5 border border-muted/5 rounded bg-bg">WRT: {asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : '-'}</span>
                             </div>
                          </td>

                          {/* ACTIONS */}
                          <td className="px-6 py-6 align-middle text-center">
                             <div className="flex items-center justify-center gap-2">
                                <button 
                                  onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }}
                                  className="w-8 h-8 bg-bg text-muted hover:bg-black/5 hover:text-primary rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90 border border-transparent hover:border-black/10"
                                  title="Xem"
                                >
                                   <Info size={14} />
                                </button>
                                <button 
                                  onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }}
                                  className="w-8 h-8 bg-bg text-muted hover:bg-primary/10 hover:text-primary rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90 border border-transparent hover:border-primary/10"
                                  title="Sửa"
                                >
                                   <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc muốn xóa tài sản ${asset.assetName}?`)) {
                                      deleteMutation.mutate(asset.id);
                                    }
                                  }}
                                  className="w-8 h-8 bg-bg text-muted hover:bg-danger/10 hover:text-danger rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90 disabled:opacity-50 border border-transparent hover:border-danger/10"
                                  title="Xóa"
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

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Tổng giá trị (VND)', value: formatVND(stats.totalValue), icon: DollarSign, color: 'primary' },
           { label: 'Cần bảo dưỡng', value: `${stats.maintenanceCount} thiết bị`, icon: History, color: 'warning' },
           { label: 'Cần thanh lý/sửa', value: `${stats.poorCount} thiết bị`, icon: Trash2, color: 'danger' },
         ].map((stat, i) => (
           <div key={i} className="card-container p-8 flex items-center gap-6 bg-white/60 border-none shadow-xl shadow-primary/5">
              <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg",
                stat.color === 'primary' ? "bg-primary text-white" : 
                stat.color === 'warning' ? "bg-warning text-white" : "bg-danger text-white"
              )}>
                 <stat.icon size={28} />
              </div>
              <div>
                 <p className="text-[10px] text-muted font-black uppercase tracking-[3px] mb-1">{stat.label}</p>
                 <p className="text-[20px] font-black text-primary font-mono">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      <AssetModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedAsset}
        onSubmit={(data) => submitMutation.mutate(data)}
        onDelete={(id) => deleteMutation.mutate(id)}
        isSubmitting={submitMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
};

export default AssetList;
