import React, { useState } from 'react';
import { 
  Package, Search, Filter, Plus, 
  MoreVertical, Edit, Trash2, 
  Zap, Layout, Printer, Download,
  Home, Building2, ShieldCheck, Star
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/assetService';
import { Asset } from '@/models/Asset';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { AssetModal } from './AssetModal';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const AssetList = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { data: assets, isLoading } = useQuery<Asset[]>({
    queryKey: ['assets', search, typeFilter],
    queryFn: () => assetService.getAssets({ search, type: typeFilter })
  });

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
        size={12} 
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
          <p className="text-body text-muted font-medium italic">Quản lý toàn bộ trang thiết bị, nội thất và tình trạng khấu hao.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-outline h-11 px-6 rounded-xl flex items-center gap-2 font-black uppercase tracking-widest text-[11px]"><Printer size={18} /> In danh sách</button>
           <button 
             onClick={() => { setSelectedAsset(null); setIsModalOpen(true); }}
             className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[11px]"
           >
              <Plus size={18} /> Thêm tài sản mới
           </button>
        </div>
      </div>

      <div className="card-container p-8 bg-white/60 backdrop-blur-md space-y-6 shadow-2xl shadow-primary/5 border-none">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
               <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
                 <input
                   type="text"
                   placeholder="Tìm tên hoặc mã tài sản..."
                   className="input-base w-80 pl-12 h-12 bg-white/50 focus:bg-white font-bold"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
               </div>

               <select
                 className="input-base h-12 w-48 font-bold"
                 value={typeFilter}
                 onChange={(e) => setTypeFilter(e.target.value)}
               >
                 <option value="">Tất cả loại tài sản</option>
                 <option value="Furniture">Nội thất</option>
                 <option value="Appliance">Gia dụng</option>
                 <option value="Electronics">Điện tử</option>
                 <option value="Fixture">Cố định</option>
                 <option value="Other">Khác</option>
               </select>
            </div>

            <div className="flex items-center gap-4 text-muted font-black uppercase tracking-widest text-[10px]">
               <span className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded-full"></div> Tổng số: {assets?.length || 0}</span>
               <span className="flex items-center gap-2"><div className="w-3 h-3 bg-warning rounded-full"></div> Cần bảo trì: 0</span>
            </div>
         </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center">
           <Spinner />
        </div>
      ) : (
        <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5 bg-white/40">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px]">
                       <th className="px-8 py-6">Tài sản (Asset)</th>
                       <th className="px-6 py-6 border-l border-white/5">Loại</th>
                       <th className="px-6 py-6 border-l border-white/5">Phòng / Toà nhà</th>
                       <th className="px-6 py-6 border-l border-white/5">Tình trạng</th>
                       <th className="px-6 py-6 border-l border-white/5 text-right">Giá trị gốc</th>
                       <th className="px-6 py-6 border-l border-white/5">Ngày gán</th>
                       <th className="px-8 py-6 border-l border-white/5 text-right">Thao tác</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/10">
                    {assets?.map((asset) => (
                      <tr key={asset.id} className="group hover:bg-white/80 transition-all">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-bg rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                  {asset.type === 'Appliance' ? <Zap size={22} /> : <Package size={22} />}
                               </div>
                               <div>
                                  <p className="text-[15px] font-black text-primary uppercase tracking-tighter">{asset.assetName}</p>
                                  <p className="text-[10px] font-mono text-muted font-bold tracking-widest">{asset.assetCode}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <span className="px-3 py-1 bg-bg rounded-lg border border-border/10 text-[10px] font-black uppercase tracking-widest text-muted">{t(`assetType.${asset.type}`, asset.type)}</span>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex flex-col">
                               <span className="text-[13px] font-black text-primary flex items-center gap-1.5"><Home size={12} /> {asset.roomCode}</span>
                               <span className="text-[10px] text-muted italic flex items-center gap-1.5"><Building2 size={10} /> Keangnam</span>
                            </div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                               <span className={cn(
                                 "w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                 asset.condition === 'New' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                               )}>{t(`assetCondition.${asset.condition}`, asset.condition)}</span>
                               <div className="flex gap-0.5">{renderStars(asset.condition)}</div>
                            </div>
                         </td>
                         <td className="px-6 py-6 text-right">
                             <span className="text-[14px] font-black text-secondary font-mono">{formatVND(asset.purchasePrice || 0)}</span>
                         </td>
                         <td className="px-6 py-6 text-[12px] font-bold text-muted font-mono">{asset.purchaseDate ? formatDate(asset.purchaseDate) : '-'}</td>
                         <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }}
                                className="w-10 h-10 bg-bg text-muted hover:bg-primary/10 hover:text-primary rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                                title="Sửa thông tin"
                              >
                                 <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa tài sản ${asset.assetName}?`)) {
                                    deleteMutation.mutate(asset.id);
                                  }
                                }}
                                className="w-10 h-10 bg-bg text-muted hover:bg-danger/10 hover:text-danger rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90 disabled:opacity-50"
                                title="Xóa tài sản"
                                disabled={deleteMutation.isPending}
                              >
                                 <Trash2 size={16} />
                              </button>
                              <button 
                                className="w-10 h-10 bg-bg text-muted hover:bg-white rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                                title="Thêm..."
                              >
                                 <MoreVertical size={16} />
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
           { label: 'Tổng giá trị tài sản', value: formatVND(40500000), icon: ShieldCheck, color: 'primary' },
           { label: 'Thiết bị bảo hành', value: '12 máy', icon: Zap, color: 'warning' },
           { label: 'Yêu cầu thanh lý', value: '2 món', icon: Trash2, color: 'danger' },
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
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
};

export default AssetList;
