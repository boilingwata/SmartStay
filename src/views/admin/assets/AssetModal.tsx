import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, Package, Zap, ShieldCheck, 
  Calendar, DollarSign, FileText, 
  Tag, Info, Home, Building2,
  Camera, Trash2
} from 'lucide-react';
import { cn } from '@/utils';
import { Asset, AssetType, AssetCondition } from '@/models/Asset';
import { toast } from 'sonner';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Asset | null;
  onSubmit: (data: any) => void;
  onDelete?: (id: string) => void;
  isSubmitting?: boolean;
}

export const AssetModal = ({ isOpen, onClose, initialData, onSubmit, onDelete, isSubmitting }: AssetModalProps) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: initialData || {
      type: 'Furniture',
      condition: 'New',
      purchasePrice: 0,
      quantity: 1,
      isBillable: false,
      monthlyCharge: 0,
      billingStatus: 'Inactive',
      billingStartDate: new Date().toISOString().split('T')[0],
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: ''
    }
  });

  // Handle pre-filling when initialData changes
  React.useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
        warrantyExpiry: initialData.warrantyExpiry ? initialData.warrantyExpiry.split('T')[0] : ''
      });
    } else {
      reset({
        type: 'Furniture',
        condition: 'New',
        purchasePrice: 0,
        quantity: 1,
        isBillable: false,
        monthlyCharge: 0,
        billingStatus: 'Inactive',
        billingStartDate: new Date().toISOString().split('T')[0],
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiry: '',
        brand: '',
        model: '',
        serialNumber: '',
        note: '',
        assetName: '',
        assetCode: ''
      });
    }
  }, [initialData, reset]);

  const [images, setImages] = React.useState<string[]>(initialData?.images || []);
  const isBillable = watch('isBillable');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] scale-in-95 duration-500">
        {/* Decorative Sidebar */}
        <div className="md:w-1/3 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-white/5">
           <div className="relative z-10 space-y-8">
              <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/40 group">
                 <Package size={32} className="group-hover:rotate-12 transition-transform duration-500 text-white" />
              </div>
              <div>
                <h2 className="text-[36px] font-black leading-tight tracking-tighter mb-3">
                  {initialData ? 'Cập nhật' : 'Thêm mới'} <br/>
                  <span className="text-primary uppercase tracking-[2px] text-[20px]">Tài sản</span>
                </h2>
                <p className="text-[12px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                  Hệ thống quản lý trang thiết bị thông minh.
                </p>
              </div>
           </div>
           
           <div className="relative z-10 p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-1 h-5 bg-primary rounded-full"></div>
                 <p className="text-[9px] font-black uppercase tracking-[3px] text-white/40">Nhật ký kiểm soát</p>
              </div>
              <p className="text-[11px] italic text-white/60 leading-relaxed font-medium">
                Dữ liệu kỹ thuật sẽ được đồng bộ trực tiếp với cơ sở dữ liệu Supabase thông qua mã định danh QR Code.
              </p>
           </div>

           <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
           <Package size={400} className="absolute -bottom-40 -left-40 text-white/5 rotate-12 pointer-events-none" />
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-slate-50/50">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
              {/* SECTION: BASIC INFO */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <Tag size={16} className="text-primary" />
                  <h3 className="text-[12px] text-slate-900 font-black uppercase tracking-[2px]">Thông tin định danh</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Tên tài sản <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('assetName', { required: 'Vui lòng nhập tên tài sản' })}
                        className={cn("input-base pl-12 h-12 rounded-xl bg-white shadow-sm border-slate-200 text-sm font-bold", errors.assetName && "border-danger bg-danger/5")} 
                        placeholder="VD: Điều hòa Panasonic"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Mã định danh (QR) <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('assetCode', { required: 'Vui lòng nhập mã QR' })} 
                        className={cn("input-base pl-12 h-12 rounded-xl font-mono text-sm bg-white shadow-sm border-slate-200 uppercase font-black", errors.assetCode && "border-danger bg-danger/5")} 
                        placeholder="AC-123"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Phòng / Vị trí</label>
                    <div className="relative group">
                       <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
                       <input 
                        className="input-base pl-12 h-12 rounded-xl bg-slate-100/50 border-slate-200 text-muted font-bold text-sm" 
                        value={initialData?.roomCode ? `${initialData.roomCode} - ${initialData.buildingName || ''}` : 'Chưa gán phòng'}
                        readOnly
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Phân loại</label>
                    <div className="relative">
                       <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/50" />
                       <select {...register('type')} className="input-base pl-12 h-12 rounded-xl bg-white shadow-sm border-slate-200 appearance-none font-bold text-sm">
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

              {/* SECTION: TECH SPECS */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <ShieldCheck size={16} className="text-primary" />
                  <h3 className="text-[12px] text-slate-900 font-black uppercase tracking-[2px]">Thông số kỹ thuật</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                       <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Thương hiệu</label>
                       <input 
                        {...register('brand')} 
                        className="input-base h-12 px-4 rounded-xl bg-white shadow-sm border-slate-200 font-bold text-sm" 
                        placeholder="Dell, Samsung..."
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Model</label>
                       <input 
                        {...register('model')} 
                        className="input-base h-12 px-4 rounded-xl bg-white shadow-sm border-slate-200 font-bold text-sm" 
                        placeholder="RT355..."
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Serial Number</label>
                       <input 
                        {...register('serialNumber')} 
                        className="input-base h-12 px-4 rounded-xl bg-white shadow-sm border-slate-200 font-mono text-sm uppercase" 
                        placeholder="S/N..."
                       />
                   </div>
                </div>
              </section>

              {/* SECTION: FINANCIALS */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <DollarSign size={16} className="text-secondary" />
                  <h3 className="text-[12px] text-slate-900 font-black uppercase tracking-[2px]">Giá trị & Bảo hành</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                   <div className="space-y-2">
                      <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Giá trị mua (VND)</label>
                      <input 
                        type="number"
                        {...register('purchasePrice')} 
                        className="input-base h-12 px-4 rounded-xl font-mono text-sm bg-white shadow-sm border-slate-200 font-black text-secondary" 
                        placeholder="0"
                      />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Số lượng</label>
                       <input 
                        type="number"
                        {...register('quantity')} 
                        className="input-base h-12 px-4 rounded-xl bg-white shadow-sm border-slate-200 font-black text-sm" 
                        placeholder="1"
                       />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Ngày lắp đặt</label>
                      <input 
                        type="date" 
                        {...register('purchaseDate')} 
                        className="input-base h-12 px-4 rounded-xl bg-white shadow-sm border-slate-200 font-bold text-sm cursor-pointer" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1 text-primary">Hết hạn bảo hành</label>
                      <input 
                        type="date" 
                        {...register('warrantyExpiry')} 
                        className="input-base h-12 px-4 rounded-xl bg-white shadow-sm border-primary/20 text-primary font-bold text-sm cursor-pointer" 
                      />
                   </div>
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Tình trạng thực tế</label>
                      <div className="grid grid-cols-4 gap-3">
                         {['New', 'Good', 'Fair', 'Poor'].map((cond) => (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => setValue('condition', cond as AssetCondition)}
                              className={cn(
                                "h-11 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all shadow-sm",
                                watch('condition') === cond 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                                  : "bg-white border-slate-200 text-muted hover:border-slate-300"
                              )}
                            >
                               {(() => {
                                 switch(cond) {
                                   case 'New': return 'Mới';
                                   case 'Good': return 'Tốt';
                                   case 'Fair': return 'Ổn';
                                   case 'Poor': return 'Kém';
                                   default: return cond;
                                 }
                               })()}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-[12px] text-slate-900 font-black uppercase tracking-[2px]">Billing tren hoa don</h3>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <span className="text-[10px] font-black uppercase tracking-[1.5px] text-muted">Tai san co tinh phi</span>
                    <input type="checkbox" {...register('isBillable')} className="h-4 w-4 accent-primary" />
                  </label>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Nhan hoa don</label>
                    <input
                      {...register('billingLabel')}
                      disabled={!isBillable}
                      className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50"
                      placeholder="VD: Phu phi dieu hoa"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Phi hang thang (VND)</label>
                    <input
                      type="number"
                      {...register('monthlyCharge')}
                      disabled={!isBillable}
                      className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Ngay bat dau tinh</label>
                    <input
                      type="date"
                      {...register('billingStartDate')}
                      disabled={!isBillable}
                      className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Ngay ket thuc tinh</label>
                    <input
                      type="date"
                      {...register('billingEndDate')}
                      disabled={!isBillable}
                      className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[1.5px] text-muted">Trang thai billing</label>
                    <select
                      {...register('billingStatus')}
                      disabled={!isBillable}
                      className="input-base h-12 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold shadow-sm disabled:opacity-50"
                    >
                      <option value="Inactive">Tam tat</option>
                      <option value="Active">Dang tinh</option>
                      <option value="Suspended">Tam dung</option>
                      <option value="Stopped">Ngung han</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Note */}
              <div className="space-y-2">
                  <label className="text-[10px] text-muted font-black uppercase tracking-[1.5px] ml-1">Ghi chú bổ sung</label>
                  <textarea 
                    {...register('note')}
                    className="input-base py-4 h-24 rounded-2xl bg-white shadow-sm border-slate-200 resize-none font-medium text-sm" 
                    placeholder="Lịch sử bảo trì hoặc lưu ý..."
                  />
              </div>

              {/* Actions */}
              <div className="pt-6 flex items-center justify-between border-t border-slate-200">
                 <button type="button" onClick={onClose} className="text-[10px] font-black uppercase tracking-[2px] text-muted hover:text-primary transition-all">
                    Bỏ qua
                 </button>
                 <div className="flex gap-3 items-center">
                    {initialData && onDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xóa tài sản ${initialData.assetName}?`)) {
                            onDelete(initialData.id);
                          }
                        }}
                        className="w-12 h-12 flex items-center justify-center text-danger hover:bg-danger/10 rounded-xl transition-all mr-2"
                        title="Xóa tài sản"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="px-10 h-12 rounded-xl bg-slate-900 text-white font-black uppercase tracking-[2px] text-[10px] shadow-xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                       {isSubmitting ? 'ĐANG LƯU...' : (initialData ? 'CẬP NHẬT' : 'TẠO MỚI TÀI SẢN')}
                    </button>
                 </div>
              </div>
           </form>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-muted transition-all active:scale-90 z-[120]">
           <X size={18} />
        </button>
      </div>
    </div>
  );
};

