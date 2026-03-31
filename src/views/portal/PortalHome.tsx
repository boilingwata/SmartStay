import React from 'react';
import { CreditCard, Wallet, MessageSquare, History, Zap, Waves, Car, MoreHorizontal } from 'lucide-react';
import { cn, formatVND } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { portalFinanceService } from '@/services/portalFinanceService';
import { portalMeterService } from '@/services/portalMeterService';
import { ticketService } from '@/services/ticketService';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui';

const PortalHome = () => {
  const navigate = useNavigate();

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['portal-balance'],
    queryFn: () => portalFinanceService.getFreshBalance()
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['portal-meter-stats'],
    queryFn: () => portalMeterService.getConsumptionStats()
  });

  const { data: ticketStats, isLoading: ticketsLoading } = useQuery({
    queryKey: ['portal-ticket-stats'],
    queryFn: () => ticketService.getTicketStatistics()
  });

  const isLoading = balanceLoading || statsLoading || ticketsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-6 min-h-[80vh]">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Đang cập nhật dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-5 lg:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      {/* Hero Bill Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0D8A8A] via-[#1B3A6B] to-[#2E5D9F] p-7 text-white shadow-2xl shadow-teal-900/10 hover:scale-[1.01] transition-all group">
        <div className="absolute -right-16 -top-16 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <CreditCard size={250} strokeWidth={1} />
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="space-y-1.5">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-300 rounded-full animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[3px] text-teal-200/80">Cổng thông tin cư dân</p>
             </div>
            <h2 className="text-2xl font-black tracking-tight leading-none uppercase">Chào bạn trở lại! 👋</h2>
            <p className="text-[13px] text-white/60 font-bold italic">Cập nhật hóa đơn và tiện ích mới nhất</p>
          </div>
          
          <div className="flex items-end justify-between py-2">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[4px] text-white/40 mb-1">Số dư hiện tại</p>
              <p className="text-4xl font-black tracking-tighter tabular-nums drop-shadow-md">
                {formatVND(balance?.currentBalance || 0)}
              </p>
            </div>
            <button 
              onClick={() => navigate('/portal/finance')}
              className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 transition-all hover:bg-white/20 active:scale-90"
            >
              <History size={24} className="text-white" />
            </button>
          </div>

          <button 
            onClick={() => navigate('/portal/finance')}
            className="w-full h-14 bg-white text-[#0D8A8A] rounded-2xl font-black uppercase tracking-[4px] text-xs shadow-2xl shadow-black/10 active:scale-95 transition-all hover:bg-teal-50"
          >
            Thanh toán & Hóa đơn
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={() => navigate('/portal/finance')}
          className="bg-white p-6 rounded-[28px] shadow-xl shadow-slate-900/5 border border-slate-100 flex flex-col items-center text-center transition-all hover:scale-[1.03] active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div className="space-y-1 mt-4">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px]">Ví cư dân</p>
            <p className="text-lg font-black tracking-tight text-slate-800">{formatVND(balance?.currentBalance || 0)}</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/portal/tickets')}
          className="bg-white p-6 rounded-[28px] shadow-xl shadow-slate-900/5 border border-slate-100 flex flex-col items-center text-center transition-all hover:scale-[1.03] active:scale-95 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D8A8A] flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare size={24} strokeWidth={2.5} />
          </div>
          <div className="space-y-1 mt-4">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px]">Yêu cầu</p>
            <p className="text-lg font-black tracking-tight text-[#0D8A8A] tabular-nums">
                {String(ticketStats?.open || 0).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-5 px-1">
        <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[3px] border-l-4 border-teal-500 pl-3 leading-none">Dịch vụ nhanh</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Điện', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', path: '/portal/meters' },
            { name: 'Nước', icon: Waves, color: 'text-blue-500', bg: 'bg-blue-50', path: '/portal/meters' },
            { name: 'Xe', icon: Car, color: 'text-indigo-500', bg: 'bg-indigo-50', path: '/portal/profile' },
            { name: 'Tiện ích', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50', path: '/portal/amenities' }
          ].map((item, i) => (
            <div 
              key={i} 
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 group cursor-pointer active:scale-90 transition-all"
            >
              <div className="w-16 h-16 bg-white rounded-[22px] shadow-lg shadow-slate-900/5 border border-slate-50 flex items-center justify-center group-hover:border-teal-200 group-hover:shadow-teal-900/5 transition-all">
                <item.icon size={28} className={cn(item.color)} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
