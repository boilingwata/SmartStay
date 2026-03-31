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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReadingFormData>({
    defaultValues: {
      monthYear: new Date().toISOString().slice(0, 7),
      readingDate: new Date().toISOString().slice(0, 10),
    }
  });

  const currentIndex = watch('currentIndex');
  const previousIndex = latestReading?.currentIndex || 0;
  const consumption = currentIndex ? (Number(currentIndex) - previousIndex) : 0;
  const isError = currentIndex && Number(currentIndex) < previousIndex;

  const [isDuplicate, setIsDuplicate] = useState(false);
  const selectedMonthYear = watch('monthYear');

  // Dynamic month generation
  const monthOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const val = d.toISOString().slice(0, 7);
    const label = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
    return { label, value: val };
  });

  // Real-time duplicate reading check
  useEffect(() => {
     if (meter?.id && selectedMonthYear) {
        const checkDuplicate = async () => {
           try {
              const res = await meterService.getReadings({ 
                 meterId: meter.id, 
                 monthYear: selectedMonthYear,
                 limit: 1 
              });
              setIsDuplicate(res.data.length > 0);
           } catch (e) {
              setIsDuplicate(false);
           }
        };
        checkDuplicate();
     }
  }, [meter, selectedMonthYear]);

  // Pre-fetch Latest Reading (RULE-01)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
        toast.info("Đã chọn ảnh đồng hồ để gửi.");
     }
  };

  const onFormSubmit = async (data: ReadingFormData) => {
    if (!meter) return;
    if (isError) {
       toast.error(`Chỉ số hiện tại (${currentIndex}) không hợp lệ.`);
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
          readingImageUrl: previewImage || undefined // Simulation of real upload
       });
       toast.success(`Ghi nhận hoàn tất cho ${meter.meterCode}`);
       onSuccess();
       onClose();
    } catch (err) {
       toast.error("Lỗi khi gửi dữ liệu.");
    } finally {
       setIsSubmitting(false);
    }
  };

  if (!isOpen || !meter) return null;

  const isElec = meter.meterType === 'Electricity';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white/70 backdrop-blur-3xl rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white overflow-hidden animate-in zoom-in-95 duration-700">
         <div className="p-10 md:p-14">
            {/* High-Fidelity Header */}
            <div className="flex items-start justify-between mb-12">
               <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-20 h-20 rounded-[32px] flex items-center justify-center border border-white shadow-2xl transition-all animate-float",
                    isElec ? "bg-amber-400 text-white shadow-amber-400/30" : "bg-blue-500 text-white shadow-blue-500/30"
                  )}>
                     {isElec ? <Zap size={40} fill="currentColor" /> : <Droplets size={40} fill="currentColor" />}
                  </div>
                  <div>
                     <h2 className="text-[36px] font-black leading-none tracking-tighter text-slate-900 mb-2">Ghi chỉ số {isElec ? 'Điện' : 'Nước'}</h2>
                     <p className="text-[14px] font-bold uppercase tracking-[4px] text-slate-400">ID: {meter.meterCode} • <span className="text-primary italic">Unit {meter.roomCode}</span></p>
                  </div>
               </div>
               <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-danger hover:text-white rounded-2xl transition-all active:scale-90 text-slate-400"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-10">
               {/* Information Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <Select 
                       label="Tháng chốt kỳ"
                       placeholder="Chọn kỳ hóa đơn"
                       icon={Calendar}
                       options={monthOptions}
                       value={selectedMonthYear}
                       onChange={(val) => setValue('monthYear', val)}
                     />

                     <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-[2px] ml-1">Ngày cập nhật</label>
                        <div className="relative group">
                           <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                           <input type="date" {...register('readingDate')} className="input-base h-16 pl-14 bg-slate-50 border-none font-bold" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-[2px] ml-1">Số cũ (Rule-01 Ref)</label>
                        <div className="h-16 bg-slate-100/50 rounded-3xl flex items-center px-6 border border-white shadow-inner">
                           <span className="text-[22px] font-black font-mono text-slate-400 tracking-tighter">
                              {isLoadingLatest ? '...' : previousIndex.toLocaleString()}
                           </span>
                           <span className="ml-auto text-[9px] font-black uppercase text-slate-300 tracking-widest">{isElec ? 'kWh' : 'm3'}</span>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className={cn("text-[11px] font-black uppercase tracking-[2px] ml-1", isError ? "text-danger" : "text-primary")}>Chỉ số mới nhất</label>
                        <div className={cn(
                          "relative h-16 rounded-3xl border-2 transition-all group flex items-center px-6",
                          isError ? "border-danger bg-danger/5" : "border-slate-100 bg-white shadow-xl focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"
                        )}>
                           <input 
                              type="number"
                              step="any"
                              autoFocus 
                              {...register('currentIndex', { required: true })}
                              className={cn(
                                "w-full bg-transparent text-[28px] font-black font-mono tracking-tighter outline-none leading-none",
                                isError ? "text-danger" : "text-slate-900"
                              )}
                              placeholder="000.0"
                           />
                           <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none shrink-0 group-focus-within:bg-primary transition-colors">
                              {isElec ? 'kWh' : 'm3'}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Result Glass Card */}
               <div className={cn(
                  "relative group p-8 rounded-[40px] border transition-all duration-500 flex items-center justify-between overflow-hidden",
                  isError ? "bg-danger/10 border-danger/20 text-danger shadow-[0_20px_40px_-15px_rgba(239,68,68,0.2)]" :
                  isDuplicate ? "bg-amber-400/10 border-amber-400/20 text-amber-600 shadow-xl shadow-amber-400/5" :
                  "bg-primary/5 border-primary/20 text-primary shadow-xl shadow-primary/5"
               )}>
                  <div className="relative z-10 flex items-center gap-6">
                     <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:rotate-12", 
                        isError ? "bg-danger/20" : isDuplicate ? "bg-amber-400/20" : "bg-primary/20"
                     )}>
                        {isError ? <AlertCircle size={32} /> : isDuplicate ? <Info size={32} /> : <TrendingUp size={32} />}
                     </div>
                     <div>
                        <p className="text-[11px] font-black uppercase tracking-[3px] opacity-60 mb-1">Tiêu thụ trong kỳ</p>
                        <div className="flex items-baseline gap-2">
                           <span className="text-[36px] font-black tracking-tighter leading-none">{consumption.toLocaleString()}</span>
                           <span className="text-[12px] font-black uppercase tracking-widest">{isElec ? 'kWh' : 'm3'}</span>
                        </div>
                     </div>
                  </div>

                  <div className="relative z-10 text-right">
                     {isError ? (
                        <p className="text-[12px] font-black uppercase tracking-tight italic animate-pulse">Lỗi: Thấp hơn kỳ trước!</p>
                     ) : isDuplicate ? (
                        <div className="flex flex-col items-end">
                           <p className="text-[12px] font-black uppercase tracking-tight text-amber-500">Đã chốt tháng {selectedMonthYear}</p>
                           <p className="text-[9px] font-bold uppercase opacity-60">Sẽ thực hiện Ghi đè</p>
                        </div>
                     ) : (
                        consumption > 0 && <CheckCircle size={44} className="text-primary animate-in zoom-in-0 duration-700 opacity-30" />
                     )}
                  </div>
                  
                  {/* Glass Backdrop Accent */}
                  {!isError && <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl rounded-full translate-x-10 -translate-y-10" />}
               </div>

               {/* Actions & Notes Entry */}
               <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  <div className="md:col-span-3 space-y-2">
                     <label className="text-[11px] text-slate-400 font-black uppercase tracking-[2px] ml-1">Ghi chú vận hành</label>
                     <textarea 
                        {...register('note')}
                        className="input-base p-6 min-h-[148px] bg-slate-50 border-none rounded-3xl italic font-medium text-[14px] text-slate-500 focus:bg-white transition-colors"
                        placeholder="Có sự cố gì không? (Tùy chọn)..."
                     />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[11px] text-slate-400 font-black uppercase tracking-[2px] ml-1">Hình ảnh đối chiếu</label>
                     <div className="relative group min-h-[148px]">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                        <div className={cn(
                           "absolute inset-0 border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-3 transition-all",
                           previewImage ? "border-primary bg-primary/[0.02]" : "border-slate-200 bg-white group-hover:border-primary/40 group-hover:bg-primary/5"
                        )}>
                           {previewImage ? (
                              <div className="relative w-full h-full p-2">
                                 <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                    <Camera size={24} className="text-white" />
                                 </div>
                              </div>
                           ) : (
                              <>
                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors border border-slate-100"><Camera size={24} /></div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Tải ảnh lên<br/>(Max 5MB)</p>
                              </>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

               {/* Premium Submit Button */}
               <div className="pt-4 flex flex-col gap-6">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isError || isLoadingLatest}
                    className={cn(
                      "group relative w-full h-[88px] rounded-[42px] overflow-hidden transition-all duration-500",
                      (isError || isSubmitting) 
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                        : "bg-slate-900 text-white hover:scale-[1.01] active:scale-[0.98] shadow-[0_45px_100px_-25px_rgba(0,0,0,0.4)]"
                    )}
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                     <span className="relative z-10 text-[20px] font-black uppercase tracking-[8px] flex items-center justify-center gap-6">
                        {isSubmitting ? (
                          <>Đang ghi nhận <Spinner className="w-8 h-8 border-white/30" /></>
                        ) : (
                          <>Lưu chỉ số mới <CheckCircle size={32} /></>
                        )}
                     </span>
                  </button>
                  <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[2px]">Tất cả giao dịch được mã hóa và chốt chính xác theo Rule-01</p>
               </div>
            </form>
         </div>
      </div>
   </div>
  );
};
