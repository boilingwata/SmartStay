import React, { useEffect, useState } from 'react';
import {
  Search,
  Bell,
  User,
  Menu,
  ChevronRight,
  HelpCircle,
  Settings,
  LogOut,
  Info,
  AlertTriangle,
  Moon,
  Sun,
  CreditCard,
  FileText,
  Ticket,
  Check,
} from 'lucide-react';
import { cn } from '@/utils';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import useNotificationStore from '@/stores/notificationStore';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Notification } from '@/types/notification';

const notificationIconMap: Record<Notification['type'], React.ElementType> = {
  payment: CreditCard,
  overdue: AlertTriangle,
  ticket: Ticket,
  system: Info,
  contract: FileText,
};

const notificationColorMap: Record<Notification['type'], string> = {
  payment: 'text-success',
  overdue: 'text-warning',
  ticket: 'text-primary',
  system: 'text-muted',
  contract: 'text-accent',
};

const topbarText: Record<string, string> = {
  'topbar.search': 'Tìm kiếm nhanh [Ctrl+K]...',
  'topbar.darkMode': 'Chế độ tối',
  'topbar.lightMode': 'Chế độ sáng',
  'topbar.notifications': 'Thông báo',
  'topbar.markAllRead': 'Đánh dấu đã đọc tất cả',
  'topbar.noNotifications': 'Không có thông báo nào',
  'topbar.viewAllNotifications': 'Xem tất cả thông báo',
  'topbar.profile': 'Hồ sơ cá nhân',
  'topbar.accountSettings': 'Cài đặt tài khoản',
  'auth.logout': 'Đăng xuất',
  'breadcrumbs.owner': 'Chủ sở hữu',
  'breadcrumbs.super-admin': 'Siêu quản trị',
  'breadcrumbs.dashboard': 'Tổng quan',
  'breadcrumbs.buildings': 'Tòa nhà',
  'breadcrumbs.rooms': 'Phòng',
  'breadcrumbs.tenants': 'Cư dân',
  'breadcrumbs.owners': 'Chủ sở hữu',
  'breadcrumbs.contracts': 'Hợp đồng',
  'breadcrumbs.invoices': 'Hóa đơn',
  'breadcrumbs.payments': 'Thanh toán',
  'breadcrumbs.tickets': 'Yêu cầu hỗ trợ',
  'breadcrumbs.reports': 'Báo cáo',
  'breadcrumbs.announcements': 'Thông báo',
  'breadcrumbs.settings': 'Cài đặt',
  'breadcrumbs.users': 'Người dùng',
  'breadcrumbs.utility-policies': 'Chính sách điện nước',
  'breadcrumbs.utility-overrides': 'Điều chỉnh thủ công',
  'breadcrumbs.billing-runs': 'Đợt tính phí',
};

