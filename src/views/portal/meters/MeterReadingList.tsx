import React from 'react';
import { 
  Zap, 
  Droplets, 
  TrendingUp, 
  Calendar, 
  History,
  InfoIcon,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { portalMeterService } from '@/services/portalMeterService';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui';

const MeterReadingList = () => {
  const { 
    data: latestElec, 
    isLoading: loadingElec, 
    isError: errorElec 
  } = useQuery({
    queryKey: ['latest-elec'],
    queryFn: () => portalMeterService.getLatestReading('Electricity')
  });

  const { 
    data: latestWater, 
    isLoading: loadingWater, 
    isError: errorWater 
  } = useQuery({
    queryKey: ['latest-water'],
    queryFn: () => portalMeterService.getLatestReading('Water')
  });

  const { 
    data: historyElec, 
    isLoading: loadingHistoryElec, 
    isError: errorHistoryElec 
  } = useQuery({
    queryKey: ['history-elec'],
    queryFn: () => portalMeterService.getReadingHistory('Electricity', 6)
  });

  const { 
    data: historyWater, 
    isLoading: loadingHistoryWater, 
    isError: errorHistoryWater 
  } = useQuery({
    queryKey: ['history-water'],
    queryFn: () => portalMeterService.getReadingHistory('Water', 6)
  });

  const isLoading = loadingElec || loadingWater || loadingHistoryElec || loadingHistoryWater;
  const isError = errorElec || errorWater || errorHistoryElec || errorHistoryWater;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-transparent min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-small text-muted font-black animate-pulse uppercase tracking-[3px]">Đang tải dữ liệu chỉ số...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-10 bg-transparent min-h-[60vh] text-center">
        <div className="p-6 bg-red-500/10 rounded-[32px] text-red-500 shadow-sm border border-red-500/20 animate-in zoom-in duration-500">
           <History size={48} strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
           <h3 className="text-xl font-black text-primary tracking-tight">Hệ thống bận</h3>
           <p className="text-sm font-bold text-muted uppercase tracking-widest leading-relaxed">Không thể tải dữ liệu chỉ số. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }


  const currentReading = {
    electricity: latestElec?.currentIndex ?? 0,
    water: latestWater?.currentIndex ?? 0,
    lastUpdate: latestElec?.readingDate ?? latestWater?.readingDate ?? 'Chưa có dữ liệu',
    consumption: {
      electricity: latestElec?.consumption ?? 0,
      water: latestWater?.consumption ?? 0
    }
  };

  // Combine and sort history
  const history = [
    ...(historyElec || []).map(h => ({ ...h, type: 'Electricity' as const })),
    ...(historyWater || []).map(h => ({ ...h, type: 'Water' as const }))
  ].sort((a, b) => new Date(b.readingDate).getTime() - new Date(a.readingDate).getTime());

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <div>
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-2 font-mono">Quản lý tiện ích</p>
          <h1 className="text-display text-primary leading-tight font-black tracking-tight">Chỉ số Đồng hồ</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-14 px-6 bg-white/60 backdrop-blur-md border border-primary/5 rounded-[24px] flex items-center gap-3 shadow-xl shadow-primary/5 group transition-all hover:bg-white">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Calendar size={16} />
            </div>
            <span className="text-[13px] font-black text-primary font-mono">{formatDate(new Date(), 'MM/yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { label: 'Điện năng (kWh)', value: currentReading.electricity, subValue: `+${currentReading.consumption.electricity} kWh`, icon: Zap, color: '#f59e0b' },
          { label: 'Nước sạch (m3)', value: currentReading.water, subValue: `+${currentReading.consumption.water} m3`, icon: Droplets, color: '#3b82f6' }
        ].map((stat, i) => (
          <div key={i} className="card-container p-10 bg-white/40 backdrop-blur-xl border border-primary/5 hover:border-primary/20 transition-all group overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 opacity-5 text-primary group-hover:scale-110 transition-transform">
              <stat.icon size={200} strokeWidth={1} />
            </div>
            <div className="flex justify-between items-start mb-10 relative z-10">
               <div>
                 <p className="text-[11px] font-black text-muted uppercase tracking-[3px] mb-2">{stat.label}</p>
                 <div className="flex items-baseline gap-3">
                    <span className="text-[56px] font-black text-primary font-mono tracking-tighter leading-none">{stat.value}</span>
                    <span className="text-[14px] font-black text-muted uppercase tracking-widest">{stat.label.includes('kWh') ? 'kWh' : 'm3'}</span>
                 </div>
               </div>
               <div className="p-5 bg-white rounded-[24px] text-primary shadow-xl shadow-primary/5 group-hover:rotate-12 transition-transform">
                  <stat.icon size={28} />
               </div>
            </div>
            <div className="p-4 bg-white/60 rounded-[20px] inline-flex items-center gap-3 border border-primary/5 relative z-10">
               <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={16} />
               </div>
               <div>
                  <p className="text-[13px] font-black text-primary leading-none font-mono">{stat.subValue}</p>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-tighter mt-1 italic">So với tháng trước</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[14px] font-black text-primary uppercase tracking-[4px] border-l-4 border-primary pl-4 leading-none">Lịch sử ghi chỉ số</h3>
           <span className="text-[10px] font-black text-muted font-mono bg-bg px-4 py-2 rounded-full uppercase tracking-widest border border-primary/5 italic">Cần đối soát với thực tế</span>
        </div>
        
        <div className="card-container p-0 overflow-hidden bg-white/60 backdrop-blur-xl border border-primary/5 shadow-2xl shadow-primary/10 font-plus-jakarta">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase tracking-[3px] text-[10px] sm:text-[11px]">
                  <th className="px-10 py-6 border-r border-white/5">Kỳ thanh toán</th>
                  <th className="px-8 py-6 border-r border-white/5">Loại</th>
                  <th className="px-8 py-6 border-r border-white/5">Chỉ số đầu</th>
                  <th className="px-8 py-6 border-r border-white/5">Chỉ số cuối</th>
                  <th className="px-8 py-6">Tiêu thụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10 font-bold">
                {history.map((record, i) => (
                  <tr key={i} className="group hover:bg-white/90 transition-all cursor-pointer">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-bg rounded-2xl flex flex-col items-center justify-center border border-border/10 shadow-inner group-hover:scale-110 transition-transform">
                           <Calendar size={16} className="text-primary mb-1" />
                           <span className="text-[9px] font-black text-primary">HIST</span>
                        </div>
                        <div>
                          <p className="text-[15px] font-black text-primary tracking-tighter uppercase font-mono">{record.monthYear}</p>
                          <p className="text-[10px] font-bold text-muted italic">Ngày ghi: {formatDate(record.readingDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center ring-4 ring-bg",
                            record.type === 'Electricity' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                          )}>
                             {record.type === 'Electricity' ? <Zap size={14} /> : <Droplets size={14} />}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-muted">{record.type === 'Electricity' ? 'Điện' : 'Nước'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-7">
                       <p className="text-[16px] font-black text-muted/60 font-mono italic tracking-tighter">{record.previousIndex}</p>
                    </td>
                    <td className="px-8 py-7">
                       <p className="text-[18px] font-black text-primary font-mono tracking-tighter">{record.currentIndex}</p>
                    </td>
                    <td className="px-8 py-7">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100/50 shadow-inner">
                         <TrendingUp size={12} strokeWidth={3} />
                         <span className="text-[13px] font-black font-mono">+{record.consumption} {record.type === 'Electricity' ? 'kWh' : 'm3'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-20 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-30">
                          <History size={48} />
                          <p className="text-xs font-black uppercase tracking-[3px] italic">Chưa có lịch sử ghi chỉ số</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Compliance Notice */}
      <div className="p-8 bg-info/[0.03] border border-info/20 rounded-[40px] flex gap-5 italic text-[13px] text-info font-bold items-center shadow-lg shadow-info/5 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <InfoIcon size={80} />
         </div>
         <div className="p-3 bg-info/10 rounded-2xl flex-shrink-0"><InfoIcon size={24} /></div>
         Dữ liệu chỉ số được đồng bộ trực tiếp từ hệ thống quản lý tòa nhà qua <code className="bg-info/10 px-2 py-0.5 rounded font-mono mx-1">vw_LatestMeterReading</code>. 
         Đảm bảo tính cung cấp dữ liệu minh bạch và chính xác tuyệt đối (RULE-01).
      </div>
    </div>
  );
};

export default MeterReadingList;
