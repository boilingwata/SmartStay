import React, { useState, useEffect } from 'react';
import { 
  Building, Zap, Droplets, Calendar, 
  ArrowRight, CheckCircle, ChevronLeft, 
  Database, Info, AlertCircle, Trash2, 
  Search, Clipboard, Keyboard, Upload
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { meterService } from '@/services/meterService';
import { buildingService } from '@/services/buildingService';
import { Meter, MeterType } from '@/models/Meter';
import { cn } from '@/utils';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Feedback';
import { toast } from 'sonner';

import useUIStore from '@/stores/uiStore';

interface BulkMeterEntryLocationState {
  buildingId?: string;
  roomId?: string;
  monthYear?: string;
  from?: string;
}

const BulkMeterEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const locationState = (location.state as BulkMeterEntryLocationState | null) ?? null;
  const [step, setStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [buildingId, setBuildingId] = useState(
    locationState?.buildingId ?? (activeBuildingId ? String(activeBuildingId) : '')
  );
  const [roomId] = useState(locationState?.roomId ?? '');
  const returnPath = locationState?.from ?? '/admin/meters';

  const [meterType, setMeterType] = useState<MeterType>('Electricity');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset page when filters change
  useEffect(() => {
     setCurrentPage(1);
  }, [buildingId, meterType, roomId]);

  const [monthYear, setMonthYear] = useState(locationState?.monthYear ?? new Date().toISOString().substring(0, 7));
  const [readingDate, setReadingDate] = useState(new Date().toISOString().substring(0, 10));
  const [missingOnly, setMissingOnly] = useState(false);

  // Step 2 Data
  const [readings, setReadings] = useState<Record<string, { current: string; note: string; prev: number }>>({});
  
  // Queries
  const { data: meters, isLoading: isLoadingMeters } = useQuery({
    queryKey: ['meters-bulk', buildingId, roomId, meterType, missingOnly],
    queryFn: () => meterService.getMeters({
      buildingId: buildingId || undefined,
      roomId: roomId || undefined,
      type: meterType,
      status: 'Active',
      missingOnly,
    }),
    enabled: step >= 2
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings(),
    staleTime: 10 * 60 * 1000,
  });

  // Step 2 Initial Data Sync (RULE-01: Must fetch LatestIndex from View)
  const [isFetchingPrev, setIsFetchingPrev] = useState(false);
  
  useEffect(() => {
     if (step === 2 && meters?.data?.length) {
        const fetchAllLatest = async () => {
           setIsFetchingPrev(true);
           const initial: typeof readings = {};
           
           try {
              // RULE-01: Fetch from view for each meter to be 100% compliant
              await Promise.all(meters.data.map(async (m: Meter) => {
                 try {
                    const latest = await meterService.getLatestReading(m.id);
                    initial[m.id] = { current: '', note: '', prev: latest.currentIndex || 0 };
                 } catch (e) {
                    initial[m.id] = { current: '', note: '', prev: 0 };
                 }
              }));
              setReadings(initial);
           } finally {
              setIsFetchingPrev(false);
           }
        };
        fetchAllLatest();
     }
  }, [step, meters]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // 5.3.3 Bulk Keyboard Nav & Paste support
  const handleReadingChange = (id: string, value: string) => {
     setReadings(prev => ({
        ...prev,
        [id]: { ...prev[id], current: value }
     }));
  };

  const handlePaste = (e: React.ClipboardEvent, startId: string) => {
     e.preventDefault();
     const text = e.clipboardData.getData('text');
     const rows = text.split(/\r?\n/).filter(r => r.trim());
     if (!meters) return;

     const meterIds = (meters?.data || []).map((m: Meter) => m.id);
     const startIndex = meterIds.indexOf(startId);
     const newReadings = { ...readings };

     rows.forEach((row, i) => {
        const index = startIndex + i;
        if (index < meterIds.length) {
           const id = meterIds[index];
           const val = row.trim().split('\t')[0]; // Take first column if tab-separated
           newReadings[id] = { ...newReadings[id], current: val };
        }
     });

     setReadings(newReadings);
     toast.success(`Đã dán ${rows.length} chỉ số từ bộ nhớ tạm`);
  };

  const calculateStats = () => {
     if (!meters?.data) return { valid: 0, error: 0, pending: 0 };
     let valid = 0, error = 0, pending = 0;
     meters.data.forEach((m: Meter) => {
        const r = readings[m.id];
        if (!r?.current) pending++;
        else if (Number(r.current) < r.prev) error++;
        else valid++;
     });
     return { valid, error, pending };
  };

  const stats = calculateStats();
  const paginatedMeters = meters?.data?.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];
  const totalPages = Math.ceil((meters?.data?.length || 0) / pageSize);

  const handleSubmitReadings = async () => {
    if (isSubmitting) return;

    const validEntries = (meters?.data ?? [])
      .map((meter: Meter) => ({ meter, reading: readings[meter.id] }))
      .filter(({ reading }) => reading?.current !== '' && Number(reading.current) >= reading.prev);

    if (validEntries.length === 0) {
      toast.error('Chưa có chỉ số hợp lệ để lưu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const results = await Promise.allSettled(
        validEntries.map(({ meter, reading }) =>
          meterService.submitReading({
            meterId: meter.id,
            monthYear,
            currentIndex: Number(reading.current),
            readingDate,
            note: reading.note,
          })
        )
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;
      const successCount = results.length - failedCount;

      if (failedCount > 0) {
        toast.error(`Đã lưu ${successCount} chỉ số, nhưng còn ${failedCount} dòng lỗi. Vui lòng kiểm tra lại.`);
        return;
      }

      toast.success(`Đã lưu ${successCount} chỉ số thành công.`);
      navigate(returnPath, { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
       {/* Enhanced Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/10">
          <div className="flex items-center gap-6">
             <button
               onClick={() => navigate(returnPath)}
               className="group w-14 h-14 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center text-muted hover:text-primary hover:scale-110 active:scale-90 transition-all border border-slate-50"
             >
                <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
             </button>
             <div>
                <h1 className="text-[44px] font-black leading-none tracking-tighter text-slate-900 mb-2">Ghi chỉ số</h1>
                <div className="flex items-center gap-3">
                   <p className={cn("text-[11px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full", step === 1 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>1. Thiết lập</p>
                   <ArrowRight size={12} className="text-slate-300" />
                   <p className={cn("text-[11px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full", step === 2 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>2. Nhập liệu</p>
                   <ArrowRight size={12} className="text-slate-300" />
                   <p className={cn("text-[11px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full", step === 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>3. Hoàn tất</p>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[24px] border border-white shadow-xl shadow-slate-200/20">
             <div className={cn("px-6 h-12 rounded-2xl flex items-center gap-3 transition-all", stats.error > 0 ? "bg-danger text-white shadow-lg shadow-danger/20" : "bg-slate-50 text-slate-400")}>
                <AlertCircle size={18} />
                <span className="text-[12px] font-bold uppercase tracking-widest">{stats.error} Lỗi</span>
             </div>
             <div className="bg-primary/5 text-primary px-6 h-12 rounded-2xl flex items-center gap-3 border border-primary/10">
                <CheckCircle size={18} />
                <span className="text-[12px] font-bold uppercase tracking-widest">{stats.valid} Hợp lệ</span>
             </div>
          </div>
       </div>

       {/* Step 1: Configuration - Clean & Centered */}
       {step === 1 && (
         <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3 card-premium p-10 bg-white shadow-2xl shadow-primary/5 border border-white relative overflow-hidden">
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary"><Database size={24} /></div>
                     <h2 className="text-[28px] font-black text-slate-800 tracking-tighter">Cấu hình đợt ghi số</h2>
                  </div>

                  <div className="grid gap-6">
                      <SelectAsync
                         label="Tòa nhà"
                         placeholder="Chọn tòa nhà để bắt đầu"
                         icon={Building}
                         value={buildingId}
                         loadOptions={async () => buildings.map((building) => ({
                           label: building.buildingName,
                           value: String(building.id),
                         }))}
                         onChange={setBuildingId}
                      />

                      <Select 
                         label="Loại đồng hồ"
                         placeholder="Chọn loại"
                         icon={meterType === 'Electricity' ? Zap : Droplets}
                         options={[
                           { label: '⚡️ Điện (Electricity)', value: 'Electricity', icon: Zap },
                           { label: '💧 Nước (Water)', value: 'Water', icon: Droplets }
                         ]}
                         value={meterType}
                         onChange={(val) => setMeterType(val as any)}
                      />

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] text-muted font-black uppercase tracking-[2px] ml-1">Kỳ hóa đơn</label>
                            <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} className="input-base h-12 bg-slate-50 border-none font-black text-slate-700" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] text-muted font-black uppercase tracking-[2px] ml-1">Ngày ghi số</label>
                            <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className="input-base h-12 bg-slate-50 border-none font-black text-slate-700" />
                         </div>
                      </div>

                      <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-border/5 group hover:bg-white hover:border-primary/20 transition-all cursor-pointer">
                         <input 
                           type="checkbox" 
                           id="missingOnly"
                           checked={missingOnly}
                           onChange={(e) => setMissingOnly(e.target.checked)}
                           className="w-6 h-6 rounded-lg accent-primary cursor-pointer border-slate-200" 
                         />
                         <label htmlFor="missingOnly" className="text-[13px] font-bold text-slate-600 cursor-pointer select-none">Chỉ hiển thị những phòng đang thiếu chỉ số tháng này</label>
                      </div>
                  </div>

                  <button 
                    onClick={handleNext}
                    className="group relative w-full h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center gap-4 overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <span className="relative z-10 text-[16px] font-black uppercase tracking-[4px]">Bắt đầu nhập liệu</span>
                     <ArrowRight size={20} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
               
               {/* Aesthetic Background Element */}
               <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none rotate-12">
                  <Database size={300} />
               </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
               <div className="p-10 rounded-[40px] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-[3px] text-primary bg-primary/20 px-3 py-1 rounded-full mb-6 inline-block">Pro Tips</span>
                  <div className="space-y-8">
                     <div className="flex gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5"><Keyboard size={24} /></div>
                        <div>
                           <p className="font-bold text-[14px] mb-1">Điều hướng nhanh</p>
                           <p className="text-[12px] text-slate-400 leading-relaxed">Nhấn Enter sau khi nhập xong để di chuyển tới phòng kế tiếp ngay lập tức.</p>
                        </div>
                     </div>
                     <div className="flex gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5"><Clipboard size={24} /></div>
                        <div>
                           <p className="font-bold text-[14px] mb-1">Dán từ Excel</p>
                           <p className="text-[12px] text-slate-400 leading-relaxed">Sao chép cột số liệu từ bảng Excel và dán trực tiếp vào ô nhập chỉ số của phòng đầu tiên.</p>
                        </div>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Zap size={100} />
                  </div>
               </div>

               <div className="p-8 rounded-[40px] bg-white border border-border/10 shadow-lg flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:border-primary/20 transition-all">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Upload size={28} /></div>
                  <div>
                     <p className="text-[14px] font-black uppercase tracking-wider text-slate-800">Tải lên File Excel mẫu</p>
                     <p className="text-[11px] text-muted font-medium">Click để chọn file hoặc kéo thả vào đây</p>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* Step 2: Modern Glass Data Entry Table */}
       {step === 2 && (
         <div className="space-y-6 animate-in zoom-in-95 duration-500">
            {/* Completion Progress */}
            <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white shadow-xl shadow-slate-200/20">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Database size={20} /></div>
                     <p className="text-[15px] font-black text-slate-800 tracking-tight">Tiến độ cập nhật chỉ số</p>
                  </div>
                  <p className="text-[13px] font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                     {Math.round(((stats.valid + stats.error) / (meters?.data?.length || 1)) * 100)}% Hoàn tất
                  </p>
               </div>
               <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-shimmer rounded-full transition-all duration-1000" 
                    style={{ width: `${((stats.valid + stats.error) / (meters?.data?.length || 1)) * 100}%` }}
                  />
               </div>
            </div>

            <div className="card-premium overflow-hidden bg-white/70 backdrop-blur-xl border-white shadow-2xl">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-md">
                        <tr className="border-b border-slate-100">
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Mã ĐH / Phòng</th>
                           <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Số cũ</th>
                           <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[3px] text-primary bg-primary/[0.02]">Số hiện tại (Mới)</th>
                           <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Tiêu thụ</th>
                           <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Trạng thái</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[3px] text-slate-500">Ghi chú</th>
                        </tr>
                      </thead>
                     <tbody className="divide-y divide-slate-50">
                        {isLoadingMeters || isFetchingPrev ? (
                           Array.from({ length: 10 }).map((_, i) => (
                             <tr key={i}>
                                <td className="px-8 py-8"><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-3 w-20" /></td>
                                <td className="px-6 py-8"><Skeleton className="h-6 w-16" /></td>
                                <td className="px-6 py-8 bg-slate-50/50"><Skeleton className="h-10 w-full rounded-xl" /></td>
                                <td className="px-6 py-8"><Skeleton className="h-6 w-16" /></td>
                                <td className="px-6 py-8"><Skeleton className="h-6 w-12 rounded-full" /></td>
                                <td className="px-8 py-8"><Skeleton className="h-10 w-full rounded-xl" /></td>
                             </tr>
                           ))
                        ) : paginatedMeters.map((m: Meter) => {
                           const r = readings[m.id];
                           if (!r) return null;
                           
                           const currentVal = Number(r.current);
                           const isErr = r.current !== '' && currentVal < r.prev;
                           const consumption = r.current !== '' ? currentVal - r.prev : 0;
                           const isFilled = r.current !== '';

                           return (
                              <tr key={m.id} className={cn("group transition-all duration-300", isErr ? "bg-danger/[0.02]" : isFilled ? "bg-success-bg/[0.01]" : "hover:bg-slate-50/50")}>
                                 <td className="px-8 py-6">
                                    <div className="flex flex-col gap-1">
                                       <span className="font-mono text-[14px] font-black text-slate-800 leading-none">{m.meterCode}</span>
                                       <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Unit {m.roomCode}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-6">
                                    <div className="inline-flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-slate-900/[0.03] border border-slate-900/5">
                                       <span className="font-mono text-[13px] font-bold text-slate-500">{r.prev.toLocaleString()}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-6 bg-primary/[0.01] shrink-0 relative focus-within:bg-white transition-colors">
                                    <div className={cn(
                                       "relative flex items-center h-16 px-4 rounded-2xl border-2 transition-all",
                                       isErr ? "border-danger bg-danger/5" : isFilled ? "border-primary bg-white shadow-lg shadow-primary/5" : "border-slate-100 bg-white"
                                    )}>
                                       <input 
                                         type="number" 
                                         value={r.current}
                                         onChange={(e) => handleReadingChange(m.id, e.target.value)}
                                         onPaste={(e) => handlePaste(e, m.id)}
                                         onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                               const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
                                               const idx = inputs.indexOf(e.currentTarget);
                                               if (idx < inputs.length - 1) (inputs[idx+1] as HTMLInputElement).focus();
                                            }
                                         }}
                                         className={cn(
                                           "w-full bg-transparent text-[22px] font-black font-mono outline-none tracking-tighter transition-all placeholder:text-slate-200",
                                           isErr ? "text-danger" : "text-slate-900"
                                         )}
                                         placeholder="0.0"
                                       />
                                       {isFilled && !isErr && <CheckCircle size={18} className="text-success-text shrink-0" />}
                                       {isErr && <AlertCircle size={20} className="text-danger animate-pulse shrink-0" />}
                                    </div>
                                 </td>
                                 <td className="px-6 py-6">
                                    {isFilled ? (
                                       <div className={cn("text-[15px] font-black font-mono", isErr ? "text-danger" : "text-slate-700")}>
                                          +{consumption.toLocaleString()}
                                       </div>
                                    ) : (
                                       <span className="text-slate-200">--</span>
                                    )}
                                 </td>
                                 <td className="px-6 py-6">
                                    {isFilled ? (
                                       isErr ? (
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/10 text-danger text-[9px] font-black uppercase tracking-widest">
                                             <AlertCircle size={12} /> Lỗi số cũ
                                          </div>
                                       ) : (
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-bg/10 text-success-text text-[9px] font-black uppercase tracking-widest">
                                             <CheckCircle size={12} /> Hợp lệ
                                          </div>
                                       )
                                    ) : (
                                       <div className="px-3 py-1.5 rounded-full bg-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">Trống</div>
                                    )}
                                 </td>
                                 <td className="px-8 py-6">
                                    <input 
                                      type="text" 
                                      value={r.note}
                                      onChange={(e) => setReadings(prev => ({ ...prev, [m.id]: { ...prev[m.id], note: e.target.value }}))}
                                      placeholder="Ghi chú..." 
                                      className="input-base bg-transparent border-none h-10 text-[12px] font-medium italic text-slate-400 focus:text-slate-900 focus:bg-slate-50 rounded-xl transition-all"
                                    />
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
               
               {/* Pagination UI - Cleanest Style */}
               {totalPages > 1 && (
                  <div className="p-6 bg-slate-50 flex items-center justify-between">
                     <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Hiển thị {(currentPage-1)*pageSize+1} - {Math.min(currentPage*pageSize, meters?.data?.length || 0)} trong số {meters?.data?.length} bản ghi</p>
                     <div className="flex items-center gap-3">
                        <button 
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(prev => prev - 1)}
                           className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm disabled:opacity-30 border border-slate-100 hover:scale-110 active:scale-90 transition-all"
                        >
                           <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                           {Array.from({ length: totalPages }).map((_, i) => (
                              <button 
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={cn(
                                   "w-10 h-10 rounded-2xl font-black text-[12px] transition-all",
                                   currentPage === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-slate-400 hover:bg-slate-50"
                                )}
                              >
                                 {i + 1}
                              </button>
                           ))}
                        </div>
                        <button 
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(prev => prev + 1)}
                           className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm disabled:opacity-30 border border-slate-100 hover:scale-110 active:scale-90 transition-all"
                        >
                           <ChevronLeft size={18} className="rotate-180" />
                        </button>
                     </div>
                  </div>
               )}
            </div>

            <div className="flex items-center justify-between pt-6">
               <button onClick={handleBack} className="flex h-12 px-8 items-center gap-3 text-[12px] font-black uppercase tracking-[3px] text-slate-400 hover:text-slate-900 transition-all">
                  <ChevronLeft size={20} /> Quay lại cấu hình
               </button>
               <button 
                 onClick={handleNext}
                 disabled={stats.error > 0 || stats.valid === 0}
                 className={cn(
                   "group relative px-14 h-20 rounded-[32px] overflow-hidden transition-all",
                   (stats.error > 0 || stats.valid === 0) 
                     ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                     : "bg-slate-900 text-white hover:scale-[1.03] active:scale-[0.98] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]"
                 )}
               >
                  {! (stats.error > 0 || stats.valid === 0) && <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                  <span className="relative z-10 text-[18px] font-black uppercase tracking-[5px] flex items-center gap-4">
                     Tiếp tục xác nhận <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </span>
               </button>
            </div>
         </div>
       )}

       {/* Step 3: Review & Final Submit - Ultra Premium Finish */}
       {step === 3 && (
         <div className="max-w-4xl mx-auto space-y-12 animate-in zoom-in-95 duration-500 py-10">
            <div className="text-center space-y-6">
               <div className="inline-flex w-32 h-32 rounded-[48px] bg-primary/5 flex items-center justify-center text-primary mb-6 animate-float relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-[48px] animate-ping opacity-20" />
                  <Database size={56} />
               </div>
               <h2 className="text-[56px] font-black text-slate-900 tracking-tighter leading-none">Kiểm tra & Hoàn tất</h2>
               <p className="text-[16px] text-slate-500 max-w-lg mx-auto font-medium">Bạn chuẩn bị cập nhật <span className="text-primary font-black underline decoration-primary/20">{stats.valid}</span> chỉ số <span className="text-slate-900 font-bold">{meterType === 'Electricity' ? 'Điện (Electric)' : 'Nước (Water)'}</span> của tháng {monthYear}.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="card-premium p-10 bg-white shadow-xl shadow-slate-200/20 border border-white flex flex-col items-center text-center group hover:scale-[1.02] transition-all">
                   <div className="w-16 h-16 rounded-3xl bg-success-bg/10 text-success-text flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform"><CheckCircle size={32} /></div>
                   <p className="text-[12px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Chỉ số hợp lệ</p>
                   <p className="text-[52px] font-black text-slate-900 leading-none">{stats.valid}</p>
                </div>
                <div className="card-premium p-10 bg-white shadow-xl shadow-slate-200/20 border border-white flex flex-col items-center text-center group hover:scale-[1.02] transition-all grayscale opacity-60">
                   <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-6 group-hover:-rotate-12 transition-transform"><Trash2 size={32} /></div>
                   <p className="text-[12px] font-black uppercase tracking-[3px] text-slate-400 mb-2">Bị bỏ qua (Lỗi/Trống)</p>
                   <p className="text-[52px] font-black text-slate-900 leading-none">{stats.error + stats.pending}</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
               <button
                 onClick={handleSubmitReadings}
                 disabled={isSubmitting}
                 className={cn(
                   "btn-primary w-full h-20 rounded-[36px] flex items-center justify-center gap-4 text-[20px] font-black uppercase tracking-[6px] shadow-2xl active:scale-[0.98] transition-all",
                   isSubmitting && "opacity-60 cursor-not-allowed"
                 )}
               >
                  {isSubmitting ? 'Đang lưu dữ liệu...' : 'Bắt đầu lưu dữ liệu'}
                  <CheckCircle size={32} />
               </button>
               <button onClick={handleBack} className="h-14 text-slate-400 font-black uppercase tracking-[4px] hover:text-slate-900 transition-all hover:scale-105 active:scale-95">Quay lại chỉnh sửa</button>
            </div>
         </div>
       )}
    </div>
  );
};

export default BulkMeterEntry;

