import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  RefreshCcw,
  User,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import { getPostLoginRedirect } from '@/lib/authRouting';

type SignupIntent = 'renter' | 'owner';

const buildLoginHref = (intent: SignupIntent | null, redirect: string | null) => {
  const params = new URLSearchParams();
  if (intent) params.set('intent', intent);
  if (redirect) params.set('redirect', redirect);
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
};

const RegisterPage: React.FC = () => {
  const { t } = useTranslation('public', { lng: 'vi' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);

  const intentFromQuery = searchParams.get('intent') === 'owner'
    ? 'owner'
    : searchParams.get('intent') === 'renter'
      ? 'renter'
      : null;

  const requestedRedirect = searchParams.get('redirect');

  const [selectedIntent, setSelectedIntent] = useState<SignupIntent | null>(intentFromQuery);
  const [step, setStep] = useState(intentFromQuery ? 2 : 1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [renterForm, setRenterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  useEffect(() => {
    if (intentFromQuery) {
      setSelectedIntent(intentFromQuery);
      setStep(2);
    }
  }, [intentFromQuery]);

  const loginHref = useMemo(
    () => buildLoginHref(selectedIntent, requestedRedirect),
    [requestedRedirect, selectedIntent]
  );

  const handleIntentSelect = (intent: SignupIntent) => {
    setSelectedIntent(intent);
    setStep(2);
  };

  const handleRenterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (renterForm.password !== renterForm.confirmPassword) {
      toast.error(t('publicExperience.auth.register.renter.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: renterForm.email,
        password: renterForm.password,
        options: {
          data: { full_name: renterForm.fullName, phone: renterForm.phone, role: 'tenant' },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error(t('publicExperience.auth.register.renter.genericError'));

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: renterForm.fullName,
        phone: renterForm.phone || null,
        role: 'tenant' as const,
        tenant_stage: 'prospect' as const,
        is_active: true,
      }, {
        onConflict: 'id',
      });

      await login(renterForm.email, renterForm.password);
      toast.success(t('publicExperience.auth.register.renter.successToast'));
      navigate(getPostLoginRedirect(useAuthStore.getState().user, requestedRedirect));
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        toast.info(t('publicExperience.auth.register.renter.emailConfirmToast'));
        navigate(loginHref);
      } else {
        toast.error(error?.message || t('publicExperience.auth.register.renter.genericError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

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
                  {t('publicExperience.auth.register.heroTitle')}
                </h1>
                <p className="max-w-xl text-base leading-8 text-white/76">
                  {t('publicExperience.auth.register.heroDescription')}
                </p>
              </div>
            </div>

            <div className="mt-auto grid w-full max-w-xl gap-4 pt-12 lg:pt-16">
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <Users size={18} className="mt-1 shrink-0 text-white" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/65">
                      {t('publicExperience.auth.register.renterCardTitle')}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/76">
                      {t('publicExperience.auth.register.renterCardDescription')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="mt-1 shrink-0 text-white" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/65">
                      {t('publicExperience.auth.register.ownerCardTitle')}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/76">
                      {t('publicExperience.auth.register.ownerCardDescription')}
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
              {t('publicExperience.auth.register.backHome')}
            </Link>

            <div className="mt-6 overflow-hidden rounded-[36px] border border-white/50 bg-white/86 p-8 shadow-[0_32px_90px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.84)] sm:p-10">
              <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">
                  {t('publicExperience.auth.register.stepLabel', { step })}
                </p>
                <h2 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                  {step === 1
                    ? 'Tạo tài khoản người thuê để bắt đầu tìm nhà'
                    : selectedIntent === 'owner'
                      ? 'Tài khoản chủ nhà được hỗ trợ kích hoạt'
                      : t('publicExperience.auth.register.renter.title')}
                </h2>
                <p className="text-sm leading-7 text-muted">
                  {step === 1
                    ? 'Bề mặt launch chỉ mở đăng ký công khai cho người thuê. Chủ nhà và đội hỗ trợ nội bộ dùng tài khoản đã được SmartStay cấp sẵn để vào workspace.'
                    : selectedIntent === 'owner'
                      ? 'Ở giai đoạn launch, SmartStay không mở luồng tự tạo tài khoản chủ nhà. Nếu bạn đã được cấp tài khoản, hãy đăng nhập để quản lý tin đăng và đơn thuê.'
                      : t('publicExperience.auth.register.renter.description')}
                </p>
              </div>

              {step === 1 && (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleIntentSelect('renter')}
                    className="rounded-[28px] border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_55px_-26px_rgba(27,58,107,0.35)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Users size={20} />
                    </div>
                    <h3 className="mt-5 text-xl font-black tracking-tight text-foreground">
                      {t('publicExperience.auth.register.renterCardTitle')}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      {t('publicExperience.auth.register.renterCardDescription')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleIntentSelect('owner')}
                    className="rounded-[28px] border border-border bg-card p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_55px_-26px_rgba(27,58,107,0.35)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                      <Building2 size={20} />
                    </div>
                    <h3 className="mt-5 text-xl font-black tracking-tight text-foreground">
                      Chủ nhà đã có tài khoản
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted">
                      SmartStay chỉ giữ một lối vào đăng nhập cho chủ nhà ở giai đoạn launch. Chọn mục này nếu bạn cần quay lại workspace đã được cấp sẵn.
                    </p>
                  </button>
                </div>
              )}

              {step === 2 && selectedIntent === 'renter' && (
                <form onSubmit={handleRenterSubmit} className="mt-8 space-y-5">
                  <label className="block space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                      {t('publicExperience.auth.register.renter.fullName')}
                    </span>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        required
                        autoFocus
                        value={renterForm.fullName}
                        onChange={(event) => setRenterForm((current) => ({ ...current, fullName: event.target.value }))}
                        className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                      />
                    </div>
                  </label>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                        {t('publicExperience.auth.register.renter.email')}
                      </span>
                      <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="email"
                          required
                          value={renterForm.email}
                          onChange={(event) => setRenterForm((current) => ({ ...current, email: event.target.value }))}
                          className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                        />
                      </div>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                        {t('publicExperience.auth.register.renter.phone')}
                      </span>
                      <div className="relative">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="tel"
                          required
                          value={renterForm.phone}
                          onChange={(event) => setRenterForm((current) => ({ ...current, phone: event.target.value }))}
                          className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                        {t('publicExperience.auth.register.renter.password')}
                      </span>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={renterForm.password}
                          onChange={(event) => setRenterForm((current) => ({ ...current, password: event.target.value }))}
                          className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-14 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-muted">
                        {t('publicExperience.auth.register.renter.confirmPassword')}
                      </span>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={renterForm.confirmPassword}
                          onChange={(event) => setRenterForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                          className="h-14 w-full rounded-2xl border border-border bg-background/80 pl-12 pr-14 text-sm font-medium outline-none transition-all focus:border-primary/30 focus:bg-white dark:bg-slate-900/70"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                          aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </label>
                  </div>

                  <label className="flex items-start gap-3 text-sm text-muted">
                    <input
                      type="checkbox"
                      required
                      checked={renterForm.agreeTerms}
                      onChange={(event) => setRenterForm((current) => ({ ...current, agreeTerms: event.target.checked }))}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="leading-relaxed">{t('publicExperience.auth.register.renter.agreeTerms')}</span>
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex h-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-card px-6 text-sm font-bold text-foreground transition-all hover:border-primary/25 hover:text-primary sm:w-auto"
                    >
                      {t('publicExperience.auth.register.backChoice')}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        'inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-black text-primary-foreground transition-all',
                        'bg-primary shadow-[0_22px_55px_-26px_rgba(27,58,107,0.75)] hover:-translate-y-0.5 hover:bg-primary/95',
                        'disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70'
                      )}
                    >
                      {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                      <span>{isLoading ? t('publicExperience.auth.register.loading') : t('publicExperience.auth.register.renter.submit')}</span>
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && selectedIntent === 'owner' && (
                <div className="mt-8 rounded-[28px] border border-border/70 bg-background/70 p-8 dark:bg-slate-900/60">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-[0_22px_55px_-26px_rgba(27,58,107,0.5)]">
                    <Building2 size={24} />
                  </div>
                  <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-secondary">
                    Owner access
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                    Đăng ký công khai cho chủ nhà chưa được mở ở giai đoạn này.
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    SmartStay đang giữ phạm vi launch ở mức tối giản. Nếu bạn đã có tài khoản chủ nhà, hãy đăng nhập để vào workspace.
                    Nếu cần hỗ trợ kích hoạt hoặc onboard danh mục phòng, đội ngũ SmartStay sẽ xử lý thủ công.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={loginHref}
                      className={cn(
                        'inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-black text-primary-foreground transition-all',
                        'bg-primary shadow-[0_22px_55px_-26px_rgba(27,58,107,0.75)] hover:-translate-y-0.5 hover:bg-primary/95'
                      )}
                    >
                      Đăng nhập chủ nhà
                      <ArrowRight size={18} />
                    </Link>
                    <a
                      href="mailto:hello@smartstay.vn"
                      className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 text-sm font-bold text-foreground transition-all hover:border-primary/25 hover:text-primary"
                    >
                      <Mail size={18} />
                      Liên hệ SmartStay
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl border border-transparent px-6 text-sm font-bold text-primary transition-all hover:border-primary/15 hover:bg-white/40 dark:hover:bg-slate-800/50 sm:w-auto"
                  >
                    Quay lại đăng ký người thuê
                  </button>
                </div>
              )}

              <div className="mt-8 text-center text-sm text-muted">
                {t('publicExperience.auth.register.loginPrompt')}{' '}
                <Link to={loginHref} className="font-bold text-primary hover:underline">
                  {t('publicExperience.auth.register.loginCta')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
