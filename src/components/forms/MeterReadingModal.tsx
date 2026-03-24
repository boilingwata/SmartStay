import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, Zap, Droplets, Calendar, 
  History, TrendingUp, AlertCircle, 
  CheckCircle, Camera, Upload, 
  ArrowRight, Info
} from 'lucide-react';
import { cn } from '@/utils';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReadingFormData>({
    defaultValues: {
      monthYear: new Date().toISOString().slice(0, 7), // YYYY-MM
      readingDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    }
  });

  const currentIndex = watch('currentIndex');
  const previousIndex = latestReading?.currentIndex || 0;
  const consumption = currentIndex ? (currentIndex - previousIndex) : 0;
  const isError = currentIndex && currentIndex < previousIndex;

  const [isDuplicate, setIsDuplicate] = useState(false);
  const selectedMonthYear = watch('monthYear');

  // 5.6.7 Duplicate reading warning
  useEffect(() => {
     if (meter?.id && selectedMonthYear) {
        // In a real app, this would be an API call: GET /api/meter-readings?meterId=X&monthYear=Y
        // Mocking the check
        if (selectedMonthYear === '2026-03') { 
           setIsDuplicate(true);
        } else {
           setIsDuplicate(false);
        }
     }
  }, [meter, selectedMonthYear]);

  // 5.2 Pre-fetch PreviousIndex (RULE-01)
  useEffect(() => {
    if (isOpen && meter?.id) {
       const fetchLatest = async () => {
          setIsLoadingLatest(true);
          try {
             const data = await meterService.getLatestReading(meter.id);
             setLatestReading(data);
          } catch (err) {
             console.error("Failed to fetch latest reading", err);
          } finally {
             setIsLoadingLatest(false);
          }
       };
       fetchLatest();
    }
  }, [isOpen, meter]);

  const onFormSubmit = async (data: ReadingFormData) => {
    if (!meter) return;
    if (isDuplicate) {
       toast.warning("Bạn đang ghi chồng chỉ số đã tồn tại.");
    }
    if (isError) {
       toast.error(`Chỉ số hiện tại (${currentIndex}) không được nhỏ hơn chỉ số kỳ trước (${previousIndex})`);
       return;
    }

    setIsSubmitting(true);
    try {
       await meterService.submitReading({
          meterId: meter.id,
          monthYear: data.monthYear,
          readingDate: data.readingDate,
          currentIndex: data.currentIndex,
          note: data.note
       });
       toast.success(`Đã ghi nhận chỉ số cho ${meter.meterCode}`);
       onSuccess();
       onClose();
    } catch (err) {
       toast.error("Lỗi khi gửi chỉ số. Vui lòng thử lại.");
    } finally {
       setIsSubmitting(false);
    }
  };

  if (!isOpen || !meter) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white rounded-[44px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
         <div className="p-8 md:p-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-inner",
                    meter.meterType === 'Electricity' ? "bg-amber-100 border-amber-200 text-amber-600" : "bg-blue-100 border-blue-200 text-blue-600"
                  )}>
                     {meter.meterType === 'Electricity' ? <Zap size={28} fill="currentColor" /> : <Droplets size={28} fill="currentColor" />}
                  </div>
                  <div>
                     <h2 className="text-[28px] font-black leading-tight tracking-tighter text-slate-900">Ghi chỉ số {meter.meterType === 'Electricity' ? 'Điện' : 'Nước'}</h2>
                     <p className="text-[13px] font-black uppercase tracking-[2px] text-muted">Mã ĐH: {meter.meterCode} • Phòng {meter.roomCode}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-3 hover:bg-bg rounded-2xl transition-all text-muted"><X size={24} /></button>
            </div>

            {/* Reading Command Center */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <Select 
                       label="Kỳ tháng ghi số"
                       placeholder="Chọn tháng"
                       icon={Calendar}
                       options={[
                         { label: 'Tháng 03/2026', value: '2026-03' },
                         { label: 'Tháng 02/2026', value: '2026-02' },
                         { label: 'Tháng 01/2026', value: '2026-01' },
                       ]}
                       value={selectedMonthYear}
                       onChange={(val) => setValue('monthYear', val)}
                     />

                     <div className="space-y-2">
                        <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Ngày ghi nhận</label>
                        <div className="relative group">
                           <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                           <input 
                             type="date" 
                             {...register('readingDate', { required: true })}
                             className="input-base pl-12 h-14"
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Chỉ số kỳ trước (RULE-01)</label>
                        <div className="h-14 bg-slate-900/5 rounded-[20px] flex items-center px-6 border border-slate-100">
                           <span className="text-[20px] font-black font-mono text-slate-400">
                              {isLoadingLatest ? '...' : previousIndex.toLocaleString()}
                           </span>
                           <span className="ml-auto text-[10px] font-black uppercase text-slate-400 tracking-tighter">Chỉ số chốt kỳ trước</span>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Chỉ số hiện tại</label>
                        <div className="relative group">
                           <input 
                             type="number" 
                             autoFocus
                             {...register('currentIndex', { required: true, min: 0 })}
                             className={cn(
                                "input-base h-14 pl-6 text-[24px] font-black font-mono tracking-tighter",
                                isError ? "border-danger text-danger bg-danger/5" : "text-primary"
                             )}
                             placeholder="000.00"
                           />
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase text-muted tracking-widest">{meter.meterType === 'Electricity' ? 'kWh' : 'm3'}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Result Summary */}
               <div className={cn(
                  "p-6 rounded-[28px] flex items-center justify-between transition-all",
                  isError ? "bg-danger/10 text-danger border border-danger/20" : 
                  isDuplicate ? "bg-amber-100 text-amber-700 border border-amber-200" :
                  "bg-primary/5 text-primary border border-primary/20"
               )}>
                  <div className="flex items-center gap-4">
                     <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", 
                        isError ? "bg-danger/20" : 
                        isDuplicate ? "bg-amber-500/20" : "bg-primary/20"
                     )}>
                        {isError ? <AlertCircle size={20} /> : isDuplicate ? <Info size={20} /> : <TrendingUp size={20} />}
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Lượng tiêu thụ (kWh/m3)</p>
                        <p className="text-[20px] font-black tracking-tighter">{consumption.toLocaleString()}</p>
                     </div>
                  </div>
                  {isError ? (
                     <p className="text-[11px] font-black uppercase tracking-tighter italic mr-4 animate-bounce">Lỗi: Thấp hơn kỳ trước!</p>
                  ) : isDuplicate ? (
                     <div className="flex flex-col items-end">
                        <p className="text-[11px] font-black uppercase tracking-tighter text-amber-600">Cảnh báo: Đã có chỉ số kỳ này</p>
                        <p className="text-[8px] font-bold uppercase opacity-60">Vẫn có thể ghi đè</p>
                     </div>
                  ) : consumption > 0 && (
                     <CheckCircle size={24} className="text-primary animate-in zoom-in-0 duration-500" />
                  )}
               </div>

               {/* Additional Fields */}
               <div className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Ghi chú (Tùy chọn)</label>
                     <textarea 
                       {...register('note')}
                       className="input-base p-6 min-h-[100px] bg-slate-50 border-none italic font-medium"
                       placeholder="Tình trạng đồng hồ, sự cố phát hiện..."
                     />
                  </div>

                  {/* Photo Upload Placeholder */}
                  <div className="p-6 border-2 border-dashed border-slate-200 rounded-[32px] bg-white flex items-center gap-6 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
                     <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                        <Camera size={24} />
                     </div>
                     <div className="flex-1">
                        <p className="text-[13px] font-black uppercase text-primary tracking-wider">Chụp ảnh đồng hồ</p>
                        <p className="text-[11px] text-muted font-medium">Xác nhận bằng hình ảnh minh bạch (Max 5MB)</p>
                     </div>
                     <Upload size={20} className="text-muted group-hover:text-primary transition-colors" />
                  </div>
               </div>

               {/* Form Actions */}
               <div className="pt-8">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isError || isLoadingLatest}
                    className={cn(
                      "btn-primary w-full h-[72px] rounded-[32px] flex items-center justify-center gap-4 shadow-2xl shadow-primary/20 transition-all text-[18px]",
                      (isError || isSubmitting) ? "opacity-50 grayscale cursor-not-allowed" : "active:scale-[0.98] hover:shadow-primary/30"
                    )}
                  >
                     {isSubmitting ? <Spinner className="w-8 h-8 border-white/30" /> : (
                        <>
                           <span className="font-black uppercase tracking-[6px]">Lưu chỉ số</span>
                           <CheckCircle size={24} />
                        </>
                     )}
                  </button>
               </div>
            </form>
         </div>
      </div>
   </div>
  );
};
