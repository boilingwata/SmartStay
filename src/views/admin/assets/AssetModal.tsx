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
  isSubmitting?: boolean;
}

export const AssetModal = ({ isOpen, onClose, initialData, onSubmit, isSubmitting }: AssetModalProps) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialData || {
      type: 'Furniture',
      condition: 'New',
      purchasePrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0]
    }
  });

  const [images, setImages] = React.useState<string[]>(initialData?.images || []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] scale-in-95 duration-500">
        {/* Decorative Sidebar */}
        <div className="md:w-1/3 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10 space-y-8">
              <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/20 backdrop-blur-xl group">
                 <Package size={40} className="group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <div>
                <h2 className="text-[40px] font-black leading-tight tracking-tighter mb-4">
                  {initialData ? 'Cập nhật' : 'Thêm mới'} <span className="text-secondary italic">Tài sản</span>
                </h2>
                <p className="text-small text-white/50 font-medium leading-relaxed">
                  Ghi nhận đầy đủ thông tin tài sản giúp quản lý khấu hao và bàn giao phòng chính xác hơn.
                </p>
              </div>
           </div>
           
           <div className="relative z-10 p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-lg">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                 <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Audit Trail</p>
              </div>
              <p className="text-small italic text-white/70 leading-relaxed">
                "Mọi thay đổi về tình trạng tài sản sẽ được tự động lưu vào lịch sử biến động (Asset Logs)."
              </p>
           </div>

           <Package size={400} className="absolute -bottom-40 -left-40 text-white/5 rotate-12 pointer-events-none" />
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-14 overflow-y-auto custom-scrollbar bg-slate-50/30">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <Tag size={18} className="text-primary" />
                  <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Thông tin định danh</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Asset Name */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Tên tài sản <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <Package size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('assetName', { required: 'Vui lòng nhập tên tài sản' })}
                        className={cn("input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200", errors.assetName && "border-danger bg-danger/5")} 
                        placeholder="VD: Điều hòa Panasonic 12000BTU"
                       />
                    </div>
                    {errors.assetName && <p className="text-[10px] text-danger font-bold uppercase ml-1">{(errors.assetName as any).message}</p>}
                  </div>

                  {/* Asset Code */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Mã định danh <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <Tag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('assetCode', { required: 'Vui lòng nhập mã tài sản' })} 
                        className={cn("input-base pl-14 h-16 rounded-2xl font-mono text-[16px] bg-white shadow-sm border-slate-200", errors.assetCode && "border-danger bg-danger/5")} 
                        placeholder="VD: AC-001"
                       />
                    </div>
                    {errors.assetCode && <p className="text-[10px] text-danger font-bold uppercase ml-1">{(errors.assetCode as any).message}</p>}
                  </div>

                  {/* Type */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Loại tài sản</label>
                    <div className="relative">
                       <Zap size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                       <select {...register('type')} className="input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200 appearance-none">
                          <option value="Furniture">Nội thất (Furniture)</option>
                          <option value="Appliance">Thiết bị gia dụng (Appliance)</option>
                          <option value="Electronics">Điện tử (Electronics)</option>
                          <option value="Fixture">Cố định (Fixture)</option>
                          <option value="Other">Khác (Other)</option>
                       </select>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Tình trạng hiện tại</label>
                    <div className="relative">
                       <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                       <select {...register('condition')} className="input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200 appearance-none">
                          <option value="New">Mới 100% (New)</option>
                          <option value="Good">Sử dụng tốt (Good)</option>
                          <option value="Fair">Trung bình (Fair)</option>
                          <option value="Poor">Kém/Hỏng (Poor)</option>
                       </select>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <DollarSign size={18} className="text-secondary" />
                  <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Giá trị & Khấu hao</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Purchase Price */}
                   <div className="space-y-3">
                      <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Giá trị mua (VND)</label>
                      <div className="relative group">
                         <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary transition-colors" />
                         <input 
                           type="number"
                           {...register('purchasePrice')} 
                           className="input-base pl-14 h-16 rounded-2xl font-mono text-[16px] bg-white shadow-sm border-slate-200" 
                           placeholder="0"
                         />
                      </div>
                   </div>

                   {/* Purchase Date */}
                   <div className="space-y-3">
                      <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Ngày mua / Lắp đặt</label>
                      <div className="relative">
                         <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                         <input 
                           type="date" 
                           {...register('purchaseDate')} 
                           className="input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200" 
                         />
                      </div>
                   </div>

                   {/* Warranty Expiry */}
                   <div className="space-y-3">
                      <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Ngày hết hạn bảo hành</label>
                      <div className="relative">
                         <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                         <input 
                           type="date" 
                           {...register('warrantyExpiry')} 
                           className="input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200" 
                         />
                      </div>
                   </div>

                   {/* Room Assignment Placeholder */}
                   <div className="space-y-3">
                      <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Phòng gán tới (Không bắt buộc)</label>
                      <div className="relative">
                         <Home size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                         <select {...register('roomId')} className="input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200 appearance-none">
                            <option value="">Kho tổng (Chưa gán)</option>
                            <option value="R001">Phòng P.101</option>
                            <option value="R002">Phòng P.205</option>
                         </select>
                      </div>
                   </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <Camera size={18} className="text-accent" />
                  <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Hình ảnh & Ghi chú</h3>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Images */}
                  <div className="space-y-4">
                     <div className="flex flex-wrap gap-4">
                        {images.map((img, i) => (
                           <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-lg group">
                              <img src={img} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 p-1 bg-white/80 backdrop-blur-md text-danger rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                              >
                                 <X size={14} />
                              </button>
                           </div>
                        ))}
                        <button 
                          type="button" 
                          className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-primary/40 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                           <Camera size={24} />
                           <span className="text-[9px] font-black uppercase tracking-tighter mt-1">Thêm ảnh</span>
                        </button>
                     </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Ghi chú chi tiết</label>
                    <div className="relative">
                       <FileText size={18} className="absolute left-5 top-6 text-muted" />
                       <textarea 
                        {...register('note')}
                        className="input-base pl-14 py-5 h-32 rounded-[24px] bg-white shadow-sm border-slate-200 resize-none" 
                        placeholder="Mô tả chi tiết tình trạng, lịch sử sửa chữa hoặc lưu ý đặc biệt..."
                       />
                    </div>
                  </div>
                </div>
              </section>

              {/* Actions */}
              <div className="pt-10 flex items-center justify-between border-t border-slate-200">
                 {initialData && (
                    <button 
                      type="button"
                      className="text-[11px] font-black text-danger uppercase tracking-[2px] flex items-center gap-2 hover:underline p-4"
                    >
                       <Trash2 size={16} /> Xóa tài sản này
                    </button>
                 )}
                 <div className="flex gap-4 ml-auto">
                    <button 
                      type="button" 
                      onClick={onClose} 
                      className="px-10 h-14 rounded-2xl font-black uppercase tracking-[2px] text-[11px] text-muted hover:bg-white transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="px-14 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-[3px] text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Đang lưu...' : (initialData ? 'Lưu thay đổi' : 'Tạo tài sản')}
                    </button>
                 </div>
              </div>
           </form>
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/50 backdrop-blur-md hover:bg-white rounded-2xl text-muted hover:shadow-lg transition-all z-[110] active:scale-90 shadow-sm border border-black/5">
           <X size={24} />
        </button>
      </div>
    </div>
  );
};
