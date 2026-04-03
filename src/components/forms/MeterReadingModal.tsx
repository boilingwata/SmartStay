import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  X,
  Zap,
  Droplets,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Camera,
} from 'lucide-react';
import { cn, validateMeterReading } from '@/utils';
import { Meter, LatestMeterReading } from '@/models/Meter';
import { meterService } from '@/services/meterService';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Select';

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: Meter | null;
  onSuccess: () => void;
}

type ReadingFormData = {
  monthYear: string;
  readingDate: string;
  currentIndex: number;
  note?: string;
};

export const MeterReadingModal = ({ isOpen, onClose, meter, onSuccess }: ReadingModalProps) => {
  const [latestReading, setLatestReading] = useState<LatestMeterReading | null>(null);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReadingFormData>({
    defaultValues: {
      monthYear: new Date().toISOString().slice(0, 7),
      readingDate: new Date().toISOString().slice(0, 10),
    },
  });

  const currentIndex = watch('currentIndex');
  const selectedMonthYear = watch('monthYear');
  const readingDate = watch('readingDate');
  const previousIndex = latestReading?.currentIndex ?? 0;
  const isElec = meter?.meterType === 'Electricity';

  const validation = useMemo(() => validateMeterReading(
    {
      meterId: meter?.id ?? '',
      meterType: meter?.meterType ?? 'Electricity',
      billingPeriod: selectedMonthYear ?? '',
      currentReading: currentIndex,
      readingDate,
    },
    {
      previousReading: previousIndex,
      existingPeriods: isDuplicate && selectedMonthYear ? [selectedMonthYear] : [],
    }
  ), [currentIndex, isDuplicate, meter?.id, meter?.meterType, previousIndex, readingDate, selectedMonthYear]);

  const blockingErrors = validation.errors.map((error) => error.message);
  const primaryError = blockingErrors[0];
  const consumption = validation.consumption ?? 0;
  const showCurrentReadingState = Number.isFinite(currentIndex);
  const isInvalid = showCurrentReadingState && !validation.isValid;

  const monthOptions = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - index);
    const value = date.toISOString().slice(0, 7);
    return {
      label: `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
      value,
    };
  });

  useEffect(() => {
    if (!meter?.id || !selectedMonthYear) {
      setIsDuplicate(false);
      return;
    }

    const checkDuplicate = async () => {
      setIsCheckingDuplicate(true);
      try {
        const response = await meterService.getReadings({
          meterId: meter.id,
          monthYear: selectedMonthYear,
          limit: 1,
        });
        setIsDuplicate(response.data.length > 0);
      } catch {
        setIsDuplicate(false);
      } finally {
        setIsCheckingDuplicate(false);
      }
    };

    void checkDuplicate();
  }, [meter?.id, selectedMonthYear]);

  useEffect(() => {
    if (!isOpen || !meter?.id) return;

    const fetchLatest = async () => {
      setIsLoadingLatest(true);
      try {
        const data = await meterService.getLatestReading(meter.id);
        setLatestReading(data);
      } catch (error) {
        console.error('Failed to fetch latest reading', error);
      } finally {
        setIsLoadingLatest(false);
      }
    };

    void fetchLatest();
  }, [isOpen, meter?.id]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
    toast.info('Đã chọn ảnh đồng hồ để gửi.');
  };

  const onFormSubmit = async (data: ReadingFormData) => {
    if (!meter) return;
    if (!validation.isValid) {
      toast.error(primaryError ?? 'Không thể lưu chỉ số.');
      return;
    }

    setIsSubmitting(true);
    try {
      await meterService.submitReading({
        meterId: meter.id,
        monthYear: data.monthYear,
        readingDate: data.readingDate,
        currentIndex: Number(data.currentIndex),
        note: data.note,
        readingImageUrl: previewImage || undefined,
      });
      toast.success(`Ghi nhận hoàn tất cho ${meter.meterCode}`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Lỗi khi gửi dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !meter) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl" onClick={isSubmitting ? undefined : onClose} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-[56px] border border-white bg-white/70 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] backdrop-blur-3xl animate-in zoom-in-95 duration-700">
        <div className="p-10 md:p-14">
          <div className="mb-12 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-[32px] border border-white text-white shadow-2xl transition-all animate-float',
                  isElec ? 'bg-amber-400 shadow-amber-400/30' : 'bg-blue-500 shadow-blue-500/30'
                )}
              >
                {isElec ? <Zap size={40} fill="currentColor" /> : <Droplets size={40} fill="currentColor" />}
              </div>
              <div>
                <h2 className="mb-2 text-[36px] font-black leading-none tracking-tighter text-slate-900">
                  Ghi chỉ số {isElec ? 'Điện' : 'Nước'}
                </h2>
                <p className="text-[14px] font-bold uppercase tracking-[4px] text-slate-400">
                  ID: {meter.meterCode} • <span className="italic text-primary">Unit {meter.roomCode}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-all hover:bg-danger hover:text-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Select
                    label="Tháng chốt kỳ"
                    placeholder="Chọn kỳ hóa đơn"
                    icon={Calendar}
                    options={monthOptions}
                    value={selectedMonthYear}
                    onChange={(value) => setValue('monthYear', value)}
                  />
                  {(errors.monthYear || validation.errors.some((error) => error.field === 'billingPeriod')) && (
                    <p className="pl-1 text-[12px] font-semibold text-danger">
                      {errors.monthYear?.message || validation.errors.find((error) => error.field === 'billingPeriod')?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-400">
                    Ngày cập nhật
                  </label>
                  <div className="relative group">
                    <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-primary" />
                    <input
                      type="date"
                      {...register('readingDate', { required: true })}
                      className="input-base h-16 border-none bg-slate-50 pl-14 font-bold"
                    />
                  </div>
                  {validation.errors.some((error) => error.field === 'readingDate') && (
                    <p className="pl-1 text-[12px] font-semibold text-danger">
                      {validation.errors.find((error) => error.field === 'readingDate')?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-400">
                    Số cũ
                  </label>
                  <div className="flex h-16 items-center rounded-3xl border border-white bg-slate-100/50 px-6 shadow-inner">
                    <span className="font-mono text-[22px] font-black tracking-tighter text-slate-400">
                      {isLoadingLatest ? '...' : previousIndex.toLocaleString()}
                    </span>
                    <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {isElec ? 'kWh' : 'm3'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={cn(
                      'ml-1 text-[11px] font-black uppercase tracking-[2px]',
                      isInvalid ? 'text-danger' : 'text-primary'
                    )}
                  >
                    Chỉ số mới nhất
                  </label>
                  <div
                    className={cn(
                      'group relative flex h-16 items-center rounded-3xl border-2 px-6 transition-all',
                      isInvalid
                        ? 'border-danger bg-danger/5'
                        : 'border-slate-100 bg-white shadow-xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'
                    )}
                  >
                    <input
                      type="number"
                      step="any"
                      autoFocus
                      {...register('currentIndex', { required: true, valueAsNumber: true })}
                      className={cn(
                        'w-full bg-transparent font-mono text-[28px] font-black leading-none tracking-tighter outline-none',
                        isInvalid ? 'text-danger' : 'text-slate-900'
                      )}
                      placeholder="000.0"
                    />
                    <div className="shrink-0 rounded-lg bg-slate-900 px-3 py-1 text-[9px] font-black uppercase leading-none tracking-widest text-white transition-colors group-focus-within:bg-primary">
                      {isElec ? 'kWh' : 'm3'}
                    </div>
                  </div>
                  {(errors.currentIndex || validation.errors.some((error) => error.field === 'currentReading')) && (
                    <p className="pl-1 text-[12px] font-semibold text-danger">
                      {errors.currentIndex?.message || validation.errors.find((error) => error.field === 'currentReading')?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div
              className={cn(
                'relative flex items-center justify-between overflow-hidden rounded-[40px] border p-8 transition-all duration-500',
                isInvalid
                  ? 'border-danger/20 bg-danger/10 text-danger shadow-[0_20px_40px_-15px_rgba(239,68,68,0.2)]'
                  : 'border-primary/20 bg-primary/5 text-primary shadow-xl shadow-primary/5'
              )}
            >
              <div className="relative z-10 flex items-center gap-6">
                <div className={cn('flex h-16 w-16 items-center justify-center rounded-3xl', isInvalid ? 'bg-danger/20' : 'bg-primary/20')}>
                  {isInvalid ? <AlertCircle size={32} /> : <TrendingUp size={32} />}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-black uppercase tracking-[3px] opacity-60">Tiêu thụ trong kỳ</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[36px] font-black leading-none tracking-tighter">{consumption.toLocaleString()}</span>
                    <span className="text-[12px] font-black uppercase tracking-widest">{isElec ? 'kWh' : 'm3'}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-right">
                {isInvalid ? (
                  <p className="text-[12px] font-black uppercase italic tracking-tight">Lỗi chặn ghi số</p>
                ) : (
                  consumption > 0 && <CheckCircle size={44} className="animate-in zoom-in-0 text-primary opacity-30 duration-700" />
                )}
              </div>

              {!isInvalid && <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-white/20 blur-2xl" />}
            </div>

            {(isCheckingDuplicate || blockingErrors.length > 0) && (
              <div
                className={cn(
                  'rounded-[32px] border px-6 py-5',
                  blockingErrors.length > 0 ? 'border-danger/20 bg-danger/5 text-danger' : 'border-slate-200 bg-slate-50 text-slate-500'
                )}
              >
                {isCheckingDuplicate ? (
                  <p className="text-[12px] font-bold uppercase tracking-[2px]">Đang kiểm tra trùng kỳ ghi số...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[3px]">Không thể lưu chỉ số</p>
                    {blockingErrors.map((message) => (
                      <p key={message} className="text-[13px] font-semibold leading-relaxed">
                        {message}
                      </p>
                    ))}
                    <p className="text-[11px] font-medium opacity-80">
                      Ngưỡng tiêu thụ tối đa hiện tại: {validation.threshold.toLocaleString()} {isElec ? 'kWh' : 'm3'} / kỳ.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
              <div className="space-y-2 md:col-span-3">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-400">
                  Ghi chú vận hành
                </label>
                <textarea
                  {...register('note')}
                  className="input-base min-h-[148px] rounded-3xl border-none bg-slate-50 p-6 text-[14px] font-medium italic text-slate-500 transition-colors focus:bg-white"
                  placeholder="Có sự cố gì không? (Tùy chọn)..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="ml-1 text-[11px] font-black uppercase tracking-[2px] text-slate-400">
                  Hình ảnh đối chiếu
                </label>
                <div className="relative min-h-[148px] group">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 z-10 cursor-pointer opacity-0" />
                  <div
                    className={cn(
                      'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed transition-all',
                      previewImage
                        ? 'border-primary bg-primary/[0.02]'
                        : 'border-slate-200 bg-white group-hover:border-primary/40 group-hover:bg-primary/5'
                    )}
                  >
                    {previewImage ? (
                      <div className="relative h-full w-full p-2">
                        <img src={previewImage} alt="Preview" className="h-full w-full rounded-2xl object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera size={24} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300 transition-colors group-hover:text-primary">
                          <Camera size={24} />
                        </div>
                        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Tải ảnh lên
                          <br />
                          (Max 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || isLoadingLatest || isCheckingDuplicate || !validation.isValid}
                className={cn(
                  'group relative h-[88px] w-full overflow-hidden rounded-[42px] transition-all duration-500',
                  isSubmitting || isLoadingLatest || isCheckingDuplicate || !validation.isValid
                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-slate-900 text-white shadow-[0_45px_100px_-25px_rgba(0,0,0,0.4)] hover:scale-[1.01] active:scale-[0.98]'
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] opacity-0 transition-opacity duration-700 group-hover:opacity-100 animate-shimmer" />
                <span className="relative z-10 flex items-center justify-center gap-6 text-[20px] font-black uppercase tracking-[8px]">
                  {isSubmitting ? (
                    <>
                      Đang ghi nhận <Spinner className="h-8 w-8 border-white/30" />
                    </>
                  ) : (
                    <>
                      Lưu chỉ số mới <CheckCircle size={32} />
                    </>
                  )}
                </span>
              </button>
              <p className="text-center text-[10px] font-black uppercase tracking-[2px] text-slate-300">
                Biểu mẫu chỉ cho phép lưu khi kỳ, chỉ số và mức tiêu thụ đều hợp lệ.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
