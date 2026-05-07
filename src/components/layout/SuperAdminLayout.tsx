import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import useAuthStore from '@/stores/authStore';
import useUIStore from '@/stores/uiStore';
import { cn } from '@/utils';

const navItems = [
  { label: 'Bảng điều khiển', to: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Tổ chức', to: '/super-admin/organizations', icon: Building2 },
  { label: 'Owner', to: '/super-admin/owners', icon: Users },
  { label: 'Gói dịch vụ', to: '/super-admin/billing', icon: CreditCard },
  { label: 'Cấu hình hệ thống', to: '/super-admin/system-config', icon: Settings },
  { label: 'Rủi ro & Kiểm toán', to: '/super-admin/audit', icon: Shield },
  { label: 'Hỗ trợ Owner', to: '/super-admin/support', icon: LifeBuoy },
];

const SuperAdminLayout: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đăng xuất thành công');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Không thể đăng xuất');
    }
  };

  const sidebarBody = (mobile: boolean) => (
    <>
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-4">
        <Link
          to="/super-admin/dashboard"
          className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"
          onClick={() => mobile && setMobileMenuOpen(false)}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-slate-950/20">
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-display font-bold tracking-tight">SmartStay</h1>
            <p className="truncate text-[10px] font-mono tracking-[0.18em] text-white/55">Quản trị hệ thống</p>
          </div>
        </Link>
        {mobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
            className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <nav className="min-w-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/super-admin/dashboard'}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/12'
                  : 'text-white/68 hover:bg-white/7 hover:text-white',
              )
            }
          >
            <item.icon size={19} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
            {user?.username?.slice(0, 2).toUpperCase() || 'SA'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.fullName?.trim() || user?.username?.trim() || 'Quản trị viên'}
            </p>
            {user?.email ? (
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.16em] text-white/45">{user.email}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Đăng xuất"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(280px,88vw)] flex-col border-r border-white/10 bg-primary text-white shadow-2xl">
            {sidebarBody(true)}
          </aside>
        </div>
      ) : null}

      <div className="relative min-h-screen lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-0 z-50 hidden h-screen flex-col border-r border-white/10 bg-primary text-white shadow-2xl lg:flex">
          {sidebarBody(false)}
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-foreground transition hover:border-primary/25 hover:text-primary lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-secondary">Nền tảng</p>
                <h2 className="truncate text-lg font-black tracking-tight text-foreground sm:text-xl">
                  Quản trị nền tảng
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground transition hover:border-primary/25 hover:text-primary"
              aria-label={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </header>

          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1760px] min-w-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 2xl:px-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
