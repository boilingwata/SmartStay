import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { Invoice } from '@/models/Invoice';
import { cn } from '@/utils';

type TabType = 'Unpaid_Overdue' | 'Paid' | 'All';

const InvoiceList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Unpaid_Overdue');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await fetchInvoices();
      setLoading(false);
    };
    initFetch();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    const y = e.touches[0].clientY;
    const distance = y - startY;
    if (distance > 0 && distance < 120) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      await handleRefresh();
    }
    setPullDistance(0);
    setStartY(0);
  };

  const overdueCount = invoices.filter(inv => inv.status === 'Overdue').length;

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Paid') return inv.status === 'Paid';
    if (activeTab === 'Unpaid_Overdue') return inv.status === 'Unpaid' || inv.status === 'Overdue';
    return true;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Unpaid': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Overdue': return 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle2 size={13} strokeWidth={3} />;
      case 'Unpaid': return <Clock size={13} strokeWidth={3} className="animate-pulse" />;
      case 'Overdue': return <AlertCircle size={13} strokeWidth={3} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Paid': return 'Đã thanh toán';
      case 'Unpaid': return 'Chưa thanh toán';
      case 'Overdue': return 'Quá hạn';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-white min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#0D8A8A] rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Finance Core</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div 
          className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none transition-transform duration-200"
          style={{ transform: `translateY(${Math.min(pullDistance || 80, 80)}px)` }}
        >
          <div className="bg-white rounded-full shadow-lg p-2.5 text-[#0D8A8A] border border-slate-100 flex items-center gap-2 px-4 animate-in slide-in-from-top-4 fade-in">
             <RefreshCw size={18} className={cn(refreshing && "animate-spin")} style={{ transform: `rotate(${pullDistance * 3}deg)` }} strokeWidth={2.5} />
             {pullDistance > 60 && !refreshing && <span className="text-[10px] font-black uppercase tracking-widest">Thả để tải lại</span>}
             {refreshing && <span className="text-[10px] font-black uppercase tracking-widest">Đang tải...</span>}
          </div>
        </div>
      )}

      {/* Sticky Header Hub */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-5 pt-12 pb-4 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Hóa đơn</h2>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                Lịch sử giao dịch 
                <button onClick={handleRefresh} className={cn("ml-1 p-1 hover:bg-slate-100 rounded-full transition-all", refreshing && "animate-spin text-[#0D8A8A]")}>
                  <RefreshCw size={12} strokeWidth={3} />
                </button>
             </p>
          </div>
          <div className="flex gap-2">
            <button className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50">
              <Search size={20} />
            </button>
            <button className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 bg-slate-100/60 rounded-[24px] border border-slate-200/50 relative">
          {[
            { id: 'Unpaid_Overdue', label: 'Chưa thanh toán' },
            { id: 'Paid', label: 'Đã thanh toán' },
            { id: 'All', label: 'Tất cả' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-full transition-all duration-500 relative",
                  isActive 
                    ? "bg-white text-[#0D8A8A] shadow-lg shadow-black/5 scale-[1.02]" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className="flex items-center justify-center gap-1.5 z-10 relative">
                  {tab.label}
                  {tab.id === 'Unpaid_Overdue' && overdueCount > 0 && (
                     <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] shadow-sm transform -translate-y-0.5 animate-bounce">
                       {overdueCount}
                     </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overdueCount > 0 && activeTab !== 'Paid' && (
        <div className="mx-5 mt-5 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-3xl flex items-center gap-4 shadow-sm shadow-red-100/50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors" />
           <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
             <AlertCircle size={24} strokeWidth={2.5} className="animate-pulse" />
           </div>
           <div className="flex-1 space-y-0.5">
             <p className="text-[13px] font-black text-red-700 tracking-tight leading-tight">Bạn có {overdueCount} hóa đơn quá hạn!</p>
             <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest leading-tight">Thanh toán ngay để không bị gián đoạn dịch vụ</p>
           </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="px-5 pt-6 space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((inv) => (
            <div 
              key={inv.id}
              onClick={() => navigate(`/portal/invoices/${inv.id}`)}
              className={cn(
                "card-container p-6 bg-white border shadow-sm space-y-5 transform transition-all duration-500 hover:shadow-xl rounded-[32px] group active:scale-[0.98] relative overflow-hidden",
                inv.status === 'Overdue' ? 'border-red-100 shadow-red-100/30' : 'border-slate-100 shadow-slate-200/40'
              )}
            >
              {inv.status === 'Overdue' && <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />}
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{inv.invoiceCode}</p>
                  <p className="text-lg font-black text-slate-900 tracking-tight leading-none pt-1">Tháng {inv.period}</p>
                </div>
                <div className={cn("px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all", getStatusStyle(inv.status))}>
                  {getStatusIcon(inv.status)} {getStatusLabel(inv.status)}
                </div>
              </div>

              {/* Mini Breakdown */}
              <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-100/50 space-y-2 relative z-10">
                 <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                    <span>Phí thuê phòng</span>
                    <span className="font-bold text-slate-700">Theo HD gốc</span>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-medium text-slate-500">
                    <span>Điện, nước & Dịch vụ</span>
                    <span className="font-bold text-slate-700">Theo sử dụng</span>
                 </div>
              </div>

              <div className="flex items-end justify-between pt-2 relative z-10">
                <div className="space-y-1.5">
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", inv.status === 'Overdue' ? 'text-red-500' : 'text-slate-400')}>
                    Hạn: {inv.dueDate}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-black text-[#0D8A8A] tabular-nums tracking-tighter">{inv.totalAmount.toLocaleString()}</p>
                    <span className="text-[10px] font-bold text-[#0D8A8A] uppercase">đ</span>
                  </div>
                </div>
                
                {inv.status !== 'Paid' ? (
                  <button className="h-10 px-5 bg-teal-50 text-[#0D8A8A] rounded-xl font-black text-[10px] uppercase tracking-widest group-hover:bg-[#0D8A8A] group-hover:text-white transition-colors duration-300">
                    Thanh toán
                  </button>
                ) : (
                   <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                     <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                   </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
               <CheckCircle2 size={40} className="text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Tuyệt vời!</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Không có hóa đơn nào {activeTab === 'Unpaid_Overdue' ? 'cần thanh toán' : ''} trong danh mục này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
