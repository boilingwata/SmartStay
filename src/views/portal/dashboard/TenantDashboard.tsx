import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  CreditCard, 
  MessageSquare, 
  ArrowUpRight, 
  ChevronRight,
  Home,
  Clock,
  Zap,
  Droplets,
  Info,
  AlertTriangle,
  FileText,
  Users,
  CalendarDays,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { tenantDashboardService, DashboardSummary } from '@/services/tenantDashboardService';
import { differenceInDays, formatDistanceToNow, isPast } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

const TenantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await tenantDashboardService.getSummary();
        setData(res);
      } catch (error) {
        toast.error('Không thể tải dữ liệu trang chủ');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 bg-[#F8FAFC] min-h-[80vh]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#0D8A8A]/10 border-t-[#0D8A8A] rounded-full animate-spin shadow-xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-10 h-10 bg-[#0D8A8A]/5 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[14px] text-slate-900 font-black uppercase tracking-[8px] animate-pulse">SmartStay</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[4px]">Hệ thống bảo mật cư dân</p>
        </div>
      </div>
    );
  }

  const activeContract = data.activeContract;
  const contractExpiryDays = activeContract ? differenceInDays(new Date(activeContract.endDate), new Date()) : 0;
  const isExpiryWarning = contractExpiryDays < 30;

  return (
    <div className="flex flex-col min-h-screen bg-[#F1F5F9] pb-32 animate-in fade-in duration-1000 no-scrollbar">
      {/* 1. Lush Header with Overlapping Card */}
      <div className="relative h-[280px] w-full overflow-hidden bg-gradient-to-br from-[#1B3A6B] via-[#0D8A8A] to-[#2E5D9F] px-8 pt-12">
        {/* Animated Mesh Overlays */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[120%] bg-white/20 blur-[120px] rounded-full animate-float"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-[60%] h-[100%] bg-emerald-400/20 blur-[100px] rounded-full"></div>
        </div>
        
        <div className="relative z-10 space-y-1">
          <p className="text-[12px] font-black text-white/60 uppercase tracking-[5px] italic">Premium Resident</p>
          <h2 className="text-[36px] font-black text-white tracking-tighter leading-tight">
            Xin chào,<br/>
            <span className="italic">{activeContract?.tenantName.split(' ').pop()}!</span>
          </h2>
        </div>

        {/* Floating Abstract Element */}
        <div className="absolute top-10 right-8 animate-float opacity-30">
           <Activity size={100} strokeWidth={0.5} className="text-white" />
        </div>
      </div>

      {/* 2. Overlapping Tactical Hub (Dashboard Main Content) */}
      <div className="px-5 -mt-24 relative z-20 space-y-8">
        
        {/* Unit & Contract Info Overlap */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 shadow-premium border border-white/60 group hover:shadow-glow transition-all duration-500">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0D8A8A] to-[#1B3A6B] text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-[#0D8A8A]/20 transition-transform group-hover:rotate-[10deg]">
               <Home size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xl font-black text-slate-900 tracking-tight italic">Căn hộ {activeContract?.roomCode}</p>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1.5 transition-transform" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeContract?.buildingName}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider italic">Hợp đồng: {activeContract?.endDate}</span>
             </div>
             <span className={cn(
               "h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center",
               isExpiryWarning ? "bg-rose-50 text-rose-500 border border-rose-100 animate-pulse" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
             )}>
                {isExpiryWarning ? "Sắp hết hạn" : "Đang Active"}
             </span>
          </div>
        </div>

        {/* High-End VIP Financial Card */}
        <div className="relative group cursor-pointer" onClick={() => navigate('/portal/invoices')}>
          <div className="absolute -inset-1 bg-gradient-to-r from-[#0D8A8A] to-indigo-600 rounded-[44px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-slate-900 rounded-[40px] overflow-hidden p-8 text-white shadow-2xl">
            {/* Glossy Texture Overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0D8A8A]/10 blur-[60px] -ml-16 -mb-16 rounded-full" />

            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                     <p className="text-[11px] font-black text-white/40 uppercase tracking-[4px]">Số dư khả dụng</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter tabular-nums drop-shadow-2xl">
                          {data.balance.currentBalance.toLocaleString()}
                        </span>
                        <span className="text-lg font-black text-white/60">đ</span>
                     </div>
                  </div>
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                    <Zap size={24} strokeWidth={2.5} className="text-[#0D8A8A]" />
                  </div>
               </div>

               <div className="flex items-center gap-4 py-4 px-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm group-hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 bg-[#0D8A8A] rounded-xl flex items-center justify-center text-white shadow-lg">
                    <FileText size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Hóa đơn chưa đóng</p>
                    <p className="text-sm font-black italic tracking-tight">{data.pendingInvoicesCount} mục chờ thanh toán</p>
                  </div>
                  <ArrowUpRight size={22} className="text-white/40 group-hover:text-white transition-colors" />
               </div>

               <button className="w-full h-16 bg-[#0D8A8A] hover:bg-emerald-500 rounded-[24px] text-white font-black text-[14px] tracking-[6px] uppercase italic transition-all active:scale-[0.97] shadow-lg shadow-[#0D8A8A]/30 flex items-center justify-center gap-4">
                  Nạp tiền / Thanh toán
               </button>
            </div>
          </div>
        </div>

        {/* Functional List Sections */}
        <div className="space-y-12 pt-4 pb-20">
          
          {/* Upcoming Invoices */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-6 bg-[#0D8A8A] rounded-full shadow-glow" />
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">Lịch thu phí</h3>
               </div>
               <button onClick={() => navigate('/portal/invoices')} className="text-[10px] font-black text-[#0D8A8A] uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">Tất cả</button>
            </div>
            
            <div className="space-y-4">
              {data.upcomingInvoices.slice(0, 3).map((inv) => (
                <div key={inv.id} className="card-premium p-5 flex items-center justify-between group active:scale-[0.98] transition-all bg-white/90 border-slate-100" onClick={() => navigate(`/portal/invoices/${inv.id}`)}>
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-slate-100/50 text-[#1B3A6B] rounded-2xl flex items-center justify-center transition-all group-hover:bg-[#1B3A6B] group-hover:text-white shadow-inner">
                       <CreditCard size={24} strokeWidth={2.5} />
                     </div>
                     <div className="space-y-1">
                       <p className="text-[16px] font-black text-slate-900 tracking-tight leading-none">{inv.title}</p>
                       <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-none">Hạn: {inv.dueDate}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 tabular-nums italic">{inv.amount.toLocaleString()}đ</p>
                    <ArrowRight size={18} className="text-slate-200 ml-auto group-hover:text-[#0D8A8A] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Dashboard Toggles */}
          <section className="grid grid-cols-2 gap-4">
             <div className="card-premium p-6 space-y-4 bg-gradient-to-br from-indigo-50/50 to-white/90 border-indigo-100/50" onClick={() => navigate('/portal/tickets')}>
                <div className="w-12 h-12 bg-white text-indigo-500 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-50">
                   <MessageSquare size={22} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-black text-slate-800 tracking-tight leading-none italic">Sự cố & Hỗ trợ</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     {data.recentTickets.filter(t => t.status === 'Open' || t.status === 'InProgress').length} yêu cầu
                   </p>
                </div>
             </div>

             <div className="card-premium p-6 space-y-4 bg-gradient-to-br from-emerald-50/50 to-white/90 border-emerald-100/50" onClick={() => navigate('/portal/amenities')}>
                <div className="w-12 h-12 bg-white text-emerald-500 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-50">
                   <Droplets size={22} strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-black text-slate-800 tracking-tight leading-none italic">Tiện ích tòa nhà</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang khả dụng</p>
                </div>
             </div>
          </section>

          {/* Service Snapshot Card */}
          <div className="card-premium p-8 relative overflow-hidden bg-slate-900 group">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                <Zap size={140} className="text-[#0D8A8A]" />
             </div>
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-black text-white italic tracking-tight">Trạng thái tiện ích</h3>
                   <span className="text-[9px] font-black text-[#0D8A8A] uppercase tracking-[4px] animate-pulse">Live Now</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[#0D8A8A]">
                         <Zap size={16} fill="currentColor" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Điện năng</span>
                      </div>
                      <p className="text-2xl font-black text-white tabular-nums italic tracking-tighter">1,250 <span className="text-[10px] text-white/40 not-italic uppercase tracking-widest ml-1">kWh</span></p>
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sky-400">
                         <Droplets size={16} fill="currentColor" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-white/60">Nước sạch</span>
                      </div>
                      <p className="text-2xl font-black text-white tabular-nums italic tracking-tighter">45.5 <span className="text-[10px] text-white/40 not-italic uppercase tracking-widest ml-1">m3</span></p>
                   </div>
                </div>
                <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-[3px] h-12 rounded-2xl active:scale-95 transition-all shadow-none" onClick={() => navigate('/portal/meters')}>Chi tiết chỉ số</Button>
             </div>
          </div>
        </div>

        {/* Premium Brand Footer */}
        <div className="py-20 text-center space-y-4 opacity-30">
           <div className="flex justify-center items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-[#0D8A8A]" />
              <span className="text-[11px] font-black uppercase tracking-[10px] text-slate-900 italic">SMARTSTAY</span>
              <div className="w-1 h-1 rounded-full bg-[#0D8A8A]" />
           </div>
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-[4px]">Designed for Exclusive Living © 2026</p>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