export const Topbar = ({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const hasNew = useNotificationStore((s) => s.hasNew);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const subscribe = useNotificationStore((s) => s.subscribe);
  const cleanup = useNotificationStore((s) => s.cleanup);

  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useTranslation();
  const tt = (key: string) => topbarText[key] || t(key);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications(user.id);
    subscribe(user.id);
    return () => cleanup();
  }, [cleanup, fetchNotifications, subscribe, user?.id]);

  const pathSegments = location.pathname.split('/').filter((p) => p);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const key = `breadcrumbs.${segment}`;
    const translated = tt(key);
    const fallback = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label: translated !== key ? translated : fallback, url };
  });

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 px-8 backdrop-blur-md transition-all duration-300',
        sidebarOpen ? 'ml-[260px]' : 'ml-[72px]',
        'lg:ml-auto',
      )}
    >
      <div className="flex items-center gap-6">
        <button onClick={onMobileMenuToggle} className="rounded-lg p-2 text-primary transition-colors hover:bg-bg lg:hidden">
          <Menu size={20} />
        </button>

        <div className="hidden items-center gap-2 text-small md:flex">
          <Link to="/" className="text-muted transition-colors hover:text-primary">
            SmartStay BMS
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight size={14} className="text-muted/40" />
              <Link
                to={crumb.url}
                className={cn('font-medium transition-colors', i === breadcrumbs.length - 1 ? 'font-bold text-primary' : 'text-muted hover:text-primary')}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="group relative mx-space-6 hidden max-w-md flex-1 lg:flex">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
        <input
          type="text"
          placeholder={tt('topbar.search')}
          className="w-full rounded-xl border-none bg-background py-2.5 pl-12 pr-12 text-body outline-none transition-all placeholder:text-muted/60 focus:bg-card focus:ring-2 focus:ring-primary/10"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-bold text-muted shadow-sm">
          Ctrl K
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="group relative rounded-full p-2.5 text-muted transition-all hover:bg-bg"
          title={theme === 'light' ? tt('topbar.darkMode') : tt('topbar.lightMode')}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-warning" />}
          <span className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-[10px] whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
            {theme === 'light' ? tt('topbar.darkMode') : tt('topbar.lightMode')}
          </span>
        </button>

        <button className="relative rounded-full p-2.5 text-muted transition-all hover:bg-bg">
          <HelpCircle size={20} />
        </button>

        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn('relative rounded-full p-2.5 text-muted transition-all hover:bg-bg', notificationsOpen && 'bg-bg text-primary')}
          >
            <Bell size={20} />
            {hasNew && <span className="absolute right-2 top-2 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-white bg-danger ring-2 ring-danger/10" />}
          </button>

          {notificationsOpen && (
            <div className="animate-in slide-in-from-top-4 fade-in zoom-in absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-300">
              <header className="flex items-center justify-between border-b bg-bg/30 p-4">
                <h3 className="text-h3 text-primary">{tt('topbar.notifications')}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase italic text-primary">
                        {`${unreadCount} mới`}
                      </span>
                      <button
                        onClick={() => user?.id && markAllRead(user.id)}
                        className="text-[10px] text-muted transition-colors hover:text-primary"
                        title={tt('topbar.markAllRead')}
                      >
                        <Check size={14} />
                      </button>
                    </>
                  )}
                </div>
              </header>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted">{tt('topbar.noNotifications')}</div>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      icon={notificationIconMap[n.type] || Info}
                      color={notificationColorMap[n.type] || 'text-muted'}
                      title={n.title}
                      time={n.createdAt}
                      desc={n.message}
                      isRead={n.isRead}
                      onClick={() => !n.isRead && markRead(n.id)}
                    />
                  ))
                )}
              </div>
              <footer className="bg-bg/20 p-3 text-center">
                <button className="text-small font-bold text-primary hover:underline">{tt('topbar.viewAllNotifications')}</button>
              </footer>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn('flex items-center gap-3 rounded-full border border-border p-1 transition-all hover:border-primary', userMenuOpen && 'border-primary ring-4 ring-primary/5')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-lg shadow-primary/20">
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="animate-in slide-in-from-top-4 fade-in zoom-in absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-300">
              <header className="border-b bg-primary/5 p-4">
                <p className="truncate text-sm font-bold leading-none text-primary">{user?.fullName || 'Quản trị viên'}</p>
                <p className="mt-1 truncate text-[10px] text-muted">{user?.email || 'admin@smartstay.vn'}</p>
              </header>
              <div className="space-y-1 p-2">
                <UserMenuItem icon={User} label={tt('topbar.profile')} />
                <UserMenuItem icon={Settings} label={tt('topbar.accountSettings')} />
                <div className="my-2 border-t border-border/50" />
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      navigate('/login', { replace: true });
                    } catch (error) {
                      console.error('Lỗi đăng xuất:', error);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-danger transition-all hover:bg-danger/5"
                >
                  <LogOut size={16} /> {tt('auth.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return new Date(dateStr).toLocaleDateString('vi-VN');
}

const NotificationItem = ({
  icon: Icon,
  color,
  title,
  time,
  desc,
  isRead = false,
  onClick,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  time: string;
  desc: string;
  isRead?: boolean;
  onClick?: () => void;
}) => (
  <div
    className={cn('group cursor-pointer border-b border-border/30 p-4 transition-colors hover:bg-bg/50', !isRead && 'bg-primary/5')}
    onClick={onClick}
  >
    <div className="flex gap-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-white shadow-sm', color)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <h4 className={cn('truncate text-small', !isRead ? 'font-bold text-text' : 'font-medium text-muted')}>{title}</h4>
          <span className="ml-2 whitespace-nowrap text-[10px] text-muted">{formatTimeAgo(time)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-small leading-relaxed text-muted">{desc}</p>
      </div>
    </div>
  </div>
);

const UserMenuItem = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-all hover:bg-primary/5 hover:text-primary">
    <Icon size={16} /> {label}
  </button>
);
