import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Zap, 
  Droplets, 
  ArrowLeft, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { cn, formatVND } from '@/utils';

const MeterReadingList: React.FC = () => {
  const { type } = useParams<{ type: 'electricity' | 'water' }>();
  const navigate = useNavigate();
  const isElectric = type === 'electricity';

  // Mock data following RULE-01 (LatestMeterReading pattern)
  const currentReading = {
    index: isElectric ? 1240.5 : 45.2,
    usage: isElectric ? 132 : 6,
    period: 'Tháng 03/2026',
    updatedAt: '2026-03-15T10:30:00Z',
    cost: isElectric ? 425000 : 155000
  };

  const history = [
    { month: '02/2026', index: isElectric ? 1108.5 : 39.2, usage: isElectric ? 115 : 7, cost: isElectric ? 368000 : 182000 },
    { month: '01/2026', index: isElectric ? 993.5 : 32.2, usage: isElectric ? 142 : 5, cost: isElectric ? 456000 : 130000 },
    { month: '12/2025', index: isElectric ? 851.5 : 27.2, usage: isElectric ? 128 : 8, cost: isElectric ? 412000 : 210000 },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in zoom-in-95 duration-700 font-sans">
      {/* Premium Header Backdrop */}
      <div className={cn(
        "absolute top-0 inset-x-0 h-[300px] rounded-b-[48px] overflow-hidden shadow-2xl transition-all duration-1000",
        isElectric 
          ? "bg-gradient-to-br from-amber-900 via-slate-900 to-amber-950" 
          : "bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950"
      )}>
         <div className="absolute inset-0 opacity-10 mix-blend-overlay"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
         
         {/* Decorative Glows */}
         <div className={cn(
           "absolute -top-24 -right-24 w-96 h-96 rounded-full mix-blend-screen filter blur-[90px] opacity-40 animate-pulse",
           isElectric ? "bg-amber-500" : "bg-blue-500"
         )}></div>
         <div className={cn(
           "absolute top-1/2 -left-24 w-72 h-72 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse delay-700",
           isElectric ? "bg-yellow-500" : "bg-sky-500"
         )}></div>
      </div>

      <div className="relative pt-12 px-6 max-w-[430px] mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all shadow-lg"
          >
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <BarChart3 size={22} strokeWidth={2.5} />
          </div>
        </div>

        {/* Title Section */}
        <div className="space-y-1.5 px-1">
           <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
             Chi số <span className={cn(isElectric ? "text-amber-400" : "text-blue-400")}>{isElectric ? 'Điện' : 'Nước'}</span>
           </h1>
           <div className="flex items-center gap-2 opacity-60">
             <Clock size={12} className="text-white" />
             <p className="text-[10px] font-black text-white uppercase tracking-[3px]">Cập nhật: 2 giờ trước</p>
           </div>
        </div>

        {/* Hero Consumption Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[40px] p-8 shadow-2xl border border-white shadow-slate-200/50 space-y-8 relative overflow-hidden group">
           <div className={cn(
             "absolute top-0 right-0 p-8 opacity-5 transition-transform group-hover:scale-110 duration-700",
             isElectric ? "text-amber-600" : "text-blue-600"
           )}>
             {isElectric ? <Zap size={150} /> : <Droplets size={150} />}
           </div>

           <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[2px]">Chỉ số hiện tại</span>
                    <div className="flex items-baseline gap-2">
                       <h2 className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                          {currentReading.index}
                       </h2>
                       <span className="text-[13px] font-black text-slate-400 uppercase">{isElectric ? 'kWh' : 'm³'}</span>
                    </div>
                 </div>
                 <div className={cn(
                   "w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner pt-0.5",
                   isElectric ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                 )}>
                   {isElectric ? <Zap size={24} strokeWidth={2.5} /> : <Droplets size={24} strokeWidth={2.5} />}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiêu thụ tháng này</span>
                    <p className="text-lg font-black text-slate-800 tracking-tight">+{currentReading.usage} {isElectric ? 'kWh' : 'm³'}</p>
                 </div>
                 <div className="p-4 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tạm tính</span>
                    <p className="text-lg font-black text-teal-600 tracking-tight">{formatVND(currentReading.cost)}</p>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[24px] p-4 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Xu hướng: <span className="text-emerald-400">Giảm 12%</span></span>
                 </div>
                 <ChevronRight size={14} className="text-white/20" />
              </div>
           </div>
        </div>

        {/* History Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[2px] flex items-center gap-2">
                 <Calendar size={16} className="text-teal-500" /> Nhật ký tiêu thụ
              </h3>
              <button className="text-[11px] font-black text-teal-600 uppercase tracking-widest">Xem tất cả</button>
           </div>

           <div className="space-y-4 px-1">
              {history.map((record, i) => (
                <div key={record.month} className="p-6 bg-white rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-slate-100 transition-colors">
                         <Clock size={22} strokeWidth={2} />
                      </div>
                      <div className="space-y-1">
                         <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">Tháng {record.month}</h4>
                         <p className="text-[11px] font-black text-slate-400 tracking-widest">Chỉ số: {record.index}</p>
                      </div>
                   </div>
                   <div className="text-right space-y-0.5">
                      <p className={cn(
                        "text-[15px] font-black tracking-tighter",
                        isElectric ? "text-amber-600" : "text-blue-600"
                      )}>
                        +{record.usage} {isElectric ? 'kWh' : 'm³'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{formatVND(record.cost)}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Policy Notice */}
        <div className="px-1">
           <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px] flex gap-4">
              <ShieldCheck className="text-blue-500 shrink-0" size={24} />
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-blue-900 uppercase tracking-widest leading-none">Chính sách tính cước</h4>
                <p className="text-[10px] text-blue-700/70 font-medium leading-relaxed italic">
                  Chỉ số được chốt định kỳ vào ngày 25 hàng tháng. {isElectric ? 'Giá điện áp dụng theo bậc thang Bộ Công Thương.' : 'Giá nước áp dụng theo định mức cư dân Hà Nội.'}
                </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default MeterReadingList;
