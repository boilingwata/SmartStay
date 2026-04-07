import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Droplets,
  FileText,
  Home,
  MessageSquare,
  Receipt,
  RefreshCcw,
  Users,
} from 'lucide-react';
import { differenceInDays, format, formatDistanceToNow, isPast } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { vi } from 'date-fns/locale';
import { cn } from '@/utils';
import { tenantDashboardService, type DashboardInvoice, type DashboardSummary } from '@/services/tenantDashboardService';
import { useTenantDashboardRealtime } from '@/hooks/useTenantDashboardRealtime';

const DASHBOARD_TIMEZONE = 'Asia/Ho_Chi_Minh';

const quickActions = [
  { icon: Receipt, label: 'Hoa don', color: 'bg-teal-50 text-teal-600', route: '/portal/invoices' },
  { icon: MessageSquare, label: 'Ho tro', color: 'bg-orange-50 text-orange-600', route: '/portal/tickets' },
  { icon: Droplets, label: 'Tien ich', color: 'bg-purple-50 text-purple-600', route: '/portal/amenities' },
  { icon: Users, label: 'Khach', color: 'bg-blue-50 text-blue-600', route: '/portal/visitors' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function DashboardSectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

function DashboardSectionEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof AlertCircle;
  title: string;
  description: string;
}) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
        <Icon size={22} className="text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-400">{description}</p>
    </div>
  );
}

function DashboardSectionError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm font-semibold text-slate-700">Khong the tai du lieu</p>
      <p className="mt-1 max-w-xs text-xs text-slate-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <RefreshCcw size={14} />
        Thu lai
      </button>
    </div>
  );
}

