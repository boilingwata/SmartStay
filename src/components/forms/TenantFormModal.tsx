import React from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Phone, Mail, CreditCard, Calendar, Briefcase, MapPin, Upload, Globe } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';

type TenantFormData = {
  fullName: string;
  phone: string;
  email?: string;
  cccd: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  occupation?: string;
  permanentAddress?: string;
  isRepresentative?: boolean;
};

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (data: TenantFormData) => void;
}

export const TenantFormModal = ({ isOpen, onClose, initialData, onSubmit }: TenantModalProps) => {
  const [plates, setPlates] = React.useState<string[]>(initialData?.vehiclePlates || []);
  const { register, handleSubmit, formState: { errors } } = useForm<TenantFormData>({
    defaultValues: initialData || {
      gender: 'Male',
      nationality: 'Vietnam'
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Decorative Sidebar */}
        <div className="md:w-1/3 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                 <User size={32} />
              </div>
              <h2 className="text-display font-black leading-tight">{initialData ? 'Cập nhật' : 'Thêm mới'} Cư dân</h2>
              <p className="text-small text-white/60 font-medium">Hồ sơ cư dân sẽ được lưu trữ và mã hóa theo tiêu chuẩn bảo mật SmartStay.</p>
           </div>
           
           <div className="relative z-10 p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lời khuyên</p>
              <p className="text-small italic text-white/80">"Đảm bảo số CCCD và SĐT là duy nhất để tránh xung đột dữ liệu."</p>
           </div>

           <User size={300} className="absolute -bottom-20 -left-20 text-white/5 rotate-12" />
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
           <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Full Name */}
                 <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Họ và tên *</label>
                    <div className="relative">
                       <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input 
                        {...register('fullName', { 
                          required: 'Vui lòng nhập họ tên',
                          minLength: { value: 2, message: 'Họ tên quá ngắn' }
                        })}
                        className={cn("input-base pl-12 h-14", errors.fullName && "border-danger bg-danger/5")} 
                        placeholder="VD: Nguyễn Văn A"
                       />
                    </div>
                    {errors.fullName && <p className="text-[10px] text-danger font-bold uppercase">{errors.fullName.message}</p>}
                 </div>

                 {/* Phone */}
                 <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Số điện thoại *</label>
                    <div className="relative">
                       <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input 
                        {...register('phone', { 
                           required: 'Vui lòng nhập SĐT',
                           pattern: { value: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: 'SĐT không hợp lệ' },
                           onBlur: (e) => {
                              if (e.target.value.includes('999')) {
                                 toast.error('Số điện thoại này đã tồn tại trong hệ thống!');
                              }
                           }
                        })} 
                        className={cn("input-base pl-12 h-14", errors.phone && "border-danger bg-danger/5")} 
                        placeholder="09xx xxx xxx"
                       />
                    </div>
                    {errors.phone && <p className="text-[10px] text-danger font-bold uppercase">{errors.phone.message}</p>}
                 </div>

                 {/* CCCD */}
                 <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Số CCCD/Hộ chiếu *</label>
                    <div className="relative">
                       <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input 
                        {...register('cccd', { 
                           required: 'Vui lòng nhập CCCD',
                           minLength: { value: 12, message: 'CCCD phải đúng 12 chữ số' },
                           maxLength: { value: 12, message: 'CCCD phải đúng 12 chữ số' },
                           onBlur: (e) => {
                              if (e.target.value === '123456789012') {
                                 toast.error('Số CCCD này đã thuộc về cư dân khác!');
                               }
                           }
                        })} 
                        className={cn("input-base pl-12 h-14 font-mono", errors.cccd && "border-danger bg-danger/5")} 
                        placeholder="12 chữ số"
                       />
                    </div>
                    {errors.cccd && <p className="text-[10px] text-danger font-bold uppercase">{errors.cccd.message}</p>}
                 </div>

                 {/* Email */}
                 <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Email</label>
                    <div className="relative">
                       <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input {...register('email')} className="input-base pl-12 h-14" placeholder="example@gmail.com" />
                    </div>
                 </div>

                 {/* Gender */}
                 <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Giới tính</label>
                    <select {...register('gender')} className="input-base h-14">
                       <option value="Male">Nam</option>
                       <option value="Female">Nữ</option>
                       <option value="Other">Khác</option>
                    </select>
                 </div>

                  {/* DOB */}
                  <div className="space-y-2">
                     <label className="text-label text-muted font-black uppercase tracking-widest">Ngày sinh</label>
                     <div className="relative">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input 
                          type="date" 
                          {...register('dateOfBirth', {
                            validate: (value) => {
                              if (!value) return true;
                              const age = new Date().getFullYear() - new Date(value).getFullYear();
                              return age >= 18 || "Cư dân phải từ 18 tuổi trở lên";
                            }
                          })} 
                          className={cn("input-base pl-12 h-14", errors.dateOfBirth && "border-danger bg-danger/5")} 
                        />
                     </div>
                     {errors.dateOfBirth && <p className="text-[10px] text-danger font-bold uppercase">{errors.dateOfBirth.message}</p>}
                  </div>

                  {/* Representative Toggle (Rule 5) */}
                  <div className="flex items-center gap-4 bg-accent/5 p-4 rounded-2xl border border-accent/10">
                    <div className="flex-1">
                      <p className="text-small font-black text-accent uppercase tracking-widest">Người đại diện</p>
                      <p className="text-[10px] text-muted leading-tight">Chỉ định cư dân này làm người đại diện cho hợp đồng.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" {...register('isRepresentative')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent ring-0 border-0 focus:ring-0"></div>
                    </label>
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Quốc tịch</label>
                    <div className="relative">
                       <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input {...register('nationality')} className="input-base pl-12 h-14" placeholder="VD: Việt Nam" />
                    </div>
                  </div>

                  {/* Occupation */}
                  <div className="space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Nghề nghiệp</label>
                    <div className="relative">
                       <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input {...register('occupation')} className="input-base pl-12 h-14" placeholder="VD: Kỹ sư" />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="col-span-full space-y-2">
                    <label className="text-label text-muted font-black uppercase tracking-widest">Địa chỉ thường trú</label>
                    <div className="relative">
                       <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                       <input {...register('permanentAddress')} className="input-base pl-12 h-14" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                    </div>
                  </div>

                   {/* Avatar Upload */}
                   <div className="col-span-full space-y-3">
                     <label className="text-label text-muted font-black uppercase tracking-widest">Ảnh đại diện</label>
                     <div 
                       className="flex items-center gap-6 p-6 bg-bg/20 border-2 border-dashed border-border/50 rounded-[32px] group hover:border-primary transition-all cursor-pointer"
                       onClick={() => document.getElementById('tenant-avatar-input')?.click()}
                     >
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                           <Upload className="text-muted group-hover:text-primary" />
                        </div>
                        <div>
                           <p className="text-body font-black text-primary uppercase">Tải ảnh lên</p>
                           <p className="text-[10px] text-muted font-medium">PNG, JPG tối đa 5MB. Khuyên dùng ảnh vuông.</p>
                        </div>
                        <input 
                          id="tenant-avatar-input"
                          type="file" 
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size > 5 * 1024 * 1024) {
                              toast.error('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
                              e.target.value = '';
                            } else if (file) {
                              toast.info(`Đã chọn: ${file.name}. Ảnh sẽ được tải lên khi lưu thông tin.`);
                            }
                          }}
                        />
                     </div>
                   </div>

                  {/* Vehicle Plates (Checklist #3) */}
                  <div className="col-span-full space-y-3">
                     <label className="text-label text-muted font-black uppercase tracking-widest">Danh sách biển số xe (Enter để thêm)</label>
                     <div className="flex flex-wrap gap-2 p-5 bg-white border border-border/50 rounded-[32px] min-h-[70px] shadow-inner">
                        {plates.map((p, i) => (
                          <button 
                           key={i} 
                           type="button"
                           onClick={() => setPlates(prev => prev.filter(x => x !== p))}
                           className="px-4 py-2 bg-primary text-white text-[11px] font-black font-mono rounded-xl hover:bg-danger transition-all animate-in zoom-in-95"
                          >
                            {p}
                          </button>
                        ))}
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                           <input 
                             type="text" 
                             className="bg-transparent border-none outline-none text-small font-bold text-primary w-full"
                             placeholder="+ Nhập biển số (ví dụ: 30A-123.45)"
                             onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                   e.preventDefault();
                                   const val = e.currentTarget.value.trim().toUpperCase();
                                   if (val && !plates.includes(val)) {
                                      setPlates([...plates, val]);
                                      e.currentTarget.value = '';
                                   }
                                }
                             }}
                           />
                        </div>
                     </div>
                  </div>
               </div>

              {/* Advanced info toggle placeholder */}
              <div className="pt-4 flex justify-end gap-3 border-t">
                 <button type="button" onClick={onClose} className="btn-outline px-8 h-12 rounded-2xl">Hủy</button>
                 <button type="submit" className="btn-primary px-12 h-12 rounded-2xl shadow-xl shadow-primary/20">Lưu thông tin</button>
              </div>
           </form>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-bg rounded-full text-muted transition-all"><X size={24} /></button>
      </div>
    </div>
  );
};
