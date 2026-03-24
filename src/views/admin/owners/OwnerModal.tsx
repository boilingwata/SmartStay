import React from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, User, Phone, Mail, 
  ShieldCheck, MapPin, Tag, 
  Camera, Info, Building,
  ShieldAlert, Send, ArrowRight,
  Fingerprint
} from 'lucide-react';
import { cn } from '@/utils';
import { Owner } from '@/models/Owner';
import { buildingService } from '@/services/buildingService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Owner | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export const OwnerModal = ({ isOpen, onClose, initialData, onSubmit, isSubmitting }: OwnerModalProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      fullName: '',
      phone: '',
      email: '',
      cccd: '',
      taxCode: '',
      address: '',
      avatarUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] scale-in-95 duration-500">
        {/* Decorative Sidebar */}
        <div className="md:w-1/3 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10 space-y-8">
              <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center border border-white/20 backdrop-blur-xl group">
                 <User size={40} className="group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <h2 className="text-[40px] font-black leading-tight tracking-tighter mb-4">
                  {initialData ? 'Cập nhật' : 'Thêm mới'} <br/>
                  <span className="text-secondary italic">Chủ sở hữu</span>
                </h2>
                <p className="text-small text-white/50 font-medium leading-relaxed">
                  Thiết lập hồ sơ định danh cho cư dân, nhà đầu tư hoặc đơn vị vận hành.
                </p>
              </div>
           </div>
           
           <div className="relative z-10 p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-lg">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                 <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Bảo mật dữ liệu</p>
              </div>
              <p className="text-[11px] italic text-white/70 leading-relaxed font-medium">
                "Thông tin PII như CCCD và số điện thoại sẽ được mã hóa và phân quyền truy cập nghiêm ngặt."
              </p>
           </div>

           <User size={400} className="absolute -bottom-40 -left-40 text-white/5 rotate-12 pointer-events-none" />
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-14 overflow-y-auto custom-scrollbar bg-slate-50/30">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                   <ShieldCheck size={18} className="text-primary" />
                   <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Thông tin định danh</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Full Name */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Họ và tên <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
                        className={cn("input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200", errors.fullName && "border-danger bg-danger/5")} 
                        placeholder="VD: Nguyễn Văn A"
                       />
                    </div>
                    {errors.fullName && <p className="text-[10px] text-danger font-bold uppercase ml-1">{(errors.fullName as any).message}</p>}
                  </div>

                  {/* CCCD / Passport */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Số CCCD / Passport <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <Fingerprint size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('cccd', { required: 'Vui lòng nhập số định danh' })} 
                        className={cn("input-base pl-14 h-16 rounded-2xl font-mono text-[16px] bg-white shadow-sm border-slate-200", errors.cccd && "border-danger bg-danger/5")} 
                        placeholder="VD: 00120100xxxx"
                       />
                    </div>
                    {errors.cccd && <p className="text-[10px] text-danger font-bold uppercase ml-1">{(errors.cccd as any).message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Số điện thoại <span className="text-danger">*</span></label>
                    <div className="relative group">
                       <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('phone', { required: 'Vui lòng nhập số điện thoại' })} 
                        className={cn("input-base pl-14 h-16 rounded-2xl font-mono text-[16px] bg-white shadow-sm border-slate-200", errors.phone && "border-danger bg-danger/5")} 
                        placeholder="VD: 090xxxxxxx"
                       />
                    </div>
                    {errors.phone && <p className="text-[10px] text-danger font-bold uppercase ml-1">{(errors.phone as any).message}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Địa chỉ Email</label>
                    <div className="relative group">
                       <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                       <input 
                        {...register('email')} 
                        className="input-base pl-14 h-16 rounded-2xl font-mono text-[16px] bg-white shadow-sm border-slate-200" 
                        placeholder="example@gmail.com"
                       />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                   <MapPin size={18} className="text-secondary" />
                   <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Địa chỉ & Pháp lý</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Tax Code */}
                   <div className="space-y-3">
                      <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Mã số thuế</label>
                      <div className="relative group">
                         <Tag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary transition-colors" />
                         <input 
                           {...register('taxCode')} 
                           className="input-base pl-14 h-16 rounded-2xl font-mono text-[16px] bg-white shadow-sm border-slate-200" 
                           placeholder="VD: 8xxxxxxxxx"
                         />
                      </div>
                   </div>

                   {/* Address */}
                   <div className="space-y-3">
                      <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Địa chỉ thường trú</label>
                      <div className="relative group">
                         <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary transition-colors" />
                         <input 
                           {...register('address')} 
                           className="input-base pl-14 h-16 rounded-2xl bg-white shadow-sm border-slate-200" 
                           placeholder="VD: 123 Đường ABC, Quận X, TP. Y"
                         />
                      </div>
                   </div>
                </div>
              </section>

              <section className="space-y-8">
                 <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                    <Camera size={18} className="text-accent" />
                    <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Ảnh đại diện</h3>
                 </div>
                 
                 <div className="flex items-center gap-8 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/10 shadow-lg shrink-0">
                       <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" className="w-full h-full object-cover grayscale opacity-50" />
                    </div>
                    <div className="space-y-2">
                       <button type="button" className="btn-outline h-10 px-6 text-[11px] font-black uppercase tracking-wider">Tải ảnh lên</button>
                       <p className="text-[10px] text-muted italic font-medium">Hỗ trợ JPG, PNG. Dung lượng tối đa 2MB.</p>
                    </div>
                 </div>
              </section>

              {/* Actions */}
              <div className="pt-10 flex items-center justify-between border-t border-slate-200">
                 <div className="flex items-center gap-3 text-muted">
                    <ShieldAlert size={16} />
                    <p className="text-[11px] font-medium italic">Vui lòng kiểm tra kỹ thông tin định danh trước khi lưu.</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                       type="button" 
                       onClick={onClose} 
                       className="px-10 h-14 rounded-2xl font-black uppercase tracking-[2px] text-[11px] text-muted hover:bg-white transition-all border border-transparent hover:border-slate-200"
                    >
                       Hủy bỏ
                    </button>
                    <button 
                       type="submit" 
                       className="group px-14 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-[3px] text-[11px] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3"
                       disabled={isSubmitting}
                    >
                       {isSubmitting ? 'Đang lưu...' : (
                          <>
                             {initialData ? 'Cập nhật hồ sơ' : 'Thêm chủ sở hữu'}
                             <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </>
                       )}
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
