import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Layout, Loader2, Package, Search, X, Zap } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssetType } from '@/models/Asset';
import { assetService } from '@/services/assetService';
import { getAssetTypeLabel } from '@/lib/propertyLabels';
import { cn } from '@/utils';
import { toast } from 'sonner';

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
  const [isBillable, setIsBillable] = useState(false);
  const [monthlyCharge, setMonthlyCharge] = useState('');
  const [billingLabel, setBillingLabel] = useState('');
  const [billingStartDate, setBillingStartDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: assignableAssets, isLoading } = useQuery({
    queryKey: ['assignable-assets', roomId, search, selectedType],
    queryFn: () =>
      assetService.getAssignableAssets({
        roomId,
        search,
        type: selectedType === 'All' ? undefined : selectedType,
      }),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (ids: string[]) =>
      assetService.assignAssetsToRoom(ids, roomId, {
        isBillable,
        monthlyCharge: isBillable ? Number(monthlyCharge || 0) : 0,
        billingLabel: billingLabel.trim() || undefined,
        billingStartDate,
        billingStatus: isBillable ? 'Active' : 'Inactive',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', String(roomId)] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`Đã gán ${selectedIds.length} tài sản vào phòng.`);
      setSelectedIds([]);
      setIsBillable(false);
      setMonthlyCharge('');
      setBillingLabel('');
      setBillingStartDate(new Date().toISOString().slice(0, 10));
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể gán tài sản vào phòng. Vui lòng thử lại.');
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSelectAll = () => {
    if (!assignableAssets) return;
    if (selectedIds.length === assignableAssets.length && selectedIds.length > 0) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(assignableAssets.map((asset) => asset.id));
  };

  if (!isOpen) return null;

  const assetTypes: Array<AssetType | 'All'> = ['All', 'Furniture', 'Appliance', 'Electronics', 'Fixture', 'Other'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative flex max-h-[90vh] w-full max-w-5xl min-w-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b bg-slate-900 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Package size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">Gán tài sản vào phòng</h2>
                <p className="text-xs font-medium text-white/60">
                  Chọn từ danh mục tài sản và gắn trực tiếp vào phòng đang xem.
                </p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-white transition-all hover:bg-white/10">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 border-b border-slate-100 bg-slate-50 p-6 md:flex-row">
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên, mã tài sản hoặc số sê-ri..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 font-bold text-slate-700 transition-all focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div className="scrollbar-hide flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
              {assetTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'whitespace-nowrap rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                    selectedType === type
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-primary/30',
                  )}
                >
                  {type === 'All' ? 'Tất cả' : getAssetTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/30 p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Đang tải tài sản...</p>
              </div>
            ) : assignableAssets?.length === 0 ? (
              <div className="space-y-4 py-20 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-slate-100 text-slate-300 shadow-inner">
                  <Package size={40} />
                </div>
                <p className="text-[13px] font-bold italic text-slate-400">Không còn tài sản phù hợp để gán cho phòng này.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between px-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tìm thấy {assignableAssets?.length} tài sản</p>
                  <button onClick={toggleSelectAll} type="button" className="text-[11px] font-black uppercase tracking-[2px] text-primary hover:underline">
                    {selectedIds.length === assignableAssets?.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {assignableAssets?.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleSelect(asset.id)}
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-[32px] border-2 bg-white p-6 transition-all',
                        selectedIds.includes(asset.id)
                          ? 'border-primary shadow-xl shadow-primary/5'
                          : 'border-transparent shadow-sm hover:border-primary/20 hover:shadow-md',
                      )}
                    >
                      <div
                        className={cn(
                          'z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all',
                          selectedIds.includes(asset.id) ? 'border-primary bg-primary text-white' : 'border-slate-200',
                        )}
                      >
                        {selectedIds.includes(asset.id) ? <Check size={16} /> : null}
                      </div>
                      <div
                        className={cn(
                          'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-inner transition-all group-hover:scale-110',
                          selectedIds.includes(asset.id) && 'text-primary',
                        )}
                      >
                        {asset.type === 'Appliance' ? <Zap size={28} /> : <Layout size={28} />}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p
                          className={cn(
                            'truncate text-[16px] font-black uppercase tracking-tighter transition-colors',
                            selectedIds.includes(asset.id) ? 'text-primary' : 'text-slate-900',
                          )}
                        >
                          {asset.assetName}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] font-black tracking-widest text-slate-400">#{asset.assetCode || asset.assetId}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="rounded-lg border border-slate-200/50 bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {getAssetTypeLabel(asset.type)}
                          </span>
                          {asset.brand ? <span className="truncate text-[9px] font-black uppercase text-slate-400">{asset.brand}</span> : null}
                        </div>
                      </div>

                      {selectedIds.includes(asset.id) ? <div className="absolute right-0 top-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full bg-primary/5 blur-2xl" /> : null}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-6 border-t bg-slate-900 p-10">
            <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 md:grid-cols-[180px_1fr_160px_160px]">
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Tính vào hóa đơn</span>
                <input type="checkbox" checked={isBillable} onChange={(event) => setIsBillable(event.target.checked)} className="h-4 w-4 accent-primary" />
              </label>
              <input
                type="text"
                value={billingLabel}
                onChange={(event) => setBillingLabel(event.target.value)}
                disabled={!isBillable}
                placeholder="Nhãn hiển thị trên hóa đơn"
                className="input-base h-12 rounded-2xl border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-white/35 disabled:opacity-50"
              />
              <input
                type="number"
                min="0"
                step="1000"
                value={monthlyCharge}
                onChange={(event) => setMonthlyCharge(event.target.value)}
                disabled={!isBillable}
                placeholder="Phí tháng"
                className="input-base h-12 rounded-2xl border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-white/35 disabled:opacity-50"
              />
              <input
                type="date"
                value={billingStartDate}
                onChange={(event) => setBillingStartDate(event.target.value)}
                disabled={!isBillable}
                className="input-base h-12 rounded-2xl border-white/10 bg-white/10 px-4 text-sm text-white disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <p className="text-[18px] font-black tracking-tight text-white">Đang chọn {selectedIds.length} tài sản</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-white/40">
                  Các tài sản này sẽ được gắn vào phòng <span className="font-black text-white">{roomId}</span>
                </p>
              </div>
              <div className="flex w-full gap-4 md:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-10 py-4 font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95 md:flex-none"
                >
                  Hủy
                </button>
                <button
                  disabled={selectedIds.length === 0 || assignMutation.isPending || (isBillable && Number(monthlyCharge || 0) <= 0)}
                  onClick={() => assignMutation.mutate(selectedIds)}
                  className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-primary px-12 py-4 font-black uppercase tracking-[3px] text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-30 md:flex-none"
                >
                  {assignMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Package size={20} />}
                  Xác nhận gán
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
