import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import useAuthStore from '@/stores/authStore';
import { getAuthenticatedHomePath, getPostLoginRedirect } from '@/lib/authRouting';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'smartstay-login-attempts';

interface LockoutData {
  attempts: number;
  lockedUntil: number | null;
}

function getLockoutData(): LockoutData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LockoutData;
  } catch {
    // Ignore corrupted lockout state.
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
  { email: 'admin@smartstay.vn', password: 'Admin@123456', label: 'Chủ nhà' },
  { email: 'staff@smartstay.vn', password: 'Staff@123456', label: 'Hỗ trợ nội bộ' },
  { email: 'tenant@smartstay.vn', password: 'Tenant@123456', label: 'Người thuê' },
];

const buildRegisterHref = (intent: 'renter' | 'owner' | null, redirect: string | null) => {
  if (intent === 'owner') {
    return 'mailto:hello@smartstay.vn';
  }

  const params = new URLSearchParams();
  if (intent === 'renter') params.set('intent', intent);
  if (redirect) params.set('redirect', redirect);
  const query = params.toString();
  return query ? `/public/register?${query}` : '/public/register';
};

const LoginPage: React.FC = () => {
  const { t } = useTranslation('public', { lng: 'vi' });
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

  const intent = searchParams.get('intent') === 'owner'
    ? 'owner'
    : searchParams.get('intent') === 'renter'
      ? 'renter'
      : null;

  const requestedRedirect =
    searchParams.get('redirect') ??
    ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? null);

  const registerHref = useMemo(
    () => buildRegisterHref(intent, requestedRedirect),
    [intent, requestedRedirect]
  );

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
      toast.error(t('publicExperience.auth.login.lockedToast'));
    }

    checkLockout();
  };

  const handleQuickLogin = (email: string, password: string) => {
    setForm((current) => ({ ...current, email, password }));
    toast.info(t('publicExperience.auth.login.demoLoadedToast'));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isLocked) return;

    if (form.password.length < 6) {
      toast.error(t('publicExperience.auth.login.passwordLengthToast'));
      return;
    }

    setLoading(true);
    try {
      await loginAction(form.email, form.password);
      clearLockoutData();
      toast.success(t('publicExperience.auth.login.successToast'));
      navigate(getPostLoginRedirect(useAuthStore.getState().user, requestedRedirect), { replace: true });
    } catch (error) {
      recordFailedAttempt();
      const message = error instanceof Error ? error.message : t('publicExperience.auth.login.errorToast');
      toast.error(message === 'Invalid login credentials' ? t('publicExperience.auth.login.invalidCredentials') : message);
    } finally {
      setLoading(false);
    }
  };

  const heroTitle = intent === 'owner'
    ? 'Đăng nhập để quản lý tin đăng và đơn thuê.'
    : intent === 'renter'
      ? 'Đăng nhập để tiếp tục tìm và đăng ký thuê.'
      : 'Một tài khoản cho người thuê và chủ nhà.';

  const heroDescription = intent === 'owner'
    ? 'Workspace launch dành cho chủ nhà và đội hỗ trợ chỉ tập trung vào danh mục phòng trống, tin đăng và hồ sơ khách thuê.'
    : intent === 'renter'
      ? 'Bạn có thể quay lại danh sách đang xem, lưu lựa chọn phù hợp và hoàn tất đơn thuê mà không bị đẩy sang các luồng ngoài phạm vi marketplace.'
      : 'Sau khi đăng nhập, SmartStay phân luồng theo vai trò của bạn: khách thuê vào khu vực tìm phòng và theo dõi đơn thuê; chủ nhà và nhân sự vận hành vào không gian quản trị tin đăng, khách quan tâm và hợp đồng.';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#efe8dd_0%,#f7fafc_52%,#ffffff_100%)] text-foreground dark:bg-[linear-gradient(180deg,#050b16_0%,#07111e_46%,#0b1728_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[linear-gradient(145deg,#041511_0%,#0a3029_38%,#0d6b5a_72%,#0d8a8a_100%)] lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,138,138,0.34),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(13,107,90,0.26),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent_42%)]" />
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />

          <div className="relative z-10 flex flex-1 flex-col p-14 text-white">
            <div className="space-y-8">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary">
                  <span className="text-sm font-black tracking-[0.2em]">SS</span>
                </div>
                <p className="font-display text-2xl font-bold tracking-tight">SmartStay</p>
              </Link>

              <div className="space-y-5">
                <h1 className="max-w-xl text-6xl font-black leading-[0.95] tracking-tight">
                  {heroTitle}
                </h1>
                <p className="max-w-xl text-base leading-8 text-white/76">
                  {heroDescription}
                </p>
              </div>
            </div>

            <div className="mt-auto grid w-full max-w-xl gap-4 pt-12 lg:pt-16">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="mt-1 shrink-0 text-white" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/65">
                      Đăng nhập an toàn
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/76">
                      Luồng đăng nhập chạy qua kết nối mã hoá. Bạn có thể chọn ghi nhớ phiên trên thiết bị riêng; khi dùng máy chung hoặc Wi-Fi công cộng, nên đăng xuất sau phiên làm việc.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="mt-1 shrink-0 text-white" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/65">
                      Hai nhóm người dùng, một cổng vào
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/76">
                      Khách thuê xem tin và tiến độ đơn thuê của chính mình; chủ nhà cùng nhân sự vận hành quản lý tin đăng, khách quan tâm và xử lý đơn trên giao diện được phân quyền — không lẫn dữ liệu giữa hai phía.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-20 lg:px-12">
          <div className="w-full max-w-[560px]">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-primary">
              <ArrowLeft size={16} />
              {t('publicExperience.auth.login.backHome')}
            </Link>

            <div className="mt-6 overflow-hidden rounded-[36px] border border-white/50 bg-white/86 p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.84)] sm:p-10">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">
                  {t('publicExperience.auth.login.eyebrow')}
                </p>
                <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                  {t('publicExperience.auth.login.formTitle')}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                    {t('publicExperience.auth.login.emailLabel')}
                  </span>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="name@smartstay.vn"
                      className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                      {t('publicExperience.auth.login.passwordLabel')}
                    </span>
                    <Link to="/public/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                      {t('publicExperience.auth.login.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="********"
                      className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-14 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="flex items-center gap-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  {t('publicExperience.auth.login.rememberMe')}
                </label>

                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className={cn(
                    'inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-primary-foreground transition-all',
                    'bg-primary shadow-[0_22px_55px_-26px_rgba(27,58,107,0.75)] hover:-translate-y-0.5 hover:bg-primary/95',
                    'disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70'
                  )}
                >
                  {loading ? <RefreshCcw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  <span>{loading ? t('publicExperience.auth.login.loading') : t('publicExperience.auth.login.submit')}</span>
                </button>
              </form>

              {import.meta.env.DEV && (
                <div className="mt-8 rounded-[28px] border border-border/70 bg-background/70 p-5 dark:bg-slate-900/60">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                    {t('publicExperience.auth.login.demoAccounts')}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {quickAccounts.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleQuickLogin(account.email, account.password)}
                        className="rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/25 hover:bg-primary/5"
                      >
                        <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                          {account.label}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-muted">{account.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 text-center text-sm text-muted">
                {intent === 'owner' ? (
                  <>
                    Cần tài khoản chủ nhà?{' '}
                    <a href={registerHref} className="font-bold text-primary hover:underline">
                      Liên hệ SmartStay
                    </a>
                  </>
                ) : (
                  <>
                    {t('publicExperience.auth.login.registerPrompt')}{' '}
                    <Link to={registerHref} className="font-bold text-primary hover:underline">
                      {t('publicExperience.auth.login.registerCta')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {isLocked && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-2xl bg-danger p-4 text-white shadow-2xl">
            <ShieldAlert size={22} />
            <div>
              <p className="font-bold">{t('publicExperience.auth.login.lockedTitle')}</p>
              <p className="text-sm opacity-85">
                {t('publicExperience.auth.login.lockedCountdown', {
                  minutes: Math.floor(lockRemainingMs / 60000),
                  seconds: String(Math.floor((lockRemainingMs % 60000) / 1000)).padStart(2, '0'),
                })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
