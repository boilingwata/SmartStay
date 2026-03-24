import React, { useState, useEffect } from 'react';
import {
  Search, Bell, User, Menu, ChevronRight,
  HelpCircle, Settings, LogOut, CheckCircle2,
  Info, AlertTriangle, X, Moon, Sun,
  CreditCard, FileText, Ticket, Check
} from 'lucide-react';
import { cn } from '@/utils';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import useNotificationStore from '@/stores/notificationStore';
import { useLocation, Link } from 'react-router-dom';
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

export const Topbar = ({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) => {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, theme, toggleTheme } = useUIStore();
  const { notifications, unreadCount, hasNew, fetchNotifications, markRead, markAllRead, subscribe, cleanup } = useNotificationStore();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications(user.id);
    subscribe(user.id);
    return () => cleanup();
  }, [user?.id]);

  // Breadcrumb generator using i18n
  const pathSegments = location.pathname.split('/').filter(p => p);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const key = `breadcrumbs.${segment}`;
    const translated = t(key);
    const label = translated !== key ? translated : segment.charAt(0).toUpperCase() + segment.slice(1);
    return { label, url };
  });

  return (
    <header className={cn(
      "h-16 bg-card/80 border-b border-border px-8 flex items-center justify-between sticky top-0 z-40 transition-all duration-300 backdrop-blur-md",
      sidebarOpen ? "ml-[260px]" : "ml-[72px]",
      "lg:ml-auto" 
    )}>
      {/* 4.1 Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onMobileMenuToggle} 
          className="lg:hidden p-2 hover:bg-bg rounded-lg text-primary transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2 text-small">
          <Link to="/" className="text-muted hover:text-primary transition-colors">SmartStay BMS</Link>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight size={14} className="text-muted/40" />
              <Link 
                to={crumb.url} 
                className={cn(
                  "font-medium transition-colors",
                  i === breadcrumbs.length - 1 ? "text-primary font-bold" : "text-muted hover:text-primary"
                )}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4.1 Center: Global Search (Cmd+K) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-space-6 relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder={t('topbar.search')} 
          className="w-full pl-12 pr-12 py-2.5 bg-background border-none rounded-xl text-body focus:ring-2 focus:ring-primary/10 focus:bg-card outline-none transition-all placeholder:text-muted/60"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-card border border-border px-1.5 py-0.5 rounded text-[10px] font-bold text-muted shadow-sm">
          ⌘ K
        </div>
      </div>

      {/* 4.1 Right: Tools */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-muted hover:bg-bg rounded-full transition-all relative group"
          title={theme === 'light' ? t('topbar.darkMode') : t('topbar.lightMode')}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} className="text-warning" />}
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {theme === 'light' ? t('topbar.darkMode') : t('topbar.lightMode')}
          </span>
        </button>

        {/* Help */}
        <button className="p-2.5 text-muted hover:bg-bg rounded-full transition-all relative">
          <HelpCircle size={20} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              "p-2.5 text-muted hover:bg-bg rounded-full transition-all relative",
              notificationsOpen && "bg-bg text-primary"
            )}
          >
            <Bell size={20} />
            {hasNew && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white ring-2 ring-danger/10 animate-pulse"></span>}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-card shadow-2xl rounded-2xl border border-border overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
              <header className="p-4 border-b flex justify-between items-center bg-bg/30">
                <h3 className="text-h3 text-primary">{t('topbar.notifications')}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <>
                      <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase italic">
                        {t('topbar.newCount', { count: unreadCount })}
                      </span>
                      <button
                        onClick={() => user?.id && markAllRead(user.id)}
                        className="text-[10px] text-muted hover:text-primary transition-colors"
                        title={t('topbar.markAllRead')}
                      >
                        <Check size={14} />
                      </button>
                    </>
                  )}
                </div>
              </header>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">
                    {t('topbar.noNotifications')}
                  </div>
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
              <footer className="p-3 bg-bg/20 text-center">
                <button className="text-small font-bold text-primary hover:underline">{t('topbar.viewAllNotifications')}</button>
              </footer>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex items-center gap-3 p-1 rounded-full border border-border hover:border-primary transition-all",
              userMenuOpen && "border-primary ring-4 ring-primary/5"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/20">
              {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card shadow-2xl rounded-2xl border border-border overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
              <header className="p-4 bg-primary/5 border-b">
                <p className="text-sm font-bold text-primary truncate leading-none">{user?.fullName || 'Administrator'}</p>
                <p className="text-[10px] text-muted mt-1 truncate">{user?.email || 'admin@smartstay.vn'}</p>
              </header>
              <div className="p-2 space-y-1">
                <UserMenuItem icon={User} label={t('topbar.profile')} />
                <UserMenuItem icon={Settings} label={t('topbar.accountSettings')} />
                <div className="border-t my-2 border-border/50"></div>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-danger hover:bg-danger/5 transition-all text-sm font-bold"
                >
                  <LogOut size={16} /> {t('auth.logout')}
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

const NotificationItem = ({ icon: Icon, color, title, time, desc, isRead = false, onClick }: { icon: React.ElementType, color: string, title: string, time: string, desc: string, isRead?: boolean, onClick?: () => void }) => (
  <div
    className={cn(
      "p-4 hover:bg-bg/50 transition-colors border-b border-border/30 group cursor-pointer",
      !isRead && "bg-primary/5"
    )}
    onClick={onClick}
  >
    <div className="flex gap-4">
      <div className={cn("w-10 h-10 rounded-xl bg-white shadow-sm border border-border/50 flex items-center justify-center shrink-0", color)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h4 className={cn("text-small truncate", !isRead ? "font-bold text-text" : "font-medium text-muted")}>{title}</h4>
          <span className="text-[10px] text-muted whitespace-nowrap ml-2">{formatTimeAgo(time)}</span>
        </div>
        <p className="text-small text-muted line-clamp-2 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  </div>
);

const UserMenuItem = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted hover:text-primary hover:bg-primary/5 transition-all text-sm font-medium">
    <Icon size={16} /> {label}
  </button>
);
