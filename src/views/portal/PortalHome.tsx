import React from 'react';
import { CreditCard, Wallet, MessageSquare, History } from 'lucide-react';
import { cn } from '@/utils';

const PortalHome = () => {
  return (
    <div className="space-y-6 p-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Bill Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#0D8A8A] p-6 text-white shadow-2xl shadow-[#0D8A8A]/20">
        {/* Background Pattern */}
        <div className="absolute -right-10 -top-10 opacity-10">
          <CreditCard size={200} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <h2 className="text-[24px] font-bold leading-tight">Chào bạn trở lại! 👋</h2>
            <p className="text-[13px] text-white/70 font-medium">Bạn có 1 hóa đơn mới cần thanh toán</p>
          </div>
          
          <div className="flex items-end justify-between py-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Tổng tiền cần trả</p>
              <p className="text-[36px] font-bold tracking-tight">1.540.000<span className="text-[18px] ml-1">đ</span></p>
            </div>
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <History size={22} className="text-white/80" />
            </div>
          </div>

          <button className="w-full py-4 bg-white text-[#0D8A8A] rounded-2xl font-bold shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98] text-[15px]">
            Thanh toán ngay
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Số dư ví', val: '2.000.000đ', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
          { label: 'Yêu cầu', val: '03', icon: MessageSquare, color: 'text-[#0D8A8A]', bg: 'bg-teal-50/50' }
        ].map((item, i) => (
          <div key={i} className="card-container p-5 space-y-4 border-slate-100 flex flex-col items-center text-center">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform hover:scale-110 duration-300", item.bg, item.color)}>
              <item.icon size={22} />
            </div>
            <div className="space-y-1">
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</p>
              <p className={cn("text-[20px] font-bold tracking-tight", item.color)}>{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity or Quick Links could go here */}
      <div className="space-y-4">
        <h3 className="text-[16px] font-bold text-slate-900 px-1">Tiện ích nhanh</h3>
        <div className="grid grid-cols-4 gap-4">
          {['Điện', 'Nước', 'Xe', 'Khác'].map((name, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:text-[#0D8A8A] hover:border-[#0D8A8A]/20 transition-all active:scale-95">
                <div className="w-6 h-6 bg-slate-100 rounded-lg"></div>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortalHome;
