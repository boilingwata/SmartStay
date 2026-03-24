import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, CreditCard, MessageSquare, Droplets, Users, 
  ArrowRight, FileText, Receipt, AlertCircle, CalendarDays,
  Home, CheckCircle2
} from 'lucide-react';
import { cn } from '@/utils';
import { tenantDashboardService, DashboardSummary } from '@/services/tenantDashboardService';
import { differenceInDays, isPast, format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TenantDashboard() {
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

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F1F5F9]">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="h-[200px] w-full bg-slate-200 animate-pulse rounded-[24px]" />
          <div className="grid grid-cols-4 gap-3">
             {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-[16px]" />)}
          </div>
          <div className="h-[200px] bg-slate-200 animate-pulse rounded-[20px]" />
        </div>
        <div className="w-full lg:w-1/3 shrink-0 space-y-6">
          <div className="h-[240px] bg-slate-200 animate-pulse rounded-[20px]" />
          <div className="h-[200px] bg-slate-200 animate-pulse rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <AlertCircle size={48} className="mb-4 text-slate-300" />
        <p className="text-lg font-bold">Không có dữ liệu</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">Thử lại</button>
      </div>
    );
  }

  const activeContract = data.activeContract;
  const contractExpiryDays = activeContract ? differenceInDays(new Date(activeContract.endDate), new Date()) : 0;
  
  // Quick Actions Config
  const quickActions = [
    { icon: Receipt, label: 'Hóa đơn', color: 'bg-teal-50 text-teal-600', route: '/portal/invoices' },
    { icon: MessageSquare, label: 'Hỗ trợ', color: 'bg-orange-50 text-orange-600', route: '/portal/tickets' },
    { icon: Droplets, label: 'Tiện ích', color: 'bg-purple-50 text-purple-600', route: '/portal/amenities' },
    { icon: Users, label: 'Khách', color: 'bg-blue-50 text-blue-600', route: '/portal/visitors' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F1F5F9]">
      {/* LEFT COLUMN: Main Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        
        {/* 1. Hero Banner */}
        <section className="bg-gradient-to-br from-[#0D8A8A] to-[#1B3A6B] rounded-[24px] p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[12px] font-bold text-white/70 uppercase tracking-wider">
                {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight pt-1">
                Xin chào, {activeContract?.tenantName?.split(' ').pop() || 'Cư dân'}! 👋
              </h2>
            </div>
          </div>
          
          <div className="relative z-10 mt-6 pt-5 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0">
                <Home size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Căn hộ {activeContract?.roomCode || '—'}</p>
                <p className="text-[11px] text-white/70 uppercase tracking-widest truncate">{activeContract?.buildingName || '—'}</p>
              </div>
            </div>
            
            {activeContract && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm shrink-0 w-fit">
                <CalendarDays size={16} className="text-white/80 shrink-0" />
                <span className="text-xs font-semibold whitespace-nowrap">
                   Hợp đồng còn {Math.max(0, contractExpiryDays)} ngày
                </span>
              </div>
            )}
          </div>
          
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] -mr-20 -mt-20 rounded-full" />
        </section>

        {/* 2. Quick Actions */}
        <section className="grid grid-cols-4 gap-3">
          {quickActions.map(action => (
            <button 
              key={action.label}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-[16px] border border-gray-100 shadow-sm hover:shadow-md hover:border-teal-200 active:scale-[0.98] hover:scale-[1.02] transition-transform duration-200 ease-out"
            >
              <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] flex items-center justify-center shrink-0', action.color)}>
                <action.icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] sm:text-xs text-slate-700 font-bold max-w-full truncate">{action.label}</span>
            </button>
          ))}
        </section>

        {/* 3. Upcoming Invoices */}
        <section className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-black text-slate-800">Hóa đơn sắp đến</h3>
            <button onClick={() => navigate('/portal/invoices')} className="text-[12px] font-bold text-[#0D8A8A] hover:underline">Xem tất cả</button>
          </div>
          
          <div className="space-y-3">
            {data.upcomingInvoices.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                <p className="text-sm font-medium">Không có hóa đơn nợ</p>
              </div>
            ) : (
              data.upcomingInvoices.slice(0, 3).map(inv => {
                const isOverdue = inv.dueDate && isPast(new Date(inv.dueDate));
                return (
                  <div key={inv.id} className={cn(
                    "p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.99] duration-200",
                    isOverdue ? "border-red-200 bg-red-50/50" : "border-slate-100 bg-white"
                  )} onClick={() => navigate(`/portal/invoices/${inv.id}`)}>
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        isOverdue ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                      )}>
                        <Receipt size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{inv.title}</p>
                        <p className={cn("text-[11px] font-medium mt-0.5 truncate", isOverdue ? "text-red-500" : "text-slate-500")}>
                          Hạn: {inv.dueDate ? format(new Date(inv.dueDate), 'dd/MM/yyyy') : '—'}
                          {isOverdue && ' (Quá hạn)'}
                        </p>
                      </div>
                    </div>
                    <p className="text-[14px] font-black text-slate-900 shrink-0">{inv.amount?.toLocaleString()}đ</p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 4. Active Tickets */}
        <section className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-black text-slate-800">Yêu cầu đang xử lý</h3>
            <button onClick={() => navigate('/portal/tickets')} className="text-[12px] font-bold text-[#0D8A8A] hover:underline">Chi tiết</button>
          </div>
          
          <div className="space-y-3">
            {data.recentTickets.filter(t => ['Open', 'InProgress'].includes(t.status)).length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
                <p className="text-sm font-medium">Không có yêu cầu nào đang chờ</p>
              </div>
            ) : (
              data.recentTickets.filter(t => ['Open', 'InProgress'].includes(t.status)).slice(0, 2).map(ticket => {
                const slaBreached = ticket.slaDeadline && isPast(new Date(ticket.slaDeadline));
                return (
                  <div key={ticket.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3 cursor-pointer hover:bg-slate-100 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200" onClick={() => navigate(`/portal/tickets/${ticket.id}`)}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-4">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">{ticket.ticketCode}</p>
                        <p className="text-[14px] font-bold text-slate-800 truncate mt-0.5">{ticket.title}</p>
                      </div>
                      <span className="shrink-0 as px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-orange-100 text-orange-600">
                        {ticket.status === 'Open' ? 'Mới' : 'Đang xử lý'}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-[11px] font-medium mb-1">
                        <span className="text-slate-500">Tiến độ xử lý</span>
                        <span className={cn(slaBreached ? "text-red-500" : "text-slate-500")}>
                          {slaBreached ? "Quá hạn SLA" : "Trong hạn SLA"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full transition-all duration-500",
                          slaBreached ? "bg-red-500 w-full" : "bg-orange-400 w-1/2" 
                        )} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>

      {/* RIGHT COLUMN: Sidebar Summary */}
      <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-6">
        
        {/* Balance Card */}
        <section className="bg-white rounded-[20px] p-6 border border-teal-100 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[14px] font-black text-slate-500 uppercase tracking-widest">Ví của bạn</h3>
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
              <CreditCard size={20} />
            </div>
          </div>
          
          <div className="space-y-1 mb-6">
            <p className="text-[12px] font-semibold text-slate-500">Số dư khả dụng</p>
            <div className="flex items-baseline gap-1 break-all">
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {data.balance.currentBalance?.toLocaleString() || '0'}
              </p>
              <span className="text-lg font-bold text-slate-400">đ</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-6 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 min-w-0 pr-2">
              <FileText size={16} className="shrink-0" />
              <span className="text-[13px] font-medium truncate">Hóa đơn chờ thanh toán</span>
            </div>
            <span className="text-[13px] font-bold text-rose-500 shrink-0">{data.pendingInvoicesCount} mục</span>
          </div>

          <button 
            onClick={() => navigate('/portal/balance')}
            className="w-full h-12 bg-[#0D8A8A] text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out shadow-lg shadow-teal-500/20"
          >
            Thanh toán ngay <ArrowRight size={16} />
          </button>
        </section>

        {/* Announcements */}
        <section className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-black text-slate-800">Thông báo mới</h3>
            <button onClick={() => navigate('/portal/announcements')} className="text-[12px] font-bold text-[#0D8A8A] hover:underline">Tất cả</button>
          </div>
          
          <div className="space-y-4">
            {(!data.hotAnnouncements || data.hotAnnouncements.length === 0) ? (
              <div className="py-6 flex flex-col items-center justify-center text-slate-400">
                <Bell size={28} className="text-slate-300 mb-2" />
                <p className="text-[13px] font-medium">Chưa có thông báo nào</p>
              </div>
            ) : (
              data.hotAnnouncements.slice(0, 3).map(ann => (
                <div key={ann.id} className="flex gap-3 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors hover:scale-[1.01] active:scale-[0.99] duration-200" onClick={() => navigate(`/portal/announcements/${ann.id}`)}>
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 line-clamp-2 group-hover:text-[#0D8A8A] transition-colors">{ann.title}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true, locale: vi })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
