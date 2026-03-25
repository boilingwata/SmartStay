import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { Invoice } from '@/models/Invoice';
import { cn, formatVND } from '@/utils';
import { m } from 'framer-motion';
import { toast } from 'sonner';

type TabType = 'Unpaid_Overdue' | 'Paid' | 'All';

const InvoiceList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Unpaid_Overdue');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({ All: 0, Unpaid: 0, Paid: 0, Overdue: 0 });
  const limit = 10;
  
  const navigate = useNavigate();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fetchInvoices = async (pageNum: number, isRefresh = false) => {
    try {
      const data = await invoiceService.getInvoices({ page: pageNum, limit });
      const newItems = data.items;
      
      if (isRefresh || pageNum === 1) {
        setInvoices(newItems);
      } else {
        setInvoices(prev => {
          // Prevent duplicates on strict mode
          const newIds = new Set(newItems.map(d => d.id));
          const filteredPrev = prev.filter(p => !newIds.has(p.id));
          return [...filteredPrev, ...newItems];
        });
      }
      setHasMore((data.page - 1) * data.limit + newItems.length < data.total);
      setError(null);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Không thể tải danh sách hóa đơn. Vui lòng thử lại.');
    }
  };

  const fetchCounts = async () => {
    try {
      const data = await invoiceService.getInvoiceCounts();
      setCounts(data);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true);
      await Promise.all([
        fetchInvoices(1, true),
        fetchCounts()
      ]);
      setLoading(false);
    };
    initFetch();
  }, []);

  // Infinite Scroll Observer using stable callback ref
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          setIsFetchingNextPage(true);
          setPage(p => p + 1);
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '0px 0px 200px 0px' 
      }
    );

    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, isFetchingNextPage]);

  // Fetch next page when page changes
  useEffect(() => {
    if (page > 1) {
      fetchInvoices(page, false).finally(() => setIsFetchingNextPage(false));
    }
  }, [page]);

  const handleRefresh = async () => {
    setLoading(true);
    setPage(1);
    await Promise.all([
      fetchInvoices(1, true),
      fetchCounts()
    ]);
    setLoading(false);
  };

  const overdueCount = counts.Overdue;

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Paid') return inv.status === 'Paid';
    if (activeTab === 'Unpaid_Overdue') return inv.status === 'Unpaid' || inv.status === 'Overdue';
    return true;
  });

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

  const calculateDays = (dueDate: string, isOverdue: boolean) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isOverdue) {
      return `Quá hạn ${Math.abs(diffDays)} ngày`;
    }
    return `Còn ${diffDays > 0 ? diffDays : 0} ngày`;
  };

  if (loading && page === 1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-white min-h-[80vh]">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="text-[10px] text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Finance Core</p>
      </div>
    );
  }

  if (error && invoices.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-10 bg-white min-h-[80vh] text-center">
        <div className="p-6 bg-red-50 rounded-[32px] text-red-500 shadow-sm border border-red-100">
           <AlertCircle size={48} strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
           <h3 className="text-xl font-black text-slate-900 tracking-tight">Hệ thống bận</h3>
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{error}</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-[20px] font-black uppercase tracking-widest text-[11px] hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
        >
          <RefreshCw size={16} /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Unified Sticky Container */}
        <div className="sticky top-0 z-40 flex flex-col">
          {/* Sticky Header Hub */}
          <div className="bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-5 pt-12 pb-4 space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Hóa đơn</h2>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1">
                    Lịch sử giao dịch 
                 </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toast.info("Chức năng tìm kiếm đang được phát triển")}
                  className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
                >
                  <Search size={20} />
                </button>
                <button 
                  onClick={() => toast.info("Chức năng lọc nâng cao đang được phát triển")}
                  className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all hover:bg-slate-50"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>

            {/* D.6.1 Tab Bar Design */}
            <div className="flex bg-gray-100 rounded-[14px] p-1 gap-1 relative">
              {[
                { id: 'Unpaid_Overdue', label: 'Chưa TT' },
                { id: 'Paid', label: 'Đã TT' },
                { id: 'All', label: 'Tất cả' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      "flex-1 py-2 text-[12px] transition-all duration-300 relative flex items-center justify-center",
                      isActive 
                        ? "bg-white rounded-[10px] shadow-sm text-gray-900 font-semibold" 
                        : "text-gray-500 hover:text-gray-700 font-medium"
                    )}
                  >
                    <div className="flex items-center justify-center z-10 relative">
                      {tab.label}
                      {tab.id === 'Unpaid_Overdue' && overdueCount > 0 && (
                         <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] rounded-full ml-1.5 font-bold shadow-sm">
                           {overdueCount}
                         </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* D.6.2 Overdue Alert Banner */}
          {overdueCount > 0 && activeTab !== 'Paid' && (
            <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-3 flex items-center justify-between shadow-lg shadow-red-500/20 mx-4 mt-4 rounded-[20px] backdrop-blur-md">
               <div className="flex items-center gap-2">
                 <AlertCircle size={18} strokeWidth={2.5} className="animate-pulse shadow-sm" />
                 <p className="text-[13px] font-bold tracking-wide">Bạn có {overdueCount} hóa đơn quá hạn!</p>
               </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info("Chức năng thanh toán đang được phát triển");
                  }}
                  className="bg-white/20 hover:bg-white text-white hover:text-red-600 rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm backdrop-blur-sm"
                >
                  Thanh toán
                </button>
            </div>
          )}
        </div>

        {/* Invoice List */}
        <div className="px-5 pt-6 space-y-4">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((inv, idx) => (
              <m.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
                key={inv.id}
                onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/portal/invoices/${inv.id}`);
                  }
                }}
                className={cn(
                  "cursor-pointer transform transition-all duration-400 hover:-translate-y-1 group relative overflow-hidden",
                  inv.status === 'Overdue' ? 'bg-white border hover:border-red-300 border-red-100 rounded-[28px] p-5 shadow-[0_8px_30px_-5px_rgba(239,68,68,0.15)] ring-1 ring-red-50' :
                  inv.status === 'Paid' ? 'bg-slate-50 border border-slate-100/60 rounded-[28px] p-5 opacity-80 hover:opacity-100 shadow-sm' :
                  'bg-white border border-gray-100 rounded-[28px] p-5 hover:shadow-[0_8px_30px_-5px_rgba(245,158,11,0.15)] hover:border-amber-200 ring-1 ring-gray-50'
                )}
              >
                {/* Decorative highlight bar */}
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[28px]",
                  inv.status === 'Overdue' ? 'bg-gradient-to-b from-red-400 to-rose-600' :
                  inv.status === 'Paid' ? 'bg-gradient-to-b from-emerald-300 to-teal-500 opacity-50' :
                  'bg-gradient-to-b from-amber-300 to-orange-400'
                )} />

                {/* Header row */}
                <div className="flex justify-between items-center mb-1 pl-2">
                  <div className="text-[15px] font-black text-gray-800 tracking-tight">
                    Tháng {inv.period}
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm backdrop-blur-sm",
                    inv.status === 'Overdue' ? 'bg-red-50 text-red-600 border border-red-100' :
                    inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  )}>
                    {getStatusIcon(inv.status)} {getStatusLabel(inv.status)}
                  </div>
                </div>

                {/* Amount & Due Date */}
                <div className="space-y-1 mt-3 pl-2">
                  <div className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
                    {formatVND(inv.totalAmount)}
                  </div>
                  {inv.status !== 'Paid' && (
                    <div className={cn("text-[11px] font-bold uppercase tracking-widest", inv.status === 'Overdue' ? "text-red-500" : "text-amber-500")}>
                      {calculateDays(inv.dueDate, inv.status === 'Overdue')}
                    </div>
                  )}
                </div>

                {/* Mini breakdown */}
                <div className="bg-gray-50/50 rounded-2xl p-3 mt-4 border border-gray-100 grid grid-cols-2 gap-x-4 ml-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium">Tiền thuê</span>
                    <span className="font-bold text-gray-700">Theo HĐ</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium">Điện</span>
                    <span className="font-bold text-gray-700">Theo SD</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] mt-1.5">
                    <span className="text-gray-500 font-medium">Nước</span>
                    <span className="font-bold text-gray-700">Theo SD</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] mt-1.5">
                    <span className="text-gray-500 font-medium">Dịch vụ</span>
                    <span className="font-bold text-gray-700">Cố định</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-between items-center gap-3 mt-5 pl-2">
                  <button className="flex-1 text-xs font-black uppercase tracking-widest text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl h-11 transition-colors">
                    Chi tiết
                  </button>
                  {inv.status !== 'Paid' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Chức năng thanh toán đang được phát triển");
                      }}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] hover:-translate-y-0.5 transition-all"
                    >
                      Thanh toán
                    </button>
                  )}
                </div>
              </m.div>
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
          
          {/* Sentinel for Infinite Scroll */}
          <div ref={lastElementRef} className="h-6 w-full flex justify-center items-center">
            {isFetchingNextPage && <RefreshCw size={16} className="animate-spin text-slate-400" />}
          </div>
        </div>
      </div>
  );
};

export default InvoiceList;
