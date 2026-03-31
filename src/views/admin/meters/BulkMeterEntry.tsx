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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
       {/* Breadcrumbs & Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(returnPath)} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-muted hover:text-primary transition-all">
                <ChevronLeft size={24} />
             </button>
             <div>
                <h1 className="text-[36px] font-black leading-tight tracking-tighter text-slate-900">Ghi chỉ số hàng loạt</h1>
                <p className="text-small text-muted font-bold uppercase tracking-[2px]">Bước {step}/3 • {step === 1 ? 'Thiết lập' : step === 2 ? 'Nhập liệu' : 'Xác nhận'}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={cn("px-5 h-12 rounded-full flex items-center gap-3 transition-all", stats.error > 0 ? "bg-danger text-white scale-105" : "bg-bg text-muted border border-border/10")}>
                <AlertCircle size={18} />
                <span className="text-[11px] font-black uppercase tracking-widest">{stats.error} Lỗi dữ liệu</span>
             </div>
             <div className="bg-bg text-muted border border-border/10 px-5 h-12 rounded-full flex items-center gap-3">
                <CheckCircle size={18} className="text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest font-bold text-slate-700">{stats.valid} Hợp lệ</span>
             </div>
          </div>
       </div>

       {/* Step 1: Configuration */}
       {step === 1 && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="card-container p-12 bg-white/70 backdrop-blur-md border-border/10 shadow-2xl relative overflow-hidden">
               <h2 className="text-[28px] font-black text-slate-800 mb-8 tracking-tighter">1. Cấu hình kỳ ghi số</h2>
               <div className="space-y-6 relative z-10">
                   <SelectAsync 
                      label="Tòa nhà"
                      placeholder="Chọn tòa nhà"
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
                        { label: 'Điện (Electricity)', value: 'Electricity', icon: Zap },
                        { label: 'Nước (Water)', value: 'Water', icon: Droplets }
                      ]}
                      value={meterType}
                      onChange={(val) => setMeterType(val as any)}
                   />

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Tháng kỳ</label>
                         <input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} className="input-base h-14 bg-white font-black" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[11px] text-muted font-black uppercase tracking-[2px] ml-1">Ngày ghi</label>
                         <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} className="input-base h-14 bg-white font-black" />
                      </div>
                   </div>

                   <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <input 
                        type="checkbox" 
                        id="missingOnly"
                        checked={missingOnly}
                        onChange={(e) => setMissingOnly(e.target.checked)}
                        className="w-5 h-5 accent-primary cursor-pointer" 
                      />
                      <label htmlFor="missingOnly" className="text-small font-black text-primary cursor-pointer">Chỉ hiển thị phòng chưa có chỉ số tháng này</label>
                   </div>

                  <button 
                    onClick={handleNext}
                    className="btn-primary w-full h-16 rounded-[28px] flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-[16px] font-black uppercase tracking-[4px]"
                  >
                     Tiếp tục <ArrowRight size={20} />
                  </button>
               </div>
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <Database size={300} className="rotate-12" />
               </div>
            </div>

            <div className="space-y-8">
               <div className="card-container p-8 bg-slate-900 text-white relative h-fit overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 mb-4">Vibecoding Instructions</p>
                  <div className="space-y-6">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Keyboard size={20} /></div>
                        <p className="text-[14px] leading-relaxed font-medium">Sử dụng phím Enter để chuyển nhanh sang chỉ số của phòng kế tiếp.</p>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Clipboard size={20} /></div>
                        <p className="text-[14px] leading-relaxed font-medium">Bạn có thể dán trực tiếp dữ liệu từ Excel vào cột "Số hiện tại".</p>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><AlertCircle size={20} className="text-danger" /></div>
                        <p className="text-[14px] leading-relaxed font-medium text-slate-300">Dữ liệu có lỗi (Số mới &lt; số trước) sẽ hiển thị màu đỏ rực và bị chặn gửi.</p>
                     </div>
                  </div>
                  <Database size={200} className="absolute -bottom-20 -right-20 opacity-5 rotate-12" />
               </div>

               <div className="p-8 rounded-[40px] bg-bg/40 border-2 border-dashed border-border/30 border-spacing-4 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-primary"><Upload size={28} /></div>
                  <div>
                     <p className="text-[13px] font-black uppercase tracking-widest text-primary">Nhập từ file Excel / CSV</p>
                     <p className="text-[11px] text-muted font-medium">Hỗ trợ import số lượng lớn qua mẫu file chuẩn</p>
                  </div>
               </div>
            </div>
         </div>
       )}

       {/* Step 2: Data Entry Table */}
       {step === 2 && (
         <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="card-container overflow-hidden bg-white/60 border-border/10">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-[#1e293b] text-white font-black uppercase tracking-[3px] text-[10px]">
                        <tr>
                           <th className="px-8 py-6">Mã ĐH / Phòng</th>
                           <th className="px-6 py-6 border-l border-white/5 text-slate-400">Trước (RULE-01)</th>
                           <th className="px-6 py-6 border-l border-white/5 w-[320px] bg-slate-800 focus-within:bg-slate-700 transition-colors">Số hiện tại (Paste ↓)</th>
                           <th className="px-6 py-6 border-l border-white/5">Tiêu thụ</th>
                           <th className="px-6 py-6 border-l border-white/5">Trạng thái</th>
                           <th className="px-8 py-6 border-l border-white/5">Ghi chú</th>
                        </tr>
                      </thead>
                     <tbody>
                        {isLoadingMeters || isFetchingPrev ? (
                           Array.from({ length: 10 }).map((_, i) => (
                             <tr key={i} className="border-b border-border/5">
                                <td className="px-8 py-6"><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-20" /></td>
                                <td className="px-6 py-6 border-l border-border/5"><Skeleton className="h-6 w-16" /></td>
                                <td className="px-6 py-6 border-l border-border/5 bg-slate-50"><Skeleton className="h-8 w-full" /></td>
                                <td className="px-6 py-6 border-l border-border/5"><Skeleton className="h-6 w-16" /></td>
                                <td className="px-6 py-6 border-l border-border/5"><Skeleton className="h-6 w-12 rounded-full" /></td>
                                <td className="px-8 py-6 border-l border-border/5"><Skeleton className="h-4 w-full" /></td>
                             </tr>
                           ))
                        ) : paginatedMeters.map((m: Meter) => {
                           // RULE-01: Ensuring readings are correctly initialized from the view
                           const r = readings[m.id];
                           if (!r) return null; // Wait for initial sync if needed
                           
                           const currentVal = Number(r.current);
                           const isErr = r.current !== '' && currentVal < r.prev;
                           const consumption = r.current !== '' ? currentVal - r.prev : 0;

                           return (
                              <tr key={m.id} className={cn("border-b border-border/5 transition-all", isErr ? "bg-danger/5" : "hover:bg-white/40")}>
                                 <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                       <span className="font-mono text-[13px] font-black text-primary">{m.meterCode}</span>
                                       <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Phòng {m.roomCode}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-6 font-mono text-slate-400 font-bold bg-slate-900/5">{r.prev.toLocaleString()}</td>
                                 <td className="px-6 py-6 bg-white shrink-0 relative">
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
                                        "w-full h-12 bg-transparent text-[24px] font-black font-mono outline-none tracking-tighter transition-all",
                                        isErr ? "text-danger" : "text-primary placeholder:text-slate-100"
                                      )}
                                      placeholder="000"
                                    />
                                    {isErr && (
                                       <div className="absolute right-4 top-1/2 -translate-y-1/2 text-danger animate-pulse"><AlertCircle size={20} /></div>
                                    )}
                                 </td>
                                 <td className="px-6 py-6 font-mono font-black text-slate-700">
                                    {r.current !== '' ? (
                                       <span className={cn(isErr ? "text-danger" : "text-success-text")}>
                                          {consumption.toLocaleString()}
                                       </span>
                                    ) : '--'}
                                 </td>
                                 <td className="px-6 py-6">
                                    {r.current === '' ? (
                                       <span className="px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-widest">Trống</span>
                                    ) : isErr ? (
                                       <span className="px-3 py-1 rounded-full bg-danger text-[9px] font-black uppercase text-white tracking-widest">Báo lỗi</span>
                                    ) : (
                                       <span className="px-3 py-1 rounded-full bg-success-bg/20 text-[9px] font-black uppercase text-success-text tracking-widest">Khớp</span>
                                    )}
                                 </td>
                                 <td className="px-8 py-6">
                                    <input 
                                      type="text" 
                                      value={r.note}
                                      onChange={(e) => setReadings(prev => ({ ...prev, [m.id]: { ...prev[m.id], note: e.target.value }}))}
                                      placeholder="..." 
                                      className="w-full text-small font-medium bg-transparent border-none outline-none focus:ring-0 text-muted"
                                    />
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
               
               {/* Pagination UI */}
               {totalPages > 1 && (
                  <div className="p-4 bg-slate-900/5 border-t border-border/5 flex items-center justify-center gap-4">
                     <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm disabled:opacity-30 disabled:cursor-not-allowed border border-border/10"
                     >
                        <ChevronLeft size={20} />
                     </button>
                     <span className="text-[11px] font-black uppercase tracking-[2px]">Trang {currentPage} / {totalPages}</span>
                     <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm disabled:opacity-30 disabled:cursor-not-allowed border border-border/10"
                     >
                        <ChevronLeft size={20} className="rotate-180" />
                     </button>
                  </div>
               )}
            </div>

            <div className="flex items-center justify-between">
               <button onClick={handleBack} className="flex h-12 px-6 items-center gap-3 text-[13px] font-black uppercase tracking-[3px] text-muted hover:text-slate-900 transition-all">
                  <ChevronLeft size={20} /> Quay lại
               </button>
               <button 
                 onClick={handleNext}
                 disabled={stats.error > 0 || stats.valid === 0}
                 className={cn(
                   "px-12 h-16 rounded-[28px] bg-primary text-white text-[16px] font-black uppercase tracking-[4px] shadow-2xl transition-all",
                   (stats.error > 0 || stats.valid === 0) ? "opacity-30 grayscale cursor-not-allowed" : "hover:scale-[1.05] active:scale-95 shadow-primary/30"
                 )}
               >
                  Xác nhận ({stats.valid}) <ArrowRight size={20} className="inline ml-2" />
               </button>
            </div>
         </div>
       )}

       {/* Step 3: Review & Final Submit */}
       {step === 3 && (
         <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-4">
               <div className="w-24 h-24 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary mx-auto mb-8 animate-bounce transition-all">
                  <Database size={44} />
               </div>
               <h2 className="text-[44px] font-black text-slate-900 tracking-tighter leading-tight">Ghi nhận dữ liệu cuối cùng</h2>
               <p className="text-body text-muted max-w-lg mx-auto">Bạn chuẩn bị gửi {stats.valid} chỉ số đồng hồ {meterType === 'Electricity' ? 'Điện' : 'Nước'} vào hệ thống. Các dòng dữ liệu lỗi sẽ bị bỏ qua.</p>
            </div>

            <div className="card-container p-8 bg-slate-900/5 border-border/10 space-y-6">
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">N</div>
                      <p className="font-black uppercase tracking-widest text-[11px] text-slate-500">Dữ liệu hợp lệ</p>
                   </div>
                   <p className="text-[28px] font-black text-primary">{stats.valid}</p>
                </div>
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl shadow-sm border border-danger/10">
                   <div className="flex items-center gap-4 text-danger">
                      <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center"><Trash2 size={24} /></div>
                      <p className="font-black uppercase tracking-widest text-[11px]">Bị loại bỏ (Lỗi/Trống)</p>
                   </div>
                   <p className="text-[28px] font-black text-danger">{stats.error + stats.pending}</p>
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
               <button onClick={handleBack} className="h-14 text-muted font-black uppercase tracking-[3px] hover:text-slate-900 transition-all">Chỉnh sửa lại</button>
            </div>
         </div>
       )}
    </div>
  );
};

export default BulkMeterEntry;

