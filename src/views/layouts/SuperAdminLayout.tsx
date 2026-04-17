import React from 'react'
import { BarChart3, Building2, LayoutDashboard, LogOut, Settings, Shield, Users } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/utils'
import useAuthStore from '@/stores/authStore'

const navItems = [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Organizations', to: '/super-admin/organizations', icon: Building2 },
  { label: 'Owners', to: '/super-admin/owners', icon: Users },
  { label: 'Risk & Audit', to: '/super-admin/audit', icon: Shield },
  { label: 'Platform', to: '/super-admin/settings', icon: Settings },
]

const SuperAdminLayout: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0B1020] text-white grid grid-cols-[280px_1fr]">
      <aside className="border-r border-white/10 bg-[#0F172A] p-6 flex flex-col">
        <Link to="/super-admin/dashboard" className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300">Platform</p>
          <h1 className="text-3xl font-display font-black tracking-tight">Super Admin</h1>
        </Link>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all',
                isActive ? 'bg-white/12 text-white' : 'text-white/60 hover:bg-white/6 hover:text-white',
              )}
            >
              <item.icon size={18} />
              <span className="font-bold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Session</p>
            <p className="font-bold mt-2">{user?.fullName ?? 'Super Admin'}</p>
            <p className="text-white/50 text-sm">{user?.email ?? 'superadmin@smartstay.vn'}</p>
          </div>
          <button
            onClick={async () => {
              try {
                await logout()
                navigate('/login', { replace: true })
              } catch (error) {
                console.error('Lỗi đăng xuất:', error)
              }
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 font-bold hover:bg-white/6 transition-colors"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between bg-[#0B1020]/90 backdrop-blur">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">SmartStay SaaS</p>
            <h2 className="text-2xl font-black tracking-tight">Nền tảng giám sát đa tenant</h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
            <BarChart3 size={18} className="text-cyan-300" />
            <span className="text-sm font-bold text-white/80">Frontend scaffold v1</span>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default SuperAdminLayout
