import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Home, PieChart, 
  DollarSign, AlertCircle, FileText, MessageSquare,
  Plus, Calendar, RefreshCcw, ArrowRight,
  TrendingUp, Wallet, CheckCircle2, Clock, 
  CreditCard, Smartphone, ShieldAlert, 
  Activity, Check, Copy, CloudLightning
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatVND, formatDate } from '@/utils';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import { dashboardService } from '@/services/dashboardService';
import { buildingService } from '@/services/buildingService';
import { KPICard } from '@/components/data/KPICard';
import { RevenueChart } from '@/components/data/RevenueChart';
import { OccupancyChart } from '@/components/data/OccupancyChart';
import { ElectricityChart } from '@/components/data/ElectricityChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AlertBanner } from '@/components/ui/DashboardUI';
import StaffDashboard from './staff/StaffDashboard';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const setBuilding = useUIStore((s) => s.setBuilding);
  const [period, setPeriod] = useState('Month');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch real buildings from database
  const { data: buildingsList = [] } = useQuery({
    queryKey: ['dashboard', 'buildings'],
    queryFn: () => buildingService.getBuildings(),
    staleTime: 10 * 60 * 1000,
  });

  // Queries
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard', 'kpis', activeBuildingId, period],
    queryFn: () => dashboardService.getKPIs(activeBuildingId || undefined),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard', 'revenue', activeBuildingId],
    queryFn: () => dashboardService.getRevenueChart(activeBuildingId || undefined)
  });

  const { data: occupancy, isLoading: occupancyLoading } = useQuery({
    queryKey: ['dashboard', 'occupancy', activeBuildingId],
    queryFn: () => dashboardService.getOccupancy(activeBuildingId || undefined)
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['dashboard', 'payments', activeBuildingId],
    queryFn: () => dashboardService.getRecentPayments(activeBuildingId || undefined)
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['dashboard', 'tickets', activeBuildingId],
    queryFn: () => dashboardService.getRecentTickets(activeBuildingId || undefined)
  });

  const { data: electricity, isLoading: electricityLoading } = useQuery({
    queryKey: ['dashboard', 'electricity', activeBuildingId],
    queryFn: () => dashboardService.getElectricityChart(activeBuildingId || undefined)
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: () => dashboardService.getAnalyticsAlerts()
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (id: string) => dashboardService.dismissAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard_alerts'] });
      toast.success(t('pages.dashboard.alertDismissed'));
    }
  });

  const isRefreshing = queryClient.isFetching({ queryKey: ['dashboard'] }) > 0;

  const handleRefresh = async () => {
    // 4.1.3 Manual refresh logic + Race condition handling
    await queryClient.cancelQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setLastUpdated(new Date());
    toast.info(t('pages.dashboard.refreshing'));
  };

  const isError = !kpis && !kpisLoading && !!activeBuildingId;

  const getSLALabel = (deadline?: string) => {
    if (!deadline) return { text: '--', color: 'text-muted' };
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff < 0) return { text: t('pages.dashboard.slaOverdue'), color: 'text-danger font-black' };
    if (diff < 1000 * 60 * 60) return { text: `${mins}p`, color: 'text-danger font-bold' };
    if (diff < 1000 * 60 * 60 * 4) return { text: `${hours}h ${mins}p`, color: 'text-warning font-bold' };
    return { text: `${hours}h`, color: 'text-success' };
  };

  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash': return <Wallet size={12} />;
      case 'Bank': return <CreditCard size={12} />;
      case 'VNPay': return <Smartphone size={12} />;
      case 'MoMo': return <TrendingUp size={12} />;
      default: return <DollarSign size={12} />;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case '1': navigate('/admin/invoices'); break;
          case '2': navigate('/admin/payments'); break;
          case '3': navigate('/admin/tickets'); break;
          case '4': navigate('/admin/contracts'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {isError && (
        <AlertBanner 
          message={t('pages.dashboard.serverError')} 
          onRetry={handleRefresh}
          className="mb-4"
        />
      )}
      <div className="sticky top-0 z-30 -mt-2 py-4 bg-bg/80 backdrop-blur-md border-b flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-[2px] text-muted">
           <Activity size={12} className="text-primary animate-pulse" /> {t('pages.dashboard.title')}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-lg border border-primary/10 rounded-xl shadow-xl shadow-primary/5 min-w-[240px] focus-within:ring-2 ring-primary/20 transition-all">
            <Building2 size={18} className="text-primary" />
            <select
              value={activeBuildingId || ''}
              onChange={(e) => setBuilding(Number(e.target.value))}
              className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer w-full text-small italic"
            >
              <option value="">{t('pages.dashboard.allBuildings')}</option>
              {buildingsList.map(b => (
                <option key={b.id} value={b.id}>{b.buildingName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-lg border border-primary/10 rounded-xl shadow-xl shadow-primary/5">
            <Calendar size={18} className="text-muted" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-primary cursor-pointer text-small"
            >
              <option value="Month">{t('pages.dashboard.thisMonth')}</option>
              <option value="Quarter">{t('pages.dashboard.thisQuarter')}</option>
              <option value="Year">{t('pages.dashboard.thisYear')}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex flex-col items-end mr-4">
             <span className="text-[9px] font-black text-muted uppercase tracking-widest">{t('pages.dashboard.lastSync')}</span>
             <span className="text-[10px] font-mono font-bold text-primary italic">{formatDate(lastUpdated, 'HH:mm:ss')}</span>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-3 bg-white border border-primary/10 rounded-xl hover:bg-primary/5 text-muted transition-all group shadow-sm active:scale-95",
              isRefreshing && "opacity-50 cursor-not-allowed"
            )}
            title={t('pages.dashboard.refresh')}
          >
            <RefreshCcw size={18} className={cn("group-active:rotate-180 transition-transform duration-500", isRefreshing && "animate-spin")} />
          </button>
          <button className="btn-primary flex items-center gap-2 px-6 shadow-xl shadow-primary/20">
            <Plus size={18} /> <span className="hidden sm:inline">{t('pages.dashboard.export')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t('pages.dashboard.totalBuildings')} 
          value={kpis?.totalBuildings || 0} 
          icon={Building2} 
          delta={kpis?.deltas.totalBuildings} 
          loading={kpisLoading}
          onClick={() => navigate('/admin/buildings')}
        />
        <KPICard
          title={t('pages.dashboard.totalRooms')} 
          value={kpis?.totalRooms || 0} 
          icon={Home} 
          loading={kpisLoading}
          color="secondary"
          onClick={() => navigate('/admin/rooms')}
        />
        <KPICard
          title={t('pages.dashboard.occupancyRate')} 
          value={`${kpis?.occupancyRate || 0}%`} 
          icon={PieChart} 
          delta={kpis?.deltas.occupancyRate}
          loading={kpisLoading}
          color={Number(kpis?.occupancyRate) >= 80 ? 'success' : Number(kpis?.occupancyRate) >= 60 ? 'warning' : 'danger'}
        />
        <KPICard
          title={t('pages.dashboard.activeContracts')} 
          value={kpis?.activeContracts || 0} 
          icon={FileText} 
          loading={kpisLoading}
          color="accent"
          onClick={() => navigate('/admin/contracts?status=Active')}
        />
        <KPICard
          title={t('pages.dashboard.monthlyRevenue')} 
          value={kpis?.currentMonthRevenue || 0} 
          icon={Wallet} 
          isCurrency 
          delta={kpis?.deltas.currentMonthRevenue}
          loading={kpisLoading}
          color="success"
        />
        <KPICard
          title={t('pages.dashboard.totalDebt')} 
          value={kpis?.totalOverdueBalance || 0} 
          icon={AlertCircle} 
          isCurrency 
          delta={kpis?.deltas.totalOverdueBalance}
          loading={kpisLoading}
          color="danger"
          onClick={() => navigate('/admin/invoices?status=Overdue')}
        />
        <KPICard
          title={t('pages.dashboard.openTickets')} 
          value={kpis?.openTickets || 0} 
          icon={MessageSquare} 
          loading={kpisLoading}
          color={Number(kpis?.openTickets) > 5 ? 'warning' : 'primary'}
          onClick={() => navigate('/admin/tickets')}
        />
        <KPICard
          title={t('pages.dashboard.occupiedRooms')} 
          value={kpis?.occupiedRooms || 0} 
          icon={Users} 
          loading={kpisLoading}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-container p-8 bg-white/40 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <TrendingUp size={160} />
          </div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-h2 text-primary font-black uppercase tracking-tighter">{t('pages.dashboard.revenueProfit')}</h3>
              <p className="text-small text-muted italic">{t('pages.dashboard.profitForecast')}</p>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase"><div className="w-2 h-2 rounded-full bg-primary"></div> {t('pages.dashboard.revenue')}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase"><div className="w-2 h-2 rounded-full bg-accent"></div> {t('pages.dashboard.profit')}</span>
            </div>
          </div>
          <RevenueChart data={revenueData || []} loading={revenueLoading} />
        </div>

        <div className="card-container p-8 flex flex-col items-center bg-white/40 backdrop-blur-md">
          <h3 className="text-h3 text-primary font-black uppercase tracking-widest mb-6 w-full">{t('pages.dashboard.vacancyRate')}</h3>
          <OccupancyChart data={occupancy || { occupied:0, vacant:0, maintenance:0, reserved:0, totalOccupancyRate:0 }} loading={occupancyLoading} />
        </div>

        <div className="card-container p-8 bg-white/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h3 text-primary font-black uppercase tracking-widest">{t('pages.dashboard.recentPayments')}</h3>
            <button onClick={() => navigate('/admin/payments')} className="text-[10px] font-black text-primary hover:text-secondary tracking-widest uppercase transition-colors">{t('pages.dashboard.viewAll')}</button>
          </div>
          <div className="space-y-4">
            {payments?.map((payment) => (
              <div 
                key={payment.id} 
                className="flex items-center justify-between p-4 hover:bg-white rounded-[20px] transition-all group border border-transparent hover:border-primary/5 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black shadow-inner">
                    {payment.tenantName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-small font-black text-primary hover:underline cursor-pointer" onClick={() => navigate(`/admin/tenants/${payment.id}`)}>{payment.tenantName}</h4>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-muted font-mono font-bold">{payment.transactionCode}</span>
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(payment.transactionCode)
                              .then(() => {
                                setCopiedTxId(payment.id);
                                toast.success(t('pages.dashboard.copiedTxCode'));
                                setTimeout(() => setCopiedTxId(null), 2000);
                              })
                              .catch(() => {
                                toast.error(t('common.error.copyFailed') || 'Không thể sao chép');
                              });
                          } else {
                            toast.error(t('common.error.clipboardNotSupported') || 'Trình duyệt không hỗ trợ sao chép');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bg rounded transition-all"
                       >
                         {copiedTxId === payment.id ? <Check size={10} className="text-success" /> : <Copy size={10} className="text-muted" />}
                       </button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                     <p className="text-small font-black text-secondary">{formatVND(payment.amount)}</p>
                     <span className="text-muted opacity-50">{getMethodIcon(payment.method)}</span>
                  </div>
                  <p className="text-[10px] text-muted font-medium uppercase tracking-tighter">{formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true, locale: vi })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-container p-8 bg-white/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h3 text-primary font-black uppercase tracking-widest">{t('pages.dashboard.technicalIssues')}</h3>
            <button onClick={() => navigate('/admin/tickets')} className="text-[10px] font-black text-primary hover:text-secondary tracking-widest uppercase transition-colors">{t('pages.dashboard.viewAll')}</button>
          </div>
          <div className="space-y-4">
            {tickets?.map((ticket) => {
              const sla = getSLALabel(ticket.slaDeadline);
              return (
                <div 
                  key={ticket.id} 
                  className="flex flex-col gap-3 p-4 hover:bg-white rounded-[20px] border border-transparent hover:border-primary/5 hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        ticket.priority === 'Critical' ? 'bg-danger animate-ping' :
                        ticket.priority === 'High' ? 'bg-accent shadow-lg shadow-accent/50' :
                        ticket.priority === 'Medium' ? 'bg-warning shadow-lg shadow-warning/50' : 'bg-success shadow-lg shadow-success/50'
                      )}></div>
                      <span className="text-[10px] font-black font-mono text-muted uppercase tracking-widest">{ticket.ticketCode}</span>
                    </div>
                    <StatusBadge status={ticket.status} size="sm" />
                  </div>
                  <h4 className="text-small font-black text-primary line-clamp-1 group-hover:text-secondary transition-colors">{ticket.title}</h4>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted mt-1 border-t border-dashed pt-3">
                    <div className="flex items-center gap-1.5"><Home size={12} className="text-accent" /> {ticket.roomName}</div>
                    <div className={cn("flex items-center gap-1.5 italic", sla.color)}>
                       <Clock size={12} /> SLA: {sla.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-container p-8 bg-slate-900 text-white shadow-2xl shadow-slate-900/40">
          <h3 className="text-h3 text-slate-400 font-black uppercase tracking-[3px] mb-8">{t('pages.dashboard.quickActions')}</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileText, label: t('sidebar.invoices'), color: 'bg-primary', link: '/admin/invoices' },
              { icon: Wallet, label: t('sidebar.payments'), color: 'bg-emerald-500', link: '/admin/payments' },
              { icon: MessageSquare, label: 'Ticket', color: 'bg-orange-500', link: '/admin/tickets' },
              { icon: ShieldAlert, label: t('sidebar.contracts'), color: 'bg-indigo-500', link: '/admin/contracts' },
            ].map((btn, i) => (
              <button 
                key={i} 
                onClick={() => navigate(btn.link)}
                className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-[32px] hover:bg-white/10 hover:shadow-2xl border border-white/5 transition-all group relative overflow-hidden active:scale-95"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 transition-transform group-hover:scale-110 shadow-xl ring-4 ring-white/5", btn.color)}>
                  <btn.icon size={28} />
                </div>
                <span className="text-small font-black uppercase tracking-widest">{btn.label}</span>
                <span className="text-[9px] text-slate-500 font-mono mt-1 font-bold">Ctrl + {i+1}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card-container p-8 bg-white/40 backdrop-blur-md">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-h2 text-primary font-black uppercase tracking-tighter">{t('pages.dashboard.electricConsumption')}</h3>
                <p className="text-small text-muted italic">{t('pages.dashboard.electricDesc')}</p>
             </div>
             <div className="w-12 h-12 bg-warning/10 text-warning rounded-2xl flex items-center justify-center">
                <CloudLightning size={24} />
             </div>
          </div>
          <ElectricityChart data={electricity || []} loading={electricityLoading} />
        </div>

        <div className="lg:col-span-1 card-container p-8 border-2 border-danger/10 bg-danger/[0.02] relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-danger text-white rounded-xl flex items-center justify-center shadow-lg shadow-danger/20">
                   <AlertCircle size={22} />
                </div>
                <h3 className="text-h3 text-primary font-black uppercase tracking-widest">{t('pages.dashboard.aiWarning')}</h3>
             </div>
          </div>

          <div className="space-y-4">
            {alerts?.map((alert) => (
              <div key={alert.id} className={cn(
                "p-5 rounded-[24px] border-l-8 space-y-3 relative group/alert transition-all hover:bg-white hover:shadow-xl",
                alert.severity === 3 ? "bg-white border-danger" :
                alert.severity === 2 ? "bg-white border-warning" : "bg-white border-primary"
              )}>
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white",
                    alert.severity === 3 ? "bg-danger" : alert.severity === 2 ? "bg-warning" : "bg-primary"
                  )}>
                    {alert.severity === 3 ? 'Critical' : alert.severity === 2 ? 'Warning' : 'Info'}
                  </span>
                </div>
                <p className="text-small font-black text-primary leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const user = useAuthStore(s => s.user);
  
  if (user?.role === 'Staff') {
    return <StaffDashboard />;
  }
  
  return <AdminDashboard />;
};

export default Dashboard;
