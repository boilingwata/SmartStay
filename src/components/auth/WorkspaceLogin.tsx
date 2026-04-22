import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, RefreshCcw, ShieldCheck, User } from 'lucide-react'
import { cn } from '@/utils'
import { toast } from 'sonner'
import useAuthStore from '@/stores/authStore'
import { getAuthenticatedHomePath, getPostLoginRedirect } from '@/lib/authRouting'
import type { UserRoleType } from '@/types'

interface QuickLogin {
  email: string;
  password: string;
  label: string;
  helper: string;
}

interface WorkspaceLoginProps {
  title: string;
  subtitle: string;
  accentClass: string;
  panelClass: string;
  allowedRoles?: UserRoleType[];
  redirectWhenAuthenticated: UserRoleType[];
  invalidRoleMessage?: string;
  quickLogin?: QuickLogin | null;
  isSuperAdmin?: boolean;
}

const WorkspaceLogin: React.FC<WorkspaceLoginProps> = ({
  title,
  subtitle,
  accentClass,
  panelClass,
  allowedRoles,
  redirectWhenAuthenticated,
  invalidRoleMessage,
  quickLogin,
  isSuperAdmin = false,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const requestedRedirect =
    searchParams.get('redirect') ??
    ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? null)

  useEffect(() => {
    if (isAuthenticated && user && redirectWhenAuthenticated.includes(user.role)) {
      navigate(getAuthenticatedHomePath(user), { replace: true })
    }
  }, [isAuthenticated, user, navigate, redirectWhenAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password, { allowedRoles, invalidRoleMessage })

      toast.success('Đăng nhập thành công')
      navigate(getPostLoginRedirect(useAuthStore.getState().user, requestedRedirect), { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      <div className={cn('hidden lg:flex lg:w-1/2 p-20 flex-col justify-between text-white relative', panelClass)}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-display font-bold tracking-tighter">
            SmartStay <span className="text-white/70">SaaS</span>
          </Link>
          <div className="mt-24 space-y-6">
            <h1 className="text-[56px] font-display font-black leading-[1.05] tracking-tight">{title}</h1>
            <p className="text-xl text-white/75 max-w-md leading-relaxed">{subtitle}</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-small text-white/70">
          <ShieldCheck size={24} className="text-white" />
          <span>Workspace tách biệt cho từng vai trò trong mô hình SaaS đa tenant.</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-20 bg-bg">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="text-3xl font-display font-bold tracking-tighter text-primary">
              SmartStay <span className="text-accent">SaaS</span>
            </Link>
          </div>

          <div className="card-container p-10 bg-white shadow-modal border-none">
            <header className="mb-10">
              <p className={cn('text-[10px] font-black uppercase tracking-[0.3em] mb-3', accentClass)}>{isSuperAdmin ? 'Platform Access' : 'Workspace Access'}</p>
              <h2 className="text-h1 text-primary">{title}</h2>
              <p className="text-body text-muted mt-2">{subtitle}</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-label text-text-secondary block">Email</label>
                <div className="relative group">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="name@smartstay.vn"
                    className="w-full pl-12 pr-4 py-3.5 border rounded-md outline-none transition-all text-body focus:ring-primary/20 focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-label text-text-secondary block">Mật khẩu</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 border rounded-md outline-none transition-all text-body focus:ring-primary/20 focus:border-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white rounded-md font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 bg-primary hover:bg-primary-light group"
              >
                {loading ? <RefreshCcw className="animate-spin" size={20} /> : <>Đăng nhập <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} /></>}
              </button>
            </form>

            {quickLogin && (
              <div className="mt-10 pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-5 italic">Tài khoản mẫu</p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(quickLogin.email)
                    setPassword(quickLogin.password)
                    toast.info('Đã nạp tài khoản mẫu')
                  }}
                  className="w-full flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="text-xs font-black text-primary uppercase tracking-tighter">{quickLogin.label}</span>
                  <span className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">{quickLogin.helper}</span>
                </button>
              </div>
            )}

            <div className="mt-8 pt-8 border-t text-center text-small text-muted space-y-2">
              <Link to="/auth" className="text-primary font-bold hover:underline">Xem tất cả cổng đăng nhập</Link>
              {!isSuperAdmin && <p>Tenant đăng nhập tại <Link to="/login" className="text-secondary font-bold hover:underline">Portal</Link></p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkspaceLogin
