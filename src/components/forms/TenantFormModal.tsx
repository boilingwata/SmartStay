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
  cccdFrontUrl?: string;
  cccdBackUrl?: string;
  cccdIssuedDate?: string;
  cccdIssuedPlace?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  occupation?: string;
  permanentAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  avatarUrl?: string;
  vehiclePlates?: string[];
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
    cccdFrontUrl?: string;
    cccdBackUrl?: string;
    cccdIssuedDate?: string;
    cccdIssuedPlace?: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    nationality?: string;
    occupation?: string;
    permanentAddress?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    avatarUrl?: string;
    vehiclePlates?: string[];
  };
  onSubmit: (data: TenantFormData & { vehiclePlates: string[] }) => void | Promise<void>;
}

const DEFAULT_TENANT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

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
    cccdFrontUrl: initialData?.cccdFrontUrl ?? '',
    cccdBackUrl: initialData?.cccdBackUrl ?? '',
    cccdIssuedDate: initialData?.cccdIssuedDate ?? '',
    cccdIssuedPlace: initialData?.cccdIssuedPlace ?? '',
    dateOfBirth: initialData?.dateOfBirth ?? '',
    gender: initialData?.gender ?? 'Male',
    nationality: initialData?.nationality ?? 'Viet Nam',
    occupation: initialData?.occupation ?? '',
    permanentAddress: initialData?.permanentAddress ?? '',
    emergencyContactName: initialData?.emergencyContactName ?? '',
    emergencyContactPhone: initialData?.emergencyContactPhone ?? '',
    avatarUrl: initialData?.avatarUrl ?? '',
  }), [initialData]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TenantFormData>({
    defaultValues,
  });

  const savedAvatarUrl = watch('avatarUrl');
  const savedCCCDFrontUrl = watch('cccdFrontUrl');
  const savedCCCDBackUrl = watch('cccdBackUrl');
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

      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl md:flex-row">
        <div className="relative flex flex-col justify-between overflow-hidden bg-primary p-12 text-white md:w-1/3">
          <div className="relative z-10 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <User size={32} />
            </div>
            <h2 className="text-display font-black leading-tight">
              {initialData ? 'Cap nhat' : 'Them moi'} Cu dan
            </h2>
            <p className="text-small font-medium text-white/60">
              Ho so tenant chi gom cac truong dang ton tai trong schema `smartstay.tenants`.
            </p>
          </div>

          <div className="relative z-10 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-300">Luu y</p>
            <p className="text-small italic text-white/80">
              CCCD va so dien thoai nen duoc kiem tra ky truoc khi tao ho so de tranh trung lap.
            </p>
          </div>

          <User size={300} className="absolute -bottom-20 -left-20 rotate-12 text-white/5" />
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <form onSubmit={handleSubmit(submitTenant)} className="space-y-8">
            <input type="hidden" {...register('avatarUrl')} />
            <input type="hidden" {...register('cccdFrontUrl')} />
            <input type="hidden" {...register('cccdBackUrl')} />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Ho va ten *</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('fullName', {
                      required: 'Vui long nhap ho ten',
                      minLength: { value: 2, message: 'Ho ten qua ngan' },
                    })}
                    className={cn('input-base h-14 pl-12', errors.fullName && 'border-danger bg-danger/5')}
                    placeholder="VD: Nguyen Van A"
                  />
                </div>
                {errors.fullName ? <p className="text-[10px] font-bold uppercase text-danger">{errors.fullName.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">So dien thoai *</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('phone', {
                      required: 'Vui long nhap SDT',
                      pattern: { value: PHONE_REGEX, message: 'SDT khong hop le' },
                    })}
                    className={cn('input-base h-14 pl-12', errors.phone && 'border-danger bg-danger/5')}
                    placeholder="09xx xxx xxx"
                  />
                </div>
                {errors.phone ? <p className="text-[10px] font-bold uppercase text-danger">{errors.phone.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">So CCCD/Ho chieu *</label>
                <div className="relative">
                  <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('cccd', {
                      required: 'Vui long nhap CCCD',
                      minLength: { value: 12, message: 'CCCD phai dung 12 chu so' },
                      maxLength: { value: 12, message: 'CCCD phai dung 12 chu so' },
                      validate: async (value) => {
                        const normalizedValue = value.trim();
                        if (!normalizedValue) return true;
                        const existingTenant = await tenantService.findTenantByIdNumber(normalizedValue);
                        return !existingTenant || existingTenant.id === initialData?.id || `CCCD nay da ton tai trong ho so ${existingTenant.fullName}.`;
                      },
                    })}
                    className={cn('input-base h-14 pl-12 font-mono', errors.cccd && 'border-danger bg-danger/5')}
                    placeholder="12 chu so"
                  />
                </div>
                {errors.cccd ? <p className="text-[10px] font-bold uppercase text-danger">{errors.cccd.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('email')} className="input-base h-14 pl-12" placeholder="example@gmail.com" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Ngay cap CCCD</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="date" {...register('cccdIssuedDate')} className="input-base h-14 pl-12" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Noi cap CCCD</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('cccdIssuedPlace')} className="input-base h-14 pl-12" placeholder="VD: Cuc CSQLHC ve TTXH" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Gioi tinh</label>
                <select {...register('gender')} className="input-base h-14">
                  <option value="Male">Nam</option>
                  <option value="Female">Nu</option>
                  <option value="Other">Khac</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Ngay sinh</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="date"
                    {...register('dateOfBirth', {
                      validate: (value) => {
                        if (!value) return true;
                        const age = new Date().getFullYear() - new Date(value).getFullYear();
                        return age >= 18 || 'Cu dan phai tu 18 tuoi tro len';
                      },
                    })}
                    className={cn('input-base h-14 pl-12', errors.dateOfBirth && 'border-danger bg-danger/5')}
                  />
                </div>
                {errors.dateOfBirth ? <p className="text-[10px] font-bold uppercase text-danger">{errors.dateOfBirth.message}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Quoc tich</label>
                <div className="relative">
                  <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('nationality')} className="input-base h-14 pl-12" placeholder="VD: Viet Nam" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Nghe nghiep</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input {...register('occupation')} className="input-base h-14 pl-12" placeholder="VD: Ky su" />
                </div>
              </div>

              <div className="col-span-full space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Dia chi thuong tru</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('permanentAddress')}
                    className="input-base h-14 pl-12"
                    placeholder="So nha, duong, phuong xa, quan huyen, tinh thanh pho"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">Lien he khan cap</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('emergencyContactName')}
                    className="input-base h-14 pl-12"
                    placeholder="VD: Nguyen Thi B"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label font-black uppercase tracking-widest text-muted">SDT lien he khan cap</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    {...register('emergencyContactPhone', {
                      validate: (value) => !value?.trim() || PHONE_REGEX.test(value.trim()) || 'SDT lien he khong hop le',
                    })}
                    className={cn('input-base h-14 pl-12', errors.emergencyContactPhone && 'border-danger bg-danger/5')}
                    placeholder="09xx xxx xxx"
                  />
                </div>
                {errors.emergencyContactPhone ? (
                  <p className="text-[10px] font-bold uppercase text-danger">{errors.emergencyContactPhone.message}</p>
                ) : null}
              </div>

              <div className="col-span-full space-y-3">
                <label className="text-label font-black uppercase tracking-widest text-muted">Anh CCCD / Ho chieu</label>
                <div className="grid grid-cols-1 gap-4 rounded-[32px] border border-border/40 bg-bg/20 p-5 md:grid-cols-2">
                  <ImageUploadCard
                    value={savedCCCDFrontUrl || undefined}
                    label="Mat truoc"
                    alt="CCCD mat truoc"
                    successMessage="Da tai anh CCCD mat truoc"
                    onUploaded={(url) => setValue('cccdFrontUrl', url, { shouldDirty: true })}
                  />
                  <ImageUploadCard
                    value={savedCCCDBackUrl || undefined}
                    label="Mat sau"
                    alt="CCCD mat sau"
                    successMessage="Da tai anh CCCD mat sau"
                    onUploaded={(url) => setValue('cccdBackUrl', url, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="col-span-full space-y-3">
                <label className="text-label font-black uppercase tracking-widest text-muted">Anh dai dien</label>
                <div className="flex items-center gap-6 rounded-[32px] border border-border/40 bg-bg/20 p-6">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl border-2 border-primary/10 bg-white shadow-lg">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className={cn('h-full w-full object-cover', avatarPreview === DEFAULT_TENANT_AVATAR_URL && 'grayscale opacity-50')}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <ImageUploadCard
                      value={savedAvatarUrl || undefined}
                      label="Anh dai dien"
                      alt="Avatar preview"
                      successMessage="Da tai anh dai dien thanh cong"
                      onUploadStateChange={setIsUploadingAvatar}
                      onUploaded={(url) => {
                        setValue('avatarUrl', url, { shouldDirty: true });
                        setAvatarPreview(url);
                      }}
                    />
                    <p className="text-[10px] font-medium text-muted">PNG, JPG, WebP toi da 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="col-span-full space-y-3">
                <label className="text-label font-black uppercase tracking-widest text-muted">Bien so xe (Enter de them)</label>
                <div className="flex min-h-[70px] flex-wrap gap-2 rounded-[32px] border border-border/50 bg-white p-5 shadow-inner">
                  {plates.map((plate) => (
                    <button
                      key={plate}
                      type="button"
                      onClick={() => setPlates((current) => current.filter((value) => value !== plate))}
                      className="rounded-xl bg-primary px-4 py-2 font-mono text-[11px] font-black text-white transition-all hover:bg-danger"
                    >
                      {plate}
                    </button>
                  ))}
                  <div className="flex min-w-[200px] flex-1 items-center gap-2">
                    <input
                      type="text"
                      className="w-full border-none bg-transparent text-small font-bold text-primary outline-none"
                      placeholder="+ Nhap bien so (VD: 30A-123.45)"
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;
                        event.preventDefault();
                        const value = event.currentTarget.value.trim().toUpperCase();
                        if (value && !plates.includes(value)) {
                          setPlates((current) => [...current, value]);
                          event.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <button type="button" onClick={onClose} className="btn-outline h-12 rounded-2xl px-8">
                Huy
              </button>
              <button
                type="submit"
                className="btn-primary flex h-12 items-center gap-2 rounded-2xl px-12 shadow-xl shadow-primary/20 disabled:opacity-60"
                disabled={isBusy}
              >
                {isBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                {isUploadingAvatar ? 'Dang tai anh...' : isSubmitting ? 'Dang luu...' : 'Luu thong tin'}
              </button>
            </div>
          </form>
        </div>

        <button onClick={onClose} className="absolute right-6 top-6 rounded-full p-2 text-muted transition-all hover:bg-bg">
          <X size={24} />
        </button>
      </div>
    </div>
  );
};
