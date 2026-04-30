import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Info,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Ticket,
  User,
  AlertTriangle,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useAuthStore from '@/stores/authStore';
import useNotificationStore from '@/stores/notificationStore';
import useUIStore from '@/stores/uiStore';
import type { Notification } from '@/types/notification';
import { cn, formatRelativeTime } from '@/utils';

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
  'topbar.darkMode': 'Chế độ tối',
  'topbar.lightMode': 'Chế độ sáng',
  'topbar.notifications': 'Thông báo',
  'topbar.markAllRead': 'Đánh dấu đã đọc tất cả',
  'topbar.noNotifications': 'Không có thông báo nào',
  'topbar.viewAllNotifications': 'Xem tất cả thông báo',
  'topbar.profile': 'Hồ sơ cá nhân',
  'topbar.accountSettings': 'Cài đặt tài khoản',
  'auth.logout': 'Đăng xuất',
  'breadcrumbs.owner': 'Quản trị',
  'breadcrumbs.dashboard': 'Tổng quan',
  'breadcrumbs.buildings': 'Tòa nhà',
  'breadcrumbs.rooms': 'Phòng',
  'breadcrumbs.room-lifecycle': 'Vòng đời phòng',
  'breadcrumbs.handover': 'Biên bản bàn giao',
  'breadcrumbs.leads': 'Đơn thuê',
  'breadcrumbs.tenants': 'Khách thuê',
  'breadcrumbs.contracts': 'Hợp đồng',
  'breadcrumbs.addendums': 'Phụ lục',
  'breadcrumbs.invoices': 'Hóa đơn',
  'breadcrumbs.payments': 'Thanh toán',
  'breadcrumbs.tickets': 'Yêu cầu hỗ trợ',
  'breadcrumbs.reports': 'Báo cáo',
  'breadcrumbs.announcements': 'Thông báo',
  'breadcrumbs.settings': 'Cài đặt',
  'breadcrumbs.users': 'Người dùng',
  'breadcrumbs.utility-policies': 'Chính sách tiện ích',
  'breadcrumbs.utility-overrides': 'Điều chỉnh thủ công',
  'breadcrumbs.billing-runs': 'Đợt chốt chỉ số',
  'breadcrumbs.utility-billing': 'Quản lý điện nước',
  'breadcrumbs.amenities': 'Tiện ích chung',
  'breadcrumbs.assets': 'Tài sản',
  'breadcrumbs.staff': 'Nhân viên',
  'breadcrumbs.visitor-checkin': 'Kiểm tra khách',
  'breadcrumbs.amenity-checkin': 'Kiểm tra tiện ích',
  'breadcrumbs.notifications': 'Thông báo',
  'breadcrumbs.create': 'Tạo mới',
};

function isDetailSegment(segment: string) {
  return /^\d+$/.test(segment) || /^[0-9a-f-]{8,}$/i.test(segment);
}

function formatBreadcrumbLabel(segment: string, fallbackMap: Record<string, string>, t: (key: string) => string) {
  if (isDetailSegment(segment)) return 'Chi tiết';
  const key = `breadcrumbs.${segment}`;
  return fallbackMap[key] || t(key) || segment;
}

