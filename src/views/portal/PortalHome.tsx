import React from 'react';
import { CreditCard, Wallet, MessageSquare, History, FileText, CalendarClock, Car, MoreHorizontal } from 'lucide-react';
import { cn, formatVND } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { portalFinanceService } from '@/services/portalFinanceService';
import { ticketService } from '@/services/ticketService';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui';

const quickLinks = [
  { name: 'Hoa don', icon: FileText, color: 'text-amber-500', path: '/portal/invoices' },
  { name: 'Hop dong', icon: CalendarClock, color: 'text-blue-500', path: '/portal/contract' },
  { name: 'Xe', icon: Car, color: 'text-indigo-500', path: '/portal/profile' },
  { name: 'Tien ich', icon: MoreHorizontal, color: 'text-slate-500', path: '/portal/amenities' },
];

const PortalHome = () => {
  const navigate = useNavigate();

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ['portal-balance'],
    queryFn: () => portalFinanceService.getFreshBalance(),
  });

  const { data: ticketStats, isLoading: ticketsLoading } = useQuery({
    queryKey: ['portal-ticket-stats'],
    queryFn: () => ticketService.getTicketStatistics(),
  });

  const isLoading = balanceLoading || ticketsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-1 flex-col items-center justify-center space-y-6 px-6">
        <Spinner size="lg" />
        <p className="animate-pulse text-sm font-black uppercase tracking-[3px] text-slate-400">Dang cap nhat du lieu...</p>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6 p-4 font-sans fade-in slide-in-from-bottom-4 duration-700 sm:p-5 lg:p-6">
      <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0D8A8A] via-[#1B3A6B] to-[#2E5D9F] p-7 text-white shadow-2xl shadow-teal-900/10 transition-all hover:scale-[1.01]">
        <div className="absolute -right-16 -top-16 opacity-10 transition-transform duration-700 group-hover:scale-110">
          <CreditCard size={250} strokeWidth={1} />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
              <p className="text-[10px] font-black uppercase tracking-[3px] text-teal-200/80">Cong thong tin cu dan</p>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Chao ban tro lai</h2>
            <p className="text-[13px] font-bold italic text-white/60">Cap nhat hoa don va thong tin hop dong moi nhat</p>
          </div>

          <div className="flex items-end justify-between py-2">
            <div className="space-y-2">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[4px] text-white/40">So du hien tai</p>
              <p className="text-4xl font-black tracking-tighter tabular-nums drop-shadow-md">
                {formatVND(balance?.currentBalance || 0)}
              </p>
            </div>
            <button
              onClick={() => navigate('/portal/invoices')}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl transition-all hover:bg-white/20 active:scale-90"
            >
              <History size={24} className="text-white" />
            </button>
          </div>

          <button
            onClick={() => navigate('/portal/invoices')}
            className="h-14 w-full rounded-2xl bg-white text-xs font-black uppercase tracking-[4px] text-[#0D8A8A] shadow-2xl shadow-black/10 transition-all hover:bg-teal-50 active:scale-95"
          >
            Thanh toan va Hoa don
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate('/portal/invoices')}
          className="group flex cursor-pointer flex-col items-center rounded-[28px] border border-slate-100 bg-white p-6 text-center shadow-xl shadow-slate-900/5 transition-all hover:scale-[1.03] active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-110">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">Vi cu dan</p>
            <p className="text-lg font-black tracking-tight text-slate-800">{formatVND(balance?.currentBalance || 0)}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/portal/tickets')}
          className="group flex cursor-pointer flex-col items-center rounded-[28px] border border-slate-100 bg-white p-6 text-center shadow-xl shadow-slate-900/5 transition-all hover:scale-[1.03] active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-[#0D8A8A] transition-transform group-hover:scale-110">
            <MessageSquare size={24} strokeWidth={2.5} />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-400">Yeu cau</p>
            <p className="text-lg font-black tracking-tight tabular-nums text-[#0D8A8A]">
              {String(ticketStats?.open || 0).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-1">
        <div className="flex items-center justify-between">
          <h3 className="border-l-4 border-teal-500 pl-3 text-[12px] font-black uppercase leading-none tracking-[3px] text-slate-400">
            Dich vu nhanh
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((item) => (
            <div
              key={item.name}
              onClick={() => navigate(item.path)}
              className="group flex cursor-pointer flex-col items-center gap-2 transition-all active:scale-90"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-slate-50 bg-white shadow-lg shadow-slate-900/5 transition-all group-hover:border-teal-200 group-hover:shadow-teal-900/5">
                <item.icon size={28} className={cn(item.color)} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
