import React, { useState } from 'react';
import { 
  Building2, Users, Home, PieChart, 
  DollarSign, AlertCircle, FileText, MessageSquare,
  Plus, Calendar, RefreshCcw, ArrowRight,
  Activity, Check, Copy, Star,
  Clock, CheckCircle2, LayoutDashboard
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn, formatDate } from '@/utils';
import useUIStore from '@/stores/uiStore';
import { dashboardService } from '@/services/dashboardService';
import { KPICard } from '@/components/data/KPICard';
import { StatusBadge } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: staffKpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'staff', 'kpis', activeBuildingId],
    queryFn: () => dashboardService.getStaffKPIs(activeBuildingId || undefined)
  });

  const { data: staffTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['dashboard', 'staff', 'tickets', activeBuildingId],
    queryFn: () => dashboardService.getStaffTickets(activeBuildingId || undefined)
  });

  const isRefreshing = queryClient.isFetching({ queryKey: ['dashboard', 'staff'] }) > 0;

  const handleRefresh = async () => {
    await queryClient.cancelQueries({ queryKey: ['dashboard', 'staff'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'staff'] });
    setLastUpdated(new Date());
    toast.info('Cập nhật dữ liệu mới nhất...');
  };

  const dashboardKPIs = [
    { title: 'Ticket gán cho tôi', value: staffKpis?.assignedTickets, icon: MessageSquare, color: 'primary' },
    { title: 'Quá hạn SLA', value: staffKpis?.slaOverdueTickets, icon: AlertCircle, color: 'danger' },
    { title: 'Ticket hôm nay', value: staffKpis?.todayTickets, icon: Clock, color: 'warning' },
    { title: 'Rating trung bình', value: staffKpis?.avgRating, icon: Star, color: 'accent' },
    { title: 'Chưa xử lý', value: staffKpis?.unprocessedTickets, icon: Activity, color: 'primary' },
    { title: 'Đang xử lý', value: staffKpis?.processingTickets, icon: RefreshCcw, color: 'warning' },
    { title: 'Hoàn thành tuần này', value: staffKpis?.completedThisWeek, icon: CheckCircle2, color: 'success' },
    { title: '% đúng hạn SLA', value: `${staffKpis?.slaOnTimeRate}%`, icon: PieChart, color: 'success' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 font-black text-primary uppercase tracking-tighter">Bảng điều khiển Nhân viên</h2>
          <p className="text-small text-muted italic">Khu vực làm việc và theo dõi hiệu suất cá nhân</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-3 bg-white border border-primary/10 rounded-xl hover:bg-primary/5 text-muted transition-all active:scale-95 shadow-sm",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCcw size={18} className={cn(isRefreshing && "animate-spin")} />
          </button>
          <div className="text-right">
             <p className="text-[9px] font-black text-muted uppercase tracking-[2px]">Last Sync</p>
             <p className="text-[10px] font-mono font-bold text-primary">{formatDate(lastUpdated, 'HH:mm:ss')}</p>
          </div>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardKPIs.slice(0, 4).map((kpi, idx) => (
          <KPICard 
            key={idx}
            title={kpi.title}
            value={kpi.value || 0}
            icon={kpi.icon as any}
            color={kpi.color as any}
            loading={kpisLoading}
          />
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardKPIs.slice(4).map((kpi, idx) => (
          <KPICard 
            key={idx}
            title={kpi.title}
            value={kpi.value || 0}
            icon={kpi.icon as any}
            color={kpi.color as any}
            loading={kpisLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Assigned Tickets */}
        <div className="lg:col-span-2 card-container p-8 bg-white/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h3 text-primary font-black uppercase tracking-widest">Vé yêu cầu được phân công</h3>
            <button onClick={() => navigate('/staff/my-tickets')} className="text-[10px] font-black text-primary hover:text-secondary tracking-widest uppercase transition-colors">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffTickets?.map((ticket: any) => (
              <div 
                key={ticket.id} 
                className="flex flex-col gap-3 p-4 hover:bg-white rounded-[24px] border border-transparent hover:border-primary/10 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black font-mono text-muted uppercase tracking-widest">{ticket.ticketCode}</span>
                    {ticket.priority === 'Critical' && <span className="bg-danger/10 text-danger text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse">Critical SLA</span>}
                  </div>
                  <StatusBadge status={ticket.status} size="sm" />
                </div>
                <h4 className="text-small font-black text-primary group-hover:text-secondary transition-colors">{ticket.title}</h4>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted mt-2 pt-2 border-t border-dashed">
                  <div className="flex items-center gap-1.5"><Home size={12} /> {ticket.roomName}</div>
                  <div className="flex items-center gap-1.5 text-danger">
                     <Clock size={12} /> SLA: {formatDate(ticket.slaDeadline, 'HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(!staffTickets || staffTickets.length === 0) && !ticketsLoading && (
            <div className="py-20 text-center opacity-40">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-success" />
              <p className="text-small font-black uppercase">Đã hết vé cần xử lý!</p>
            </div>
          )}
        </div>

        {/* Staff Quick Actions */}
        <div className="card-container p-8 bg-slate-900 text-white shadow-2xl">
          <h3 className="text-h3 text-slate-400 font-black uppercase tracking-[3px] mb-8">Thao tác nhanh</h3>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/staff/my-tickets')}
              className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <p className="text-small font-black uppercase tracking-widest">Tạo Vé mới</p>
                <p className="text-[10px] text-slate-500 italic">Báo sự cố phát sinh</p>
              </div>
            </button>
            <button 
              onClick={() => navigate('/owner/invoices')}
              className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                <FileText size={24} />
              </div>
              <div className="text-left">
                <p className="text-small font-black uppercase tracking-widest">Nhập số điện/nước</p>
                <p className="text-[10px] text-slate-500 italic">Cập nhật chỉ số định kỳ</p>
              </div>
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-primary/20 rounded-2xl border border-primary/20">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-primary">Phòng chờ trực tuyến</p>
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed italic">Vui lòng trực máy thường xuyên để phản hồi Ticket cư dân nhanh nhất.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