function UpcomingInvoices({
  invoices,
  loading,
  error,
  onRetry,
  onOpen,
}: {
  invoices: DashboardInvoice[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (invoiceId: string) => void;
}) {
  if (loading) {
    return <DashboardSectionSkeleton />;
  }

  if (error) {
    return <DashboardSectionError message={error} onRetry={onRetry} />;
  }

  if (invoices.length === 0) {
    return (
      <DashboardSectionEmpty
        icon={CheckCircle2}
        title="Khong co hoa don can thanh toan"
        description="Tat ca hoa don hien tai da duoc thanh toan hoac chua den ky lap."
      />
    );
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => {
        const isOverdue = invoice.dueDate ? isPast(new Date(invoice.dueDate)) : false;

        return (
          <button
            key={invoice.id}
            onClick={() => onOpen(invoice.id)}
            className={cn(
              'w-full rounded-2xl border p-3 text-left transition hover:bg-slate-50',
              isOverdue ? 'border-red-200 bg-red-50/60' : 'border-slate-100 bg-white'
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isOverdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  <Receipt size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-slate-800">{invoice.title}</p>
                  <p className={cn('mt-0.5 truncate text-[11px] font-medium', isOverdue ? 'text-red-500' : 'text-slate-500')}>
                    Han: {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd/MM/yyyy') : 'Chua co'}
                    {isOverdue ? ' (Qua han)' : ''}
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-[14px] font-black text-slate-900">{formatCurrency(invoice.amount)}d</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function RecentTickets({
  summary,
  loading,
  error,
  onRetry,
  onOpen,
}: {
  summary: DashboardSummary | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (ticketId: string) => void;
}) {
  if (loading) {
    return <DashboardSectionSkeleton rows={2} />;
  }

  if (error) {
    return <DashboardSectionError message={error} onRetry={onRetry} />;
  }

  const tickets = (summary?.recentTickets ?? []).filter((ticket) =>
    ['Open', 'InProgress'].includes(ticket.status)
  );

  if (tickets.length === 0) {
    return (
      <DashboardSectionEmpty
        icon={CheckCircle2}
        title="Khong co yeu cau dang xu ly"
        description="Mọi yeu cau gan day da duoc dong hoac chua co ticket moi."
      />
    );
  }

  return (
    <div className="space-y-3">
      {tickets.slice(0, 2).map((ticket) => {
        const slaBreached = ticket.slaDeadline ? isPast(new Date(ticket.slaDeadline)) : false;

        return (
          <button
            key={ticket.id}
            onClick={() => onOpen(ticket.id)}
            className="w-full rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-left transition hover:bg-slate-100"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-slate-500">{ticket.ticketCode}</p>
                <p className="mt-0.5 truncate text-[14px] font-bold text-slate-800">{ticket.title}</p>
              </div>
              <span className="shrink-0 rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase text-orange-600">
                {ticket.status === 'Open' ? 'Moi' : 'Dang xu ly'}
              </span>
            </div>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] font-medium">
                <span className="text-slate-500">Tien do xu ly</span>
                <span className={slaBreached ? 'text-red-500' : 'text-slate-500'}>
                  {slaBreached ? 'Qua han SLA' : 'Trong han SLA'}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={cn('h-full rounded-full', slaBreached ? 'w-full bg-red-500' : 'w-1/2 bg-orange-400')} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function NotificationList({
  summary,
  loading,
  error,
  onRetry,
  onOpenAll,
}: {
  summary: DashboardSummary | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenAll: () => void;
}) {
  if (loading) {
    return <DashboardSectionSkeleton rows={3} />;
  }

  if (error) {
    return <DashboardSectionError message={error} onRetry={onRetry} />;
  }

  const notifications = summary?.hotAnnouncements ?? [];

  if (notifications.length === 0) {
    return (
      <DashboardSectionEmpty
        icon={Bell}
        title="Chua co thong bao moi"
        description="He thong chua ghi nhan thong bao nao cho tai khoan nay."
      />
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          onClick={onOpenAll}
          className="flex w-full gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
        >
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          <div className="min-w-0">
            <p className="line-clamp-2 text-[13px] font-bold text-slate-800">{notification.title}</p>
            <p className="mt-1 line-clamp-2 text-[12px] text-slate-500">{notification.message}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function TenantDashboard() {
  const navigate = useNavigate();
  const dashboardQuery = useQuery({
    queryKey: ['tenant-dashboard'],
    queryFn: () => tenantDashboardService.getSummary(),
    staleTime: 30_000,
    retry: 1,
  });

  const summary = dashboardQuery.data;
  const errorMessage = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : 'Da xay ra loi khi tai dashboard.';

  useTenantDashboardRealtime({
    tenantId: summary?.context.tenantId,
    profileId: summary?.context.profileId,
    contractIds: summary?.context.contractIds,
  });

  const activeContract = summary?.activeContract ?? null;
  const contractExpiryDays = activeContract ? differenceInDays(new Date(activeContract.endDate), new Date()) : 0;
  const displayName = useMemo(() => activeContract?.tenantName?.split(' ').pop() || 'Cu dan', [activeContract?.tenantName]);

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-[#F1F5F9] p-4 sm:p-6 lg:flex-row lg:p-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <section className="relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0D8A8A] to-[#1B3A6B] p-6 text-white shadow-lg">
          {dashboardQuery.isLoading ? (
            <div className="space-y-4">
              <div className="h-4 w-40 rounded-full bg-white/15 animate-pulse" />
              <div className="h-10 w-2/3 rounded-2xl bg-white/15 animate-pulse" />
              <div className="mt-10 h-12 w-full rounded-2xl bg-white/10 animate-pulse" />
            </div>
          ) : dashboardQuery.isError ? (
            <div className="relative z-10 max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Tong quan cu dan</p>
              <h2 className="mt-2 text-2xl font-black">Khong the tai thong tin hop dong</h2>
              <p className="mt-2 text-sm text-white/75">{errorMessage}</p>
              <button
                onClick={() => dashboardQuery.refetch()}
                className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
              >
                Thu lai
              </button>
            </div>
          ) : activeContract ? (
            <>
              <div className="relative z-10 flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">
                    {formatInTimeZone(new Date(), DASHBOARD_TIMEZONE, 'EEEE, dd/MM/yyyy', { locale: vi })}
                  </p>
                  <h2 className="pt-1 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                    Xin chao, {displayName}
                  </h2>
                </div>
              </div>

              <div className="relative z-10 mt-6 flex flex-col gap-4 border-t border-white/20 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Home size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">Phong {activeContract.roomCode || '--'}</p>
                    <p className="truncate text-[11px] uppercase tracking-widest text-white/70">{activeContract.buildingName || '--'}</p>
                  </div>
                </div>

                <div className="flex w-fit shrink-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <CalendarDays size={16} className="shrink-0 text-white/80" />
                  <span className="whitespace-nowrap text-xs font-semibold">
                    Hop dong con {Math.max(0, contractExpiryDays)} ngay
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-10 max-w-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Tong quan cu dan</p>
              <h2 className="mt-2 text-2xl font-black">Chua co hop dong dang hoat dong</h2>
              <p className="mt-2 text-sm text-white/75">
                Tai khoan nay da duoc xac thuc nhung hien chua co ban ghi hop dong active trong `smartstay.contracts`.
              </p>
            </div>
          )}

          <div className="absolute -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/5 blur-[80px] top-0 right-0" />
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 rounded-[16px] border border-gray-100 bg-white p-3 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-[12px] sm:h-12 sm:w-12', action.color)}>
                <action.icon size={22} strokeWidth={2.5} />
              </div>
              <span className="max-w-full truncate text-[11px] font-bold text-slate-700 sm:text-xs">{action.label}</span>
            </button>
          ))}
        </section>

        <section className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-black text-slate-800">Hoa don sap den</h3>
            <button onClick={() => navigate('/portal/invoices')} className="text-[12px] font-bold text-[#0D8A8A] hover:underline">
              Xem tat ca
            </button>
          </div>

          <UpcomingInvoices
            invoices={summary?.upcomingInvoices ?? []}
            loading={dashboardQuery.isLoading}
            error={dashboardQuery.isError ? errorMessage : null}
            onRetry={() => dashboardQuery.refetch()}
            onOpen={(invoiceId) => navigate(`/portal/invoices/${invoiceId}`)}
          />
        </section>

        <section className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-black text-slate-800">Yeu cau dang xu ly</h3>
            <button onClick={() => navigate('/portal/tickets')} className="text-[12px] font-bold text-[#0D8A8A] hover:underline">
              Chi tiet
            </button>
          </div>

          <RecentTickets
            summary={summary}
            loading={dashboardQuery.isLoading}
            error={dashboardQuery.isError ? errorMessage : null}
            onRetry={() => dashboardQuery.refetch()}
            onOpen={(ticketId) => navigate(`/portal/tickets/${ticketId}`)}
          />
        </section>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-6 lg:w-1/3">
        <section className="rounded-[20px] border border-teal-100 bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-500">Vi cua ban</h3>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CreditCard size={20} />
            </div>
          </div>

          {dashboardQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-10 w-40 rounded-2xl bg-slate-100 animate-pulse" />
              <div className="h-14 w-full rounded-xl bg-slate-100 animate-pulse" />
            </div>
          ) : dashboardQuery.isError ? (
            <DashboardSectionError message={errorMessage} onRetry={() => dashboardQuery.refetch()} />
          ) : (
            <>
              <div className="mb-6 space-y-1">
                <p className="text-[12px] font-semibold text-slate-500">So du hien tai</p>
                <div className="flex items-baseline gap-1 break-all">
                  <p className="text-3xl font-black tracking-tight text-slate-900">
                    {formatCurrency(summary?.balance.currentBalance ?? 0)}
                  </p>
                  <span className="text-lg font-bold text-slate-400">d</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cap nhat luc{' '}
                  {summary?.balance.lastUpdatedAt
                    ? format(new Date(summary.balance.lastUpdatedAt), 'HH:mm dd/MM/yyyy')
                    : '--'}
                </p>
              </div>

              <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="min-w-0 pr-2 flex items-center gap-2 text-slate-600">
                  <FileText size={16} className="shrink-0" />
                  <span className="truncate text-[13px] font-medium">Hoa don cho thanh toan</span>
                </div>
                <span className="shrink-0 text-[13px] font-bold text-rose-500">{summary?.pendingInvoicesCount ?? 0} muc</span>
              </div>

              <button
                onClick={() => navigate('/portal/balance')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D8A8A] text-[13px] font-bold text-white shadow-lg shadow-teal-500/20 transition hover:brightness-105"
              >
                Xem chi tiet so du <ArrowRight size={16} />
              </button>
            </>
          )}
        </section>

        <section className="rounded-[20px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-black text-slate-800">Thong bao moi</h3>
            <button onClick={() => navigate('/portal/notifications')} className="text-[12px] font-bold text-[#0D8A8A] hover:underline">
              Tat ca
            </button>
          </div>

          <NotificationList
            summary={summary}
            loading={dashboardQuery.isLoading}
            error={dashboardQuery.isError ? errorMessage : null}
            onRetry={() => dashboardQuery.refetch()}
            onOpenAll={() => navigate('/portal/notifications')}
          />
        </section>
      </div>
    </div>
  );
}