export const Topbar = ({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const hasNew = useNotificationStore((state) => state.hasNew);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const subscribe = useNotificationStore((state) => state.subscribe);
  const cleanup = useNotificationStore((state) => state.cleanup);

  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const translate = (key: string) => topbarText[key] || t(key);

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications(user.id);
    subscribe(user.id);
    return () => cleanup();
  }, [cleanup, fetchNotifications, subscribe, user?.id]);

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);

    return segments.map((segment, index) => ({
      url: `/${segments.slice(0, index + 1).join('/')}`,
      label: formatBreadcrumbLabel(segment, topbarText, t),
    }));
  }, [location.pathname, t]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/88 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1760px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted transition hover:border-primary/25 hover:text-primary lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-[0.2em] text-muted">
              Không gian quản trị SmartStay
            </p>
            <div className="mt-1 hidden min-w-0 items-center gap-2 text-sm md:flex">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.url}>
                  {index > 0 ? <ChevronRight size={14} className="text-muted/45" /> : null}
                  <Link
                    to={crumb.url}
                    className={cn(
                      'truncate transition-colors',
                      index === breadcrumbs.length - 1 ? 'font-semibold text-foreground' : 'text-muted hover:text-foreground',
                    )}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted transition hover:border-primary/25 hover:text-primary"
            title={theme === 'light' ? translate('topbar.darkMode') : translate('topbar.lightMode')}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((value) => !value)}
              className={cn(
                'relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted transition hover:border-primary/25 hover:text-primary',
                notificationsOpen && 'border-primary/25 text-primary',
              )}
              title={translate('topbar.notifications')}
            >
              <Bell size={17} />
              {hasNew ? (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-card bg-danger" />
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 w-[22rem] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                <header className="flex items-center justify-between border-b border-border/70 px-4 py-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{translate('topbar.notifications')}</h3>
                    <p className="text-xs text-muted">{unreadCount > 0 ? `${unreadCount} mới` : 'Đã xem hết'}</p>
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      onClick={() => user?.id && markAllRead(user.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition hover:bg-primary/5 hover:text-primary"
                      title={translate('topbar.markAllRead')}
                    >
                      <Check size={15} />
                    </button>
                  ) : null}
                </header>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted">
                      {translate('topbar.noNotifications')}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        icon={notificationIconMap[notification.type] || Info}
                        color={notificationColorMap[notification.type] || 'text-muted'}
                        title={notification.title}
                        time={notification.createdAt}
                        description={notification.message}
                        isRead={notification.isRead}
                        onClick={() => !notification.isRead && markRead(notification.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((value) => !value)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border bg-card px-2 py-1.5 transition hover:border-primary/25',
                userMenuOpen && 'border-primary/25 ring-4 ring-primary/5',
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="hidden min-w-0 pr-2 text-left sm:block">
                <p className="truncate text-sm font-semibold text-foreground">
                  {(() => {
                    const rawName = user?.fullName?.trim() || user?.username?.trim() || '';
                    if (!rawName) return 'Người dùng hệ thống';
                    const normalized = rawName.toLowerCase();
                    return normalized === 'system admin' || normalized === 'admin'
                      ? 'Quản trị hệ thống'
                      : rawName;
                  })()}
                </p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                  {user?.role === 'Owner' || user?.role === 'SuperAdmin'
                    ? 'Chủ nhà'
                    : user?.role === 'Tenant'
                      ? 'Người thuê'
                      : 'Nhân sự nội bộ'}
                </p>
              </div>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                <header className="border-b border-border/70 bg-primary/5 px-4 py-4">
                  <p className="truncate text-sm font-semibold text-primary">
                    {(() => {
                      const rawName = user?.fullName?.trim() || user?.username?.trim() || '';
                      if (!rawName) return 'Người dùng hệ thống';
                      const normalized = rawName.toLowerCase();
                      return normalized === 'system admin' || normalized === 'admin'
                        ? 'Quản trị hệ thống'
                        : rawName;
                    })()}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {user?.email || 'admin@smartstay.vn'}
                  </p>
                </header>
                <div className="space-y-1 p-2">
                  <UserMenuItem icon={User} label={translate('topbar.profile')} />
                  <UserMenuItem icon={Settings} label={translate('topbar.accountSettings')} />
                  <div className="my-2 border-t border-border/70" />
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        navigate('/login', { replace: true });
                      } catch {
                        return;
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-danger transition hover:bg-danger/5"
                  >
                    <LogOut size={16} />
                    {translate('auth.logout')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

const NotificationItem = ({
  icon: Icon,
  color,
  title,
  time,
  description,
  isRead = false,
  onClick,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  time: string;
  description: string;
  isRead?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex w-full items-start gap-3 border-b border-border/40 px-4 py-4 text-left transition hover:bg-primary/5',
      !isRead && 'bg-primary/4',
    )}
  >
    <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-background', color)}>
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <p className={cn('truncate text-sm', !isRead ? 'font-semibold text-foreground' : 'text-foreground/90')}>
          {title}
        </p>
        <span className="shrink-0 text-[11px] text-muted">
          {formatRelativeTime(time)}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>
    </div>
  </button>
);

const UserMenuItem = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <button className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted transition hover:bg-primary/5 hover:text-primary">
    <Icon size={16} />
    {label}
  </button>
);
