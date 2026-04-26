import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { type Resolver, useForm } from 'react-hook-form';
import { X, Package, Zap, ShieldCheck, DollarSign, FileText, Tag, Home, Trash2 } from 'lucide-react';
import { cn } from '@/utils';
import { Asset } from '@/models/Asset';
import { assetSchema, AssetFormData } from '@/schemas/assetSchema';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Asset | null;
  onSubmit: (data: AssetFormData) => void;
  onDelete?: (id: string) => void;
  isSubmitting?: boolean;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function getDefaultValues(initialData?: Asset | null): AssetFormData {
  if (initialData) {
    return {
      assetName: initialData.assetName,
      assetCode: initialData.assetCode ?? '',
      type: initialData.type,
      condition: initialData.condition,
      brand: initialData.brand ?? '',
      model: initialData.model ?? '',
      serialNumber: initialData.serialNumber ?? '',
      purchasePrice: initialData.purchasePrice ?? 0,
      quantity: initialData.quantity ?? 1,
      purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
      warrantyExpiry: initialData.warrantyExpiry ? initialData.warrantyExpiry.split('T')[0] : '',
      description: initialData.description ?? '',
      isBillable: initialData.isBillable ?? false,
      billingLabel: initialData.billingLabel ?? '',
      monthlyCharge: initialData.monthlyCharge ?? 0,
      billingStartDate: initialData.billingStartDate ? initialData.billingStartDate.split('T')[0] : '',
      billingEndDate: initialData.billingEndDate ? initialData.billingEndDate.split('T')[0] : '',
      billingStatus: initialData.billingStatus ?? 'Inactive',
    };
  }

  return {
    assetName: '',
    assetCode: '',
    type: 'Furniture',
    condition: 'New',
    brand: '',
    model: '',
    serialNumber: '',
    purchasePrice: 0,
    quantity: 1,
    purchaseDate: today(),
    warrantyExpiry: '',
    description: '',
    isBillable: false,
    billingLabel: '',
    monthlyCharge: 0,
    billingStartDate: today(),
    billingEndDate: '',
    billingStatus: 'Inactive',
  };
}

