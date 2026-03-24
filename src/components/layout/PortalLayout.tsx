import React from 'react';
import { useNavigate, useLocation, Outlet, NavLink, Link } from 'react-router-dom';
import { ChevronLeft, Bell, Home, Receipt, Wrench, Building2, User } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { cn } from '@/utils';
import useAuthStore from '@/stores/authStore';

interface PortalLayoutProps {
  /** The title to display in the header. If omitted, it will be inferred from the current route. */
  title?: string;
  /** Whether to show the back button. Default is true. */
  showBack?: boolean;
  /** Custom element to show in the top-right corner of the header. */
  rightAction?: React.ReactNode;
  /** Alternative to route-based rendering. If provided, these children will render if no nested route matches. */
  children?: React.ReactNode;
}

const sidebarNavItems = [
  { icon: Home,     label: 'Trang chủ', route: '/portal/dashboard' },
  { icon: Receipt,  label: 'Hóa đơn',   route: '/portal/invoices'  },
  { icon: Wrench,   label: 'Yêu cầu',   route: '/portal/tickets'   },
  { icon: Building2,label: 'Tiện ích',   route: '/portal/amenities' },
  { icon: User,     label: 'Hồ sơ',     route: '/portal/profile'   },
];

const PortalLayout: React.FC<PortalLayoutProps> = ({
  title,
  showBack = true,
  rightAction,
  children
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);

  const isDashboard =
    location.pathname === '/portal' || location.pathname === '/portal/dashboard';

  const getTitleFromRoute = () => {
    const path = location.pathname;
    if (path === '/portal' || path === '/portal/dashboard') return 'Dashboard';
    if (path === '/portal/invoices') return 'Hoá đơn';
    if (path.startsWith('/portal/invoices/')) return 'Chi tiết hoá đơn';
    if (path === '/portal/tickets') return 'Hỗ trợ & Ticket';
    if (path === '/portal/tickets/create') return 'Gửi yêu cầu mới';
    if (path.startsWith('/portal/tickets/')) return 'Chi tiết Ticket';
    if (path === '/portal/amenities') return 'Tiện ích tòa nhà';
    if (path === '/portal/amenities/my-bookings') return 'Lịch đặt của tôi';
    if (path === '/portal/profile') return 'Thông tin cá nhân';
    if (path === '/portal/notifications') return 'Trung tâm thông báo';
    if (path === '/portal/visitors') return 'Đăng ký khách';
    if (path === '/portal/payments/history') return 'Lịch sử thanh toán';
    if (path === '/portal/balance') return 'Số dư & Ví';
    if (path === '/portal/contract') return 'Hợp đồng thuê';
    if (path === '/portal/faq') return 'Câu hỏi thường gặp';
    if (path === '/portal/service-requests') return 'Yêu cầu dịch vụ';
    if (path === '/portal/documents') return 'Giấy tờ hồ sơ';
    return title || 'SmartStay';
  };

  return (
    <div className="h-screen w-full bg-[#F1F5F9] font-sans overflow-hidden flex justify-center selection:bg-[#0D8A8A]/10">
      <div className={cn(
        'portal-container w-full h-full overflow-hidden flex',
        // Mobile: narrow phone mockup
        'flex-col max-w-[430px] border-x border-slate-200/50 shadow-2xl bg-slate-50',
        // Desktop: full-width sidebar layout
        'lg:max-w-none lg:flex-row lg:border-x-0 lg:shadow-none lg:bg-[#F1F5F9]'
      )}>

        {/* ══════════════════════════════════
            DESKTOP SIDEBAR  (lg+ only)
        ══════════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-100 h-full">

          {/* Logo */}
          <div className="px-5 py-5 border-b border-slate-100">
            <Link to="/portal/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#0D8A8A] rounded-xl flex items-center justify-center shadow-sm">
                <Building2 size={15} className="text-white" />
              </div>
              <div>
                <span className="block font-black text-[13px] uppercase tracking-[2px] text-slate-800">
                  SmartStay
                </span>
                <span className="block text-[9px] font-bold uppercase tracking-[1px] text-slate-400">
                  Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.route}
                to={item.route}
                end={item.route === '/portal/dashboard'}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200',
                  isActive || (item.route === '/portal/dashboard' && isDashboard)
                    ? 'bg-[#0D8A8A]/10 text-[#0D8A8A]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={17}
                      strokeWidth={isActive || (item.route === '/portal/dashboard' && isDashboard) ? 2.5 : 2}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User card */}
          <div className="px-3 pb-4 pt-3 border-t border-slate-100">
            <Link
              to="/portal/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0D8A8A]/10 flex items-center justify-center shrink-0">
                <User size={14} className="text-[#0D8A8A]" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-slate-700 truncate">
                  {user?.fullName || '—'}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Cư dân
                </p>
              </div>
            </Link>
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            MAIN AREA  (phone + desktop content)
        ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 lg:bg-slate-50">

          {/* Phone header — mobile only */}
          <header className="lg:hidden h-[72px] flex items-center px-5 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 shrink-0 z-50">
            <div className="w-10">
              {showBack && !isDashboard && (
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-[#0D8A8A] hover:border-[#0D8A8A]/30 active:scale-95 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div className="flex-1 text-center space-y-0.5">
              <h1 className="font-black text-[15px] uppercase tracking-[3px] text-slate-800 truncate">
                {getTitleFromRoute()}
              </h1>
              <div className="flex justify-center">
                <div className="w-8 h-1 bg-[#0D8A8A] rounded-full opacity-20" />
              </div>
            </div>

            <div className="w-10 flex justify-end">
              {rightAction ? (
                rightAction
              ) : (
                <button
                  onClick={() => navigate('/portal/notifications')}
                  className="group relative w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-[#0D8A8A] hover:border-[#0D8A8A]/30 active:scale-95 transition-all shadow-sm"
                >
                  <Bell size={18} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                </button>
              )}
            </div>
          </header>

          {/* Desktop top bar — lg+ only */}
          <header className="hidden lg:flex h-14 items-center gap-3 px-6 bg-white border-b border-slate-100 shrink-0 z-40">
            {showBack && !isDashboard && (
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#0D8A8A] hover:bg-[#0D8A8A]/5 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h1 className="font-black text-[13px] uppercase tracking-[2px] text-slate-700">
              {getTitleFromRoute()}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => navigate('/portal/notifications')}
                className="group relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#0D8A8A] hover:bg-[#0D8A8A]/5 transition-all"
              >
                <Bell size={17} strokeWidth={2} className="group-hover:rotate-12 transition-transform" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-red-500 rounded-full ring-1 ring-white animate-pulse" />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto portal-content custom-scrollbar">
            {children !== undefined ? children : <Outlet />}
          </main>
        </div>

        {/* Bottom nav — mobile only */}
        <div className="lg:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;
