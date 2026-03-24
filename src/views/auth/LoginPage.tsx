import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, RefreshCcw, ShieldCheck, Smartphone, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/utils';
import useAuthStore from '@/stores/authStore';
import { toast } from 'sonner';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'smartstay-login-attempts';

interface LockoutData {
  attempts: number;
  lockedUntil: number | null; // epoch ms
}

function getLockoutData(): LockoutData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return { attempts: 0, lockedUntil: null };
}

function setLockoutData(data: LockoutData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearLockoutData() {
  localStorage.removeItem(STORAGE_KEY);
}

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', remember: false });
  const [lockRemainingMs, setLockRemainingMs] = useState(0);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect context
  const isPortal = location.pathname.includes('/portal');
  const isLocked = lockRemainingMs > 0;

  // Check lockout on mount and keep countdown ticking
  const checkLockout = useCallback(() => {
    const data = getLockoutData();
    if (data.lockedUntil) {
      const remaining = data.lockedUntil - Date.now();
      if (remaining > 0) {
        setLockRemainingMs(remaining);
      } else {
        clearLockoutData();
        setLockRemainingMs(0);
      }
    } else {
      setLockRemainingMs(0);
    }
  }, []);

  useEffect(() => {
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [checkLockout]);

  const recordFailedAttempt = () => {
    const data = getLockoutData();
    data.attempts += 1;
    if (data.attempts >= MAX_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      data.attempts = 0;
      toast.error(`Quá ${MAX_ATTEMPTS} lần thất bại. Tài khoản bị khóa 5 phút.`);
    }
    setLockoutData(data);
    checkLockout();
  };

  const setQuickLogin = (user: string, pass: string) => {
    setForm({ ...form, username: user, password: pass });
    toast.info('Đã chọn tài khoản mẫu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (form.password.length < 6) {
      toast.error('Mật khẩu yêu cầu tối thiểu 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await login(form.username, form.password, {
        allowedRoles: ['Admin', 'Staff'],
        invalidRoleMessage: 'Tài khoản này không được phép đăng nhập trang quản trị. Vui lòng dùng Cổng Cư dân.',
      });
      clearLockoutData();
      toast.success('Chào mừng trở lại!');
      navigate('/dashboard');
    } catch (err: unknown) {
      recordFailedAttempt();
      const message = err instanceof Error
        ? (err.message === 'Invalid login credentials' ? 'Thông tin đăng nhập không hợp lệ' : err.message)
        : 'Đăng nhập thất bại';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* LEFT: BRANDING SIDE */}
      <div className={cn(
        "hidden lg:flex lg:w-1/2 p-20 flex-col justify-between text-white relative transition-colors duration-700",
        isPortal ? "bg-gradient-to-br from-secondary to-[#0F766E]" : "bg-gradient-to-br from-primary to-[#2E5D9F]"
      )}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>

        <div className="relative z-10">
          <Link to="/" className="text-3xl font-display font-bold tracking-tighter hover:opacity-80 transition-opacity">
            SmartStay <span className="text-accent">BMS</span>
          </Link>
          <div className="mt-20 space-y-6">
            <h1 className="text-[48px] font-display font-bold leading-tight animate-in slide-in-from-left-6 duration-700">
              {isPortal ? (
                <>Kết nối Cư dân & <br /> Ban Quản lý</>
              ) : (
                <>Hệ thống Quản trị <br /> Toà nhà Thế hệ mới</>
              )}
            </h1>
            <p className="text-xl text-white/70 max-w-md leading-relaxed animate-in slide-in-from-left-8 duration-700 delay-100">
              {isPortal ? (
                "Thanh toán hóa đơn, gửi phản ánh và nhận thông báo ngay trên điện thoại của bạn."
              ) : (
                "Vận hành toà nhà chưa bao giờ đơn giản hơn thế. Toàn diện - Bảo mật - Thông minh."
              )}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-small text-white/50 animate-in fade-in duration-1000 delay-300">
          {isPortal ? <Smartphone className="text-accent" size={24} /> : <ShieldCheck className="text-accent" size={24} />}
          <span>
            {isPortal ? "Ứng dụng đa nền tảng, hỗ trợ iOS và Android." : "Bảo mật chuẩn Enterprise AES-256 mã hóa đầu cuối."}
          </span>
        </div>
      </div>

      {/* RIGHT: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-20 bg-bg transition-colors duration-500">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Logo mobile-only */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="text-3xl font-display font-bold tracking-tighter text-primary">
              SmartStay <span className="text-accent">BMS</span>
            </Link>
          </div>

          <div className="card-container p-10 bg-white shadow-modal border-none">
            <header className="mb-10">
              <h2 className={cn("text-h1", isPortal ? "text-secondary" : "text-primary")}>
                {isPortal ? "Cổng Cư Dân" : "Đăng nhập Quản trị"}
              </h2>
              <p className="text-body text-muted mt-2">
                {isPortal ? "Vui lòng nhập email và mật khẩu." : "Dành cho cấp quản lý và nhân viên vận hành."}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-label text-text-secondary block">
                  {isPortal ? "Email" : "Email"}
                </label>
                <div className="relative group">
                  <div className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors",
                    isPortal ? "group-focus-within:text-secondary" : "group-focus-within:text-primary"
                  )}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={isPortal ? "tenant@smartstay.vn" : "admin@smartstay.vn"}
                    className={cn(
                      "w-full pl-12 pr-4 py-3.5 border rounded-md outline-none transition-all text-body",
                      isPortal ? "focus:ring-secondary/20 focus:border-secondary" : "focus:ring-primary/20 focus:border-primary"
                    )}
                    value={form.username}
                    onChange={(e) => setForm({...form, username: e.target.value})}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-label text-text-secondary block">Mật khẩu</label>
                <div className="relative group">
                  <div className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors",
                    isPortal ? "group-focus-within:text-secondary" : "group-focus-within:text-primary"
                  )}>
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className={cn(
                      "w-full pl-12 pr-12 py-3.5 border rounded-md outline-none transition-all text-body",
                      isPortal ? "focus:ring-secondary/20 focus:border-secondary" : "focus:ring-primary/20 focus:border-primary"
                    )}
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-body">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className={cn("w-4 h-4 rounded border-gray-300", isPortal ? "text-secondary focus:ring-secondary" : "text-primary focus:ring-primary")}
                    checked={form.remember}
                    onChange={(e) => setForm({...form, remember: e.target.checked})}
                  />
                  <span className="text-muted">Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/public/forgot-password" title="Quên mật khẩu?" className={cn("font-semibold hover:underline", isPortal ? "text-secondary" : "text-primary")}>
                  Quên mật khẩu?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || isLocked}
                className={cn(
                  "w-full py-4 text-white rounded-md font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group",
                  isPortal ? "bg-secondary hover:bg-secondary-light" : "bg-primary hover:bg-primary-light"
                )}
              >
                {loading ? (
                  <RefreshCcw className="animate-spin" size={20} />
                ) : (
                  <>Đăng nhập ngay <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} /></>
                )}
              </button>
            </form>

            {/* Quick Access Section — only visible in development */}
            {import.meta.env.DEV && (
            <div className="mt-10 pt-8 border-t border-slate-100 animate-in fade-in duration-1000">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-5 italic">Truy cập nhanh (Dev)</p>
               <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setQuickLogin('admin@smartstay.vn', 'Admin@123456')}
                    className="flex flex-col items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                     <span className="text-xs font-black text-primary uppercase tracking-tighter">System Admin</span>
                     <span className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Quản trị viên</span>
                  </button>
               </div>
            </div>
            )}

            {/* SSO Option */}
            {!isPortal && (
               <div className="mt-8">
                 <div className="relative mb-6">
                   <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
                   <div className="relative flex justify-center text-small uppercase"><span className="bg-white px-4 text-muted">Hoặc</span></div>
                 </div>
                 <button className="w-full py-3.5 border border-border rounded-md font-semibold text-text hover:bg-bg transition-colors flex items-center justify-center gap-3">
                   <ShieldCheck size={20} className="text-primary" /> Đăng nhập bằng SSO / LDAP
                 </button>
               </div>
            )}

            <div className="mt-10 pt-10 border-t text-center space-y-4">
              {isPortal ? (
                <p className="text-small text-muted">Bạn là Quản trị viên? <Link to="/public/login" className="text-primary font-bold hover:underline">Vào trang Quản trị</Link></p>
              ) : (
                <p className="text-small text-muted">Bạn là Cư dân/Người thuê? <Link to="/portal/login" className="text-secondary font-bold hover:underline">Vào Cổng Cư dân</Link></p>
              )}
            </div>
          </div>

          <footer className="mt-8 text-center text-small text-muted flex items-center justify-center gap-6">
            <Link to="/" className="hover:text-text">Về trang chủ</Link>
            <span>Quy định bảo mật</span>
            <span>Trợ giúp</span>
          </footer>
        </div>
      </div>

      {/* Brute-force Lock Banner */}
      {isLocked && (
        <div className="fixed bottom-0 left-0 w-full p-4 z-50">
          <div className="max-w-md mx-auto bg-danger p-4 rounded-lg shadow-2xl text-white flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
            <ShieldAlert size={24} />
            <div>
              <p className="font-bold">Tài khoản bị khóa tạm thời</p>
              <p className="text-small opacity-80">
                Do nhập sai quá {MAX_ATTEMPTS} lần. Vui lòng quay lại sau{' '}
                {Math.floor(lockRemainingMs / 60000)}:{String(Math.floor((lockRemainingMs % 60000) / 1000)).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default LoginPage;
