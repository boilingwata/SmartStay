import React from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Briefcase,
  MapPin,
  Globe,
  Loader2,
} from 'lucide-react';
import { cn } from '@/utils';
import { ImageUploadCard } from '@/components/shared/ImageUploadCard';
import { tenantService } from '@/services/tenantService';

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
  avatarUrl?: string;
};

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    cccd?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    nationality?: string;
    occupation?: string;
    permanentAddress?: string;
    isRepresentative?: boolean;
    avatarUrl?: string;
    vehiclePlates?: string[];
  };
  onSubmit: (data: TenantFormData & { vehiclePlates: string[] }) => void | Promise<void>;
}

const DEFAULT_TENANT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export const TenantFormModal = ({ isOpen, onClose, initialData, onSubmit }: TenantModalProps) => {
  const [plates, setPlates] = React.useState<string[]>(initialData?.vehiclePlates || []);
  const [avatarPreview, setAvatarPreview] = React.useState<string>(initialData?.avatarUrl || DEFAULT_TENANT_AVATAR_URL);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultValues = React.useMemo<TenantFormData>(() => ({
    fullName: initialData?.fullName ?? '',
    phone: initialData?.phone ?? '',
    email: initialData?.email ?? '',
    cccd: initialData?.cccd ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    gender: initialData?.gender ?? 'Male',
    nationality: initialData?.nationality ?? 'Việt Nam',
    occupation: initialData?.occupation ?? '',
    permanentAddress: initialData?.permanentAddress ?? '',
    isRepresentative: initialData?.isRepresentative ?? false,
    avatarUrl: initialData?.avatarUrl ?? '',
  }), [initialData]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<TenantFormData>({
    defaultValues,
  });

  const savedAvatarUrl = watch('avatarUrl');
  const isBusy = isUploadingAvatar || isSubmitting;

  React.useEffect(() => {
    if (!isOpen) return;
    reset(defaultValues);
    setPlates(initialData?.vehiclePlates || []);
    setAvatarPreview(initialData?.avatarUrl || DEFAULT_TENANT_AVATAR_URL);
    setIsUploadingAvatar(false);
    setIsSubmitting(false);
  }, [defaultValues, initialData, isOpen, reset]);

  const submitTenant = async (data: TenantFormData) => {
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit({
        ...data,
        avatarUrl: data.avatarUrl || initialData?.avatarUrl || undefined,
        vehiclePlates: plates,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        <div className="md:w-1/3 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <User size={32} />
            </div>
            <h2 className="text-display font-black leading-tight">
              {initialData ? 'Cập nhật' : 'Thêm mới'} Cư dân
            </h2>
            <p className="text-small text-white/60 font-medium">
              Hồ sơ cư dân sẽ được lưu trữ và mã hóa theo tiêu chuẩn bảo mật SmartStay.
            </p>
          </div>

          <div className="relative z-10 p-6 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lời khuyên</p>
            <p className="text-small italic text-white/80">
              "Đảm bảo số CCCD và SĐT là duy nhất để tránh xung đột dữ liệu."
            </p>
          </div>

          <User size={300} className="absolute -bottom-20 -left-20 text-white/5 rotate-12" />
        </div>

        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit(submitTenant)} className="space-y-8">
            <input type="hidden" {...register('avatarUrl')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Họ và tên *</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('fullName', {
                      required: 'Vui lòng nhập họ tên',
                      minLength: { value: 2, message: 'Họ tên quá ngắn' },
                    })}
                    className={cn('input-base pl-12 h-14', errors.fullName && 'border-danger bg-danger/5')}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                {errors.fullName && <p className="text-[10px] text-danger font-bold uppercase">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Số điện thoại *</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('phone', {
                      required: 'Vui lòng nhập SĐT',
                      pattern: { value: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: 'SĐT không hợp lệ' },
                    })}
                    className={cn('input-base pl-12 h-14', errors.phone && 'border-danger bg-danger/5')}
                    placeholder="09xx xxx xxx"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-danger font-bold uppercase">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Số CCCD/Hộ chiếu *</label>
                <div className="relative">
                  <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('cccd', {
                      required: 'Vui lòng nhập CCCD',
                      minLength: { value: 12, message: 'CCCD phải đúng 12 chữ số' },
                      maxLength: { value: 12, message: 'CCCD phải đúng 12 chữ số' },
                      validate: async (value) => {
                        const normalizedValue = value.trim();
                        if (!normalizedValue) return true;
                        const existingTenant = await tenantService.findTenantByIdNumber(normalizedValue);
                        return !existingTenant || existingTenant.id === initialData?.id || `CCCD này đã tồn tại trong hồ sơ cư dân ${existingTenant.fullName}.`;
                      },
                    })}
                    className={cn('input-base pl-12 h-14 font-mono', errors.cccd && 'border-danger bg-danger/5')}
                    placeholder="12 chữ số"
                  />
                </div>
                {errors.cccd && <p className="text-[10px] text-danger font-bold uppercase">{errors.cccd.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('email')} className="input-base pl-12 h-14" placeholder="example@gmail.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Giới tính</label>
                <select {...register('gender')} className="input-base h-14">
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

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
                        return age >= 18 || 'Cư dân phải từ 18 tuổi trở lên';
                      },
                    })}
                    className={cn('input-base pl-12 h-14', errors.dateOfBirth && 'border-danger bg-danger/5')}
                  />
                </div>
                {errors.dateOfBirth && <p className="text-[10px] text-danger font-bold uppercase">{errors.dateOfBirth.message}</p>}
              </div>

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

              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Quốc tịch</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('nationality')} className="input-base pl-12 h-14" placeholder="VD: Việt Nam" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Nghề nghiệp</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('occupation')} className="input-base pl-12 h-14" placeholder="VD: Kỹ sư" />
                </div>
              </div>

              <div className="col-span-full space-y-2">
                <label className="text-label text-muted font-black uppercase tracking-widest">Địa chỉ thường trú</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('permanentAddress')}
                    className="input-base pl-12 h-14"
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  />
                </div>
              </div>

              <div className="col-span-full space-y-3">
                <label className="text-label text-muted font-black uppercase tracking-widest">Ảnh đại diện</label>
                <div className="flex items-center gap-6 p-6 bg-bg/20 border border-border/40 rounded-[32px]">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-primary/10 shadow-lg shrink-0 bg-white">
                    <img
                      src={avatarPreview}
                      alt="Tenant avatar preview"
                      className={cn('w-full h-full object-cover', avatarPreview === DEFAULT_TENANT_AVATAR_URL && 'grayscale opacity-50')}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <ImageUploadCard
                      value={savedAvatarUrl || undefined}
                      label="Ảnh đại diện"
                      alt="Tenant avatar preview"
                      successMessage="Đã tải ảnh đại diện thành công"
                      onUploadStateChange={setIsUploadingAvatar}
                      onUploaded={(url) => {
                        setValue('avatarUrl', url, { shouldDirty: true });
                        setAvatarPreview(url);
                      }}
                    />
                    <p className="text-[10px] text-muted font-medium">PNG, JPG, WebP tối đa 2MB. Ảnh được tải lên ngay khi bạn chọn.</p>
                  </div>
                </div>
              </div>

              <div className="col-span-full space-y-3">
                <label className="text-label text-muted font-black uppercase tracking-widest">Danh sách biển số xe (Enter để thêm)</label>
                <div className="flex flex-wrap gap-2 p-5 bg-white border border-border/50 rounded-[32px] min-h-[70px] shadow-inner">
                  {plates.map((plate, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setPlates((current) => current.filter((value) => value !== plate))}
                      className="px-4 py-2 bg-primary text-white text-[11px] font-black font-mono rounded-xl hover:bg-danger transition-all animate-in zoom-in-95"
                    >
                      {plate}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-small font-bold text-primary w-full"
                      placeholder="+ Nhập biển số (ví dụ: 30A-123.45)"
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        const value = event.currentTarget.value.trim().toUpperCase();
                        if (value && !plates.includes(value)) {
                          setPlates([...plates, value]);
                          event.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t">
              <button type="button" onClick={onClose} className="btn-outline px-8 h-12 rounded-2xl">
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary px-12 h-12 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-60"
                disabled={isBusy}
              >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                {isUploadingAvatar ? 'Đang tải ảnh...' : isSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>

        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-bg rounded-full text-muted transition-all">
          <X size={24} />
        </button>
      </div>
    </div>
  );
};
