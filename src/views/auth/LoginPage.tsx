import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, RefreshCcw, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils';
import useAuthStore from '@/stores/authStore';
import { getAuthenticatedHomePath, getPostLoginRedirect } from '@/lib/authRouting';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'smartstay-login-attempts';
const LOGIN_FONT_STACK = '"Inter", "Roboto", "Segoe UI", system-ui, -apple-system, sans-serif';

interface LockoutData {
  attempts: number;
  lockedUntil: number | null;
}

function getLockoutData(): LockoutData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LockoutData;
  } catch {
    // Ignore corrupted local data and treat as no lockout.
  }

  return { attempts: 0, lockedUntil: null };
}

function setLockoutData(data: LockoutData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearLockoutData() {
  localStorage.removeItem(STORAGE_KEY);
}

const quickAccounts = [
  { email: 'superadmin@smartstay.vn', password: 'SuperAdmin@123456', label: 'Super Admin' },
  { email: 'admin@smartstay.vn', password: 'Admin@123456', label: 'Owner' },
  { email: 'staff@smartstay.vn', password: 'Staff@123456', label: 'Staff' },
  { email: 'tenant@smartstay.vn', password: 'Tenant@123456', label: 'Tenant' },
];

const LoginPage: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockRemainingMs, setLockRemainingMs] = useState(0);

  const loginAction = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const requestedRedirect =
    searchParams.get('redirect') ??
    ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getAuthenticatedHomePath(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  const checkLockout = useCallback(() => {
    const data = getLockoutData();
    if (!data.lockedUntil) {
      setLockRemainingMs(0);
      return;
    }

    const remaining = data.lockedUntil - Date.now();
    if (remaining > 0) {
      setLockRemainingMs(remaining);
      return;
    }

    clearLockoutData();
    setLockRemainingMs(0);
  }, []);

  useEffect(() => {
    checkLockout();
    const interval = window.setInterval(checkLockout, 1000);
    return () => window.clearInterval(interval);
  }, [checkLockout]);

  const isLocked = lockRemainingMs > 0;

  const recordFailedAttempt = () => {
    const data = getLockoutData();
    const attempts = data.attempts + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;

    setLockoutData({
      attempts: lockedUntil ? 0 : attempts,
      lockedUntil,
    });

    if (lockedUntil) {
      toast.error(`Nhập sai quá ${MAX_ATTEMPTS} lần. Thử lại sau 5 phút.`);
    }

    checkLockout();
  };

  const handleQuickLogin = (email: string, password: string) => {
    setForm((current) => ({ ...current, email, password }));
    toast.info('Đã nạp tài khoản mẫu');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return;

    if (form.password.length < 6) {
      toast.error('Mật khẩu tối thiểu 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await loginAction(form.email, form.password);
      clearLockoutData();
      toast.success('Đăng nhập thành công');
      navigate(getPostLoginRedirect(useAuthStore.getState().user, requestedRedirect), { replace: true });
    } catch (err) {
      recordFailedAttempt();
      const message = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      toast.error(message === 'Invalid login credentials' ? 'Thông tin đăng nhập không hợp lệ' : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f5f1e8]"
      style={{ fontFamily: LOGIN_FONT_STACK }}
    >
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_34%),linear-gradient(135deg,_#17335c_0%,_#0f766e_52%,_#1b3a6b_100%)] lg:flex">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative z-10 flex h-full flex-col justify-between p-16 text-white">
            <div className="space-y-10">
              <Link to="/" className="inline-flex text-3xl font-black tracking-tight">
                SmartStay <span className="ml-2 text-white/65">One Access</span>
              </Link>
              <div className="max-w-xl space-y-6">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-white/65">Single Sign-In Gateway</p>
                <h1 className="text-[56px] font-black leading-[1.02] tracking-tight">
                  Một cổng đăng nhập cho toàn bộ hệ thống.
                </h1>
                <p className="text-lg leading-8 text-white/78">
                  Người dùng chỉ cần nhập tên đăng nhập hoặc email và mật khẩu. Hệ thống xác định vai trò và tự động
                  đưa đến đúng workspace: Super Admin, Owner, Staff hoặc Tenant.
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-sm text-white/78">
              <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
                <ShieldCheck className="mt-0.5" size={18} />
                <div>
                  <p className="font-bold uppercase tracking-[0.18em]">Logic chuẩn</p>
                  <p>Một màn đăng nhập duy nhất, phân quyền sau xác thực, không bắt người dùng tự chọn cổng.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/8 p-5 backdrop-blur-sm">
                <ArrowRight className="mt-0.5" size={18} />
                <div>
                  <p className="font-bold uppercase tracking-[0.18em]">Điều hướng tự động</p>
                  <p>Đăng nhập xong sẽ tự vào đúng dashboard theo vai trò và trạng thái tenant.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <Link to="/" className="text-3xl font-black tracking-tight text-primary">
                SmartStay <span className="text-secondary">One Access</span>
              </Link>
            </div>

            <div className="rounded-[32px] bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] lg:p-10">
              <header className="mb-8 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-secondary">Đăng nhập hệ thống</p>
                <h2 className="text-h1 text-primary">Một cổng duy nhất</h2>
                <p className="text-body text-muted">
                  Dùng cho tất cả tài khoản SmartStay. Không cần chọn cổng Owner, Staff, Tenant hay Super Admin.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-label text-text-secondary">Tên đăng nhập hoặc Email</label>
                  <div className="group relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="name@smartstay.vn"
                      className="w-full rounded-2xl border px-12 py-4 text-body outline-none transition-all focus:border-primary focus:ring-primary/20"
                      style={{ fontFamily: LOGIN_FONT_STACK }}
                      value={form.email}
                      onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-label text-text-secondary">Mật khẩu</label>
                    <Link to="/public/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="group relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-primary" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="********"
                      className="w-full rounded-2xl border px-12 py-4 text-body outline-none transition-all focus:border-primary focus:ring-primary/20"
                      style={{ fontFamily: LOGIN_FONT_STACK }}
                      value={form.password}
                      onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
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

                <label className="flex cursor-pointer items-center gap-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={form.remember}
                    onChange={(e) => setForm((current) => ({ ...current, remember: e.target.checked }))}
                  />
                  Ghi nhớ đăng nhập
                </label>

                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className={cn(
                    'flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-bold text-white transition-all',
                    'bg-primary shadow-lg hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-70'
                  )}
                >
                  {loading ? <RefreshCcw className="animate-spin" size={20} /> : <>Đăng nhập <ArrowRight size={20} /></>}
                </button>
              </form>

              {import.meta.env.DEV && (
                <div className="mt-8 border-t border-slate-100 pt-8">
                  <p className="mb-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tài khoản mẫu</p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickAccounts.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleQuickLogin(account.email, account.password)}
                        className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                      >
                        <span className="block text-xs font-black uppercase tracking-[0.18em] text-primary">{account.label}</span>
                        <span className="mt-1 block text-[10px] font-semibold text-muted">{account.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-muted">
                Sau khi đăng nhập, hệ thống tự động đưa bạn vào đúng màn hình theo vai trò.
              </div>
            </div>
          </div>
        </section>
      </div>

      {isLocked && (
        <div className="fixed bottom-0 left-0 z-50 w-full p-4">
          <div className="mx-auto flex max-w-md items-center gap-4 rounded-2xl bg-danger p-4 text-white shadow-2xl">
            <ShieldAlert size={22} />
            <div>
              <p className="font-bold">Tạm khóa đăng nhập</p>
              <p className="text-sm opacity-85">
                Thử lại sau {Math.floor(lockRemainingMs / 60000)}:
                {String(Math.floor((lockRemainingMs % 60000) / 1000)).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
