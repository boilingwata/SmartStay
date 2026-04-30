import React from 'react';
import { useNavigate, useLocation, Outlet, NavLink, Link } from 'react-router-dom';
import { ChevronLeft, Bell, Home, Receipt, Wrench, Building2, User } from 'lucide-react';
import BottomNavigation from './BottomNavigation';
import { cn } from '@/utils';
import useAuthStore from '@/stores/authStore';
import { LazyMotion, domMax } from 'framer-motion';

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
  { icon: Building2, label: 'Tiện ích',  route: '/portal/amenities' },
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
    if (path === '/portal' || path === '/portal/dashboard') return 'Tổng quan';
    if (path === '/portal/invoices') return 'Hóa đơn';
    if (path.startsWith('/portal/invoices/')) return 'Chi tiết hóa đơn';
    if (path === '/portal/tickets') return 'Hỗ trợ và yêu cầu';
    if (path === '/portal/tickets/create') return 'Gửi yêu cầu mới';
    if (path.startsWith('/portal/tickets/')) return 'Chi tiết yêu cầu';
    if (path === '/portal/amenities') return 'Tiện ích tòa nhà';
    if (path === '/portal/amenities/my-bookings') return 'Lịch đặt của tôi';
    if (path === '/portal/profile') return 'Thông tin cá nhân';
    if (path === '/portal/notifications') return 'Trung tâm thông báo';
    if (path === '/portal/visitors') return 'Đăng ký khách';
    if (path === '/portal/payments/history') return 'Lịch sử thanh toán';
    if (path === '/portal/balance') return 'Số dư và ví';
    if (path === '/portal/contract') return 'Hợp đồng thuê';
    if (path === '/portal/faq') return 'Câu hỏi thường gặp';
    if (path === '/portal/service-requests') return 'Yêu cầu dịch vụ';
    if (path === '/portal/documents') return 'Hồ sơ giấy tờ';
    return title || 'SmartStay';
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 font-sans overflow-hidden selection:bg-[#0D8A8A]/10">
      
      {/* ══════════════════════════════════
          SIDEBAR (md+ only)
      ══════════════════════════════════ */}
      <aside className="hidden md:flex flex-col shrink-0 bg-gradient-to-b from-[#0D8A8A] to-[#1B3A6B] w-16 lg:w-60 transition-all duration-300 border-r border-white/10 z-50">
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-5 border-b border-white/10 shrink-0">
          <Link to="/portal/dashboard" className="flex items-center gap-3 group transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out">
              <Building2 size={20} className="text-white" />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <span className="block font-black text-[14px] uppercase tracking-[2px] text-white">
                SmartStay
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[1.5px] text-white/70">
                Cổng cư dân
              </span>
            </div>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 space-y-2 overflow-y-auto scrollbar-hide px-2 lg:px-4">
          {sidebarNavItems.map((item) => (
            <NavLink
              key={item.route}
              to={item.route}
              end={item.route === '/portal/dashboard'}
              title={item.label}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 rounded-xl transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]',
                'h-12 w-12 lg:w-full lg:px-4 justify-center lg:justify-start mx-auto',
                isActive || (item.route === '/portal/dashboard' && isDashboard)
                  ? 'bg-white/20 text-white font-bold shadow-inner'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    strokeWidth={isActive || (item.route === '/portal/dashboard' && isDashboard) ? 2.5 : 2}
                    className="shrink-0 group-hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out"
                  />
                  <span className="hidden lg:block text-[14px] truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 lg:p-4 border-t border-white/10 shrink-0">
          <Link
            to="/portal/profile"
            title={user?.fullName || 'Hồ sơ'}
            className="group flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] hover:bg-white/10 justify-center lg:justify-start"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <User size={20} className="text-white" />
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="text-[13px] font-black text-white truncate group-hover:text-teal-200 transition-colors">
                {user?.fullName || '—'}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                Cư dân
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-gray-50">
        
        {/* TopBar */}
        <header className="absolute top-0 left-0 right-0 z-40 flex items-center px-4 md:px-6 shrink-0 transition-all duration-300 h-14 bg-gradient-to-r from-[#0D8A8A] to-[#1B3A6B] md:h-16 md:bg-white md:bg-none md:border-b md:border-slate-200 md:shadow-sm">
          {/* Back Button */}
          <div className="w-10 flex shrink-0">
            {showBack && !isDashboard && (
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white/90 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out md:text-slate-500 md:hover:bg-slate-100 md:hover:text-[#0D8A8A]"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 flex justify-center md:justify-start items-center overflow-hidden px-2">
            <h1 className="font-black text-[15px] md:text-[16px] uppercase tracking-[2px] text-white md:text-slate-800 truncate">
              {getTitleFromRoute()}
            </h1>
          </div>

          {/* Right Action */}
          <div className="w-10 flex shrink-0 items-center justify-end">
            {rightAction ? (
              rightAction
            ) : (
              <button
                onClick={() => navigate('/portal/notifications')}
                className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-white/90 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out md:text-slate-500 md:hover:bg-slate-100 md:hover:text-[#0D8A8A]"
              >
                <Bell size={22} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
                <span className="absolute top-2.5 right-2 h-2.5 w-2.5 bg-red-400 md:bg-red-500 rounded-full ring-2 ring-transparent md:ring-white animate-[bounce_2s_infinite]" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-14 md:pt-16 pb-20 md:pb-0 min-w-0 w-full xl:max-w-[1200px] xl:mx-auto overflow-y-auto custom-scrollbar">
          <LazyMotion features={domMax} strict>
            <div className="w-full h-full">
              {children !== undefined ? children : <Outlet />}
            </div>
          </LazyMotion>
        </main>

        {/* Bottom Nav — mobile only */}
        <BottomNavigation />
      </div>
    </div>
  );
};

export default PortalLayout;
