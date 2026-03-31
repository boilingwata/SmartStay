import React, { useState } from 'react';
import { X, Search, Package, Check, Zap, Layout, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetService } from '@/services/assetService';
import { Asset, AssetType } from '@/models/Asset';
import { cn, formatDate } from '@/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | number;
}

export const AssignAssetModal = ({ isOpen, onClose, roomId }: AssignAssetModalProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<AssetType | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: unassignedAssets, isLoading } = useQuery({
    queryKey: ['unassigned-assets', search, selectedType],
    queryFn: () => assetService.getAssets({
      unassignedOnly: true,
      search,
      type: selectedType === 'All' ? undefined : selectedType
    }),
    enabled: isOpen
  });

  const assignMutation = useMutation({
    mutationFn: (ids: string[]) => assetService.assignAssetsToRoom(ids, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', String(roomId)] });
      toast.success(`Đã gán ${selectedIds.length} tài sản vào phòng`);
      onClose();
      setSelectedIds([]);
    },
    onError: (err: Error) => {
      toast.error(`Lỗi: ${err.message}`);
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (!unassignedAssets) return;
    if (selectedIds.length === unassignedAssets.length && selectedIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unassignedAssets.map(a => a.id));
    }
  };

  if (!isOpen) return null;

  const assetTypes: (AssetType | 'All')[] = ['All', 'Furniture', 'Appliance', 'Electronics', 'Fixture', 'Other'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-8 border-b bg-slate-900 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Package size={24} /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Gán tài sản vào phòng</h2>
                <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest">Danh sách tài sản đang trống trong kho</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all text-white"><X size={24} /></button>
          </div>

          {/* Filters Bar */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Tìm kiếm theo tên, mã tài sản, serial..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-inner-sm"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {assetTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    selectedType === type 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white text-slate-500 border border-slate-200 hover:border-primary/30"
                  )}
                >
                  {type === 'All' ? 'Tất cả' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đang tải tài sản...</p>
              </div>
            ) : unassignedAssets?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-300 shadow-inner">
                  <Package size={40} />
                </div>
                <p className="text-[13px] font-bold text-slate-400 italic">Không tìm thấy tài sản nào phù hợp trong kho.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6 px-2">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tìm thấy {unassignedAssets?.length} tài sản</p>
                  <button 
                    onClick={toggleSelectAll}
                    type="button"
                    className="text-[11px] font-black text-primary uppercase tracking-[2px] hover:underline"
                  >
                    {selectedIds.length === unassignedAssets?.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {unassignedAssets?.map((asset, index) => (
                    <motion.div 
                      key={asset.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleSelect(asset.id)}
                      className={cn(
                        "p-6 rounded-[32px] border-2 transition-all cursor-pointer group flex items-center gap-5 bg-white relative overflow-hidden",
                        selectedIds.includes(asset.id)
                          ? "border-primary shadow-xl shadow-primary/5"
                          : "border-transparent hover:border-primary/20 shadow-sm hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 z-10",
                        selectedIds.includes(asset.id) ? "bg-primary border-primary text-white" : "border-slate-200"
                      )}>
                        {selectedIds.includes(asset.id) && <Check size={16} />}
                      </div>
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-inner bg-slate-50 flex-shrink-0 group-hover:scale-110",
                        selectedIds.includes(asset.id) ? "text-primary" : "text-slate-400"
                      )}>
                         {asset.type === 'Appliance' ? <Zap size={28} /> : <Layout size={28} />}
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={cn(
                          "text-[16px] font-black truncate uppercase tracking-tighter transition-colors",
                          selectedIds.includes(asset.id) ? "text-primary" : "text-slate-900"
                        )}>{asset.assetName}</p>
                        <p className="text-[10px] font-mono text-slate-400 font-black truncate tracking-widest mt-0.5">#{asset.assetCode}</p>
                        <div className="flex items-center gap-3 mt-3">
                           <span className="px-2.5 py-1 bg-slate-100 text-[9px] font-black text-slate-500 rounded-lg uppercase tracking-widest border border-slate-200/50">{asset.type}</span>
                           {asset.serialNumber && (
                             <span className="text-[9px] font-black text-slate-400 uppercase truncate">SN: {asset.serialNumber}</span>
                           )}
                        </div>
                      </div>

                      {/* Glassmorphism accent for selected state */}
                      {selectedIds.includes(asset.id) && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-10 border-t bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
               <p className="text-[18px] font-black text-white uppercase tracking-tighter">Đang chọn {selectedIds.length} tài sản</p>
               <p className="text-[10px] text-white/40 italic font-medium tracking-widest uppercase mt-1">Dữ liệu sẽ được cập nhật ngay vào: <span className="text-white font-black">{roomId}</span></p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
               <button 
                onClick={onClose}
                className="flex-1 md:flex-none px-10 py-4 bg-white/5 border border-white/10 text-white/60 font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all active:scale-95"
               >
                 Huỷ
               </button>
               <button 
                disabled={selectedIds.length === 0 || assignMutation.isPending}
                onClick={() => assignMutation.mutate(selectedIds)}
                className="flex-1 md:flex-none px-12 py-4 bg-primary text-white font-black uppercase tracking-[3px] rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-3"
               >
                 {assignMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Package size={20} />}
                 Xác nhận gán
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