export const AssetModal = ({ isOpen, onClose, initialData, onSubmit, onDelete, isSubmitting }: AssetModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema) as unknown as Resolver<AssetFormData>,
    defaultValues: getDefaultValues(initialData),
  });

  React.useEffect(() => {
    reset(getDefaultValues(initialData));
  }, [initialData, reset]);

  const hasOperationalRecord = Boolean(initialData?.roomAssetId);
  const isBillable = watch('isBillable');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 animate-in fade-in duration-300">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-5xl scale-in-95 flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl duration-500 md:flex-row">
        <div className="relative flex shrink-0 flex-col justify-between overflow-hidden border-r border-white/5 bg-slate-900 p-10 text-white md:w-1/3">
          <div className="relative z-10 space-y-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary shadow-2xl shadow-primary/40">
              <Package size={32} className="text-white" />
            </div>
            <div>
              <h2 className="mb-3 text-[36px] font-black leading-tight tracking-tighter">
                {initialData ? 'Cập nhật' : 'Thêm mới'} <br />
                <span className="text-[20px] uppercase tracking-[2px] text-primary">Tài sản</span>
              </h2>
              <p className="text-[12px] font-bold uppercase tracking-widest leading-relaxed text-white/40">
                Chỉ giữ lại dữ liệu thực sự được persist trong scope hiện tại.
              </p>
            </div>
          </div>

          <div className="relative z-10 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <p className="text-[9px] font-black uppercase tracking-[3px] text-white/40">Phạm vi phase 8</p>
            </div>
            <p className="text-[11px] font-medium italic leading-relaxed text-white/60">
              Asset master lưu ở catalog, billing và room assignment chỉ lưu khi có row trong room_assets.
            </p>
          </div>

          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
          <Package size={400} className="pointer-events-none absolute -bottom-40 -left-40 rotate-12 text-white/5" />
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 md:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <Tag size={16} className="text-primary" />
                <h3 className="text-[12px] font-black uppercase tracking-[2px] text-slate-900">Thông tin định danh</h3>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">
                    Tên tài sản <span className="text-danger">*</span>
                  </label>
                  <div className="relative group">
                    <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50 transition-colors group-focus-within:text-primary" />
                    <input
                      {...register('assetName')}
                      className={cn(
                        'input-base h-12 rounded-xl border-slate-200 bg-white pl-12 text-sm font-bold shadow-sm',
                        errors.assetName && 'border-danger bg-danger/5',
                      )}
                      placeholder="VD: Điều hòa Panasonic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Mã định danh (QR)</label>
                  <div className="relative group">
                    <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50 transition-colors group-focus-within:text-primary" />
                    <input
                      {...register('assetCode')}
                      className={cn(
                        'input-base h-12 rounded-xl border-slate-200 bg-white pl-12 font-mono text-sm uppercase font-black shadow-sm',
                        errors.assetCode && 'border-danger bg-danger/5',
                      )}
                      placeholder="Để trống nếu chưa có QR"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Phòng / vị trí</label>
                  <div className="relative">
                    <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
                    <input
                      className="input-base h-12 rounded-xl border-slate-200 bg-slate-100/50 pl-12 text-sm font-bold text-muted"
                      value={initialData?.roomCode ? `${initialData.roomCode} - ${initialData.buildingName || ''}` : 'Chưa gán phòng'}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Phân loại</label>
                  <div className="relative">
                    <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
                    <select {...register('type')} className="input-base h-12 appearance-none rounded-xl border-slate-200 bg-white pl-12 text-sm font-bold shadow-sm">
                      <option value="Furniture">Nội thất (Furniture)</option>
                      <option value="Appliance">Thiết bị gia dụng (Appliance)</option>
                      <option value="Electronics">Điện tử (Electronics)</option>
                      <option value="Fixture">Cố định (Fixture)</option>
                      <option value="Other">Khác (Other)</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <ShieldCheck size={16} className="text-primary" />
                <h3 className="text-[12px] font-black uppercase tracking-[2px] text-slate-900">Thông số kỹ thuật</h3>
              </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Thương hiệu</label>
                    <input {...register('brand')} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm" placeholder="Dell, Samsung..." />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Model</label>
                    <input {...register('model')} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm" placeholder="RT355..." />
                  </div>
                  {hasOperationalRecord ? (
                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Serial Number</label>
                      <input {...register('serialNumber')} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 font-mono text-sm uppercase shadow-sm" placeholder="S/N..." />
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <DollarSign size={16} className="text-secondary" />
                <h3 className="text-[12px] font-black uppercase tracking-[2px] text-slate-900">Giá trị & bảo hành</h3>
              </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Giá trị mua (VND)</label>
                  <input
                    type="number"
                    {...register('purchasePrice', { valueAsNumber: true })}
                    className={cn(
                      'input-base h-12 rounded-xl border-slate-200 bg-white px-4 font-mono text-sm font-black text-secondary shadow-sm',
                      errors.purchasePrice && 'border-danger bg-danger/5',
                    )}
                    placeholder="0"
                  />
                </div>
                  {hasOperationalRecord ? (
                    <>
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Số lượng</label>
                        <input
                          type="number"
                          {...register('quantity', { valueAsNumber: true })}
                          className={cn(
                            'input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-black shadow-sm',
                            errors.quantity && 'border-danger bg-danger/5',
                          )}
                          placeholder="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Ngày mua</label>
                        <input type="date" {...register('purchaseDate')} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-primary">Hết hạn bảo hành</label>
                        <input
                          type="date"
                          {...register('warrantyExpiry')}
                          className={cn(
                            'input-base h-12 rounded-xl border-primary/20 bg-white px-4 text-sm font-bold text-primary shadow-sm',
                            errors.warrantyExpiry && 'border-danger bg-danger/5 text-danger',
                          )}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Tình trạng thực tế</label>
                        <div className="grid grid-cols-4 gap-3">
                          {(['New', 'Good', 'Fair', 'Poor'] as const).map((condition) => (
                            <button
                              key={condition}
                              type="button"
                              onClick={() => setValue('condition', condition)}
                              className={cn(
                                'h-11 rounded-xl border text-[9px] font-black uppercase tracking-widest shadow-sm transition-all',
                                watch('condition') === condition
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                  : 'border-slate-200 bg-white text-muted hover:border-slate-300',
                              )}
                            >
                              {condition === 'New' ? 'Mới' : condition === 'Good' ? 'Tốt' : condition === 'Fair' ? 'Ổn' : 'Kém'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2 rounded-2xl border border-primary/10 bg-primary/[0.03] px-4 py-4 text-[12px] font-medium text-primary/70">
                      Cac truong so luong, tinh trang, ngay mua va bao hanh se duoc cau hinh khi tai san duoc gan vao phong.
                    </div>
                  )}
              </div>
            </section>

            {hasOperationalRecord ? (
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-[12px] font-black uppercase tracking-[2px] text-slate-900">Billing trên hóa đơn</h3>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <span className="text-[10px] font-black uppercase tracking-[1.5px] text-muted">Tài sản có tính phí</span>
                    <input type="checkbox" {...register('isBillable')} className="h-4 w-4 accent-primary" />
                  </label>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Nhãn hóa đơn</label>
                    <input
                      {...register('billingLabel')}
                      disabled={!isBillable}
                      className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50"
                      placeholder="VD: Phụ phí điều hòa"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Phí hàng tháng (VND)</label>
                    <input
                      type="number"
                      {...register('monthlyCharge', { valueAsNumber: true })}
                      disabled={!isBillable}
                      className={cn(
                        'input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50',
                        errors.monthlyCharge && 'border-danger bg-danger/5',
                      )}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Ngày bắt đầu tính</label>
                    <input type="date" {...register('billingStartDate')} disabled={!isBillable} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50" />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Ngày kết thúc tính</label>
                    <input type="date" {...register('billingEndDate')} disabled={!isBillable} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50" />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Trạng thái billing</label>
                    <select {...register('billingStatus')} disabled={!isBillable} className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50">
                      <option value="Inactive">Tạm tắt</option>
                      <option value="Active">Đang tính</option>
                      <option value="Suspended">Tạm dừng</option>
                      <option value="Stopped">Ngừng hẳn</option>
                    </select>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Mô tả / ghi chú</label>
              <textarea
                {...register('description')}
                className="input-base h-24 resize-none rounded-2xl border-slate-200 bg-white py-4 text-sm font-medium shadow-sm"
                placeholder="Mô tả tài sản hoặc lưu ý cơ bản..."
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[2px] text-muted transition-all hover:text-primary">
                Bỏ qua
              </button>
              <div className="flex items-center gap-3">
                {initialData && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa tài sản ${initialData.assetName}?`)) {
                        onDelete(initialData.id);
                      }
                    }}
                    className="mr-2 flex h-12 w-12 items-center justify-center rounded-xl text-danger transition-all hover:bg-danger/10"
                    title="Xóa tài sản"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-slate-900 px-10 text-[10px] font-black uppercase tracking-[2px] text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-black active:scale-[0.98] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'ĐANG LƯU...' : initialData ? 'CẬP NHẬT' : 'TẠO MỚI TÀI SẢN'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <button onClick={onClose} className="absolute right-6 top-6 z-[120] rounded-full bg-slate-100 p-2 text-muted transition-all hover:bg-slate-200 active:scale-90">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
