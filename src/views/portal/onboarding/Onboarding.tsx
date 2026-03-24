import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  Home,
  Key,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import Confetti from 'react-confetti';
import { cn } from '@/utils';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';
import { tenantDashboardService, DashboardSummary } from '@/services/tenantDashboardService';
import portalProfileService, { PortalProfile } from '@/services/portalProfileService';
import portalOnboardingService, { PortalOnboardingStatus } from '@/services/portalOnboardingService';

const FLOW_STORAGE_KEY = 'smartstay-portal-onboarding-stage';

const FLOW_STEPS = [
  { id: 'overview', title: 'Overview' },
  { id: 'profile', title: 'Profile setup' },
  { id: 'verification', title: 'Verification' },
] as const;

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [status, setStatus] = useState<PortalOnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState(0);
  const [isActivatingResident, setIsActivatingResident] = useState(false);
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);

  const loadData = async () => {
    try {
      const [summaryResult, profileResult, statusResult] = await Promise.all([
        tenantDashboardService.getSummary(),
        portalProfileService.getProfile(),
        portalOnboardingService.getStatus(),
      ]);

      setSummary(summaryResult);
      setProfile(profileResult);
      setStatus(statusResult);
    } catch {
      toast.error('Could not load onboarding details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedStage = Number(localStorage.getItem(FLOW_STORAGE_KEY) ?? '0');
    if (Number.isFinite(savedStage)) {
      setActiveStage(Math.min(Math.max(savedStage, 0), FLOW_STEPS.length - 1));
    }

    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem(FLOW_STORAGE_KEY, String(activeStage));
  }, [activeStage]);

  useEffect(() => {
    if (!status || !user) return;
    if (user.completionPercent === status.completionPercent) return;

    setUser({
      ...user,
      completionPercent: status.completionPercent,
    });
  }, [setUser, status, user]);

  useEffect(() => {
    if (status?.completionPercent !== 100 || user?.tenantStage !== 'resident_pending_onboarding' || isActivatingResident) {
      return;
    }

    let cancelled = false;
    setIsActivatingResident(true);

    portalOnboardingService.activateResident()
      .then(() => {
        if (!cancelled && user) {
          setUser({
            ...user,
            tenantStage: 'resident_active',
            completionPercent: 100,
          });
        }
      })
      .catch(() => {
        toast.error('Could not finalize resident activation');
      })
      .finally(() => {
        if (!cancelled) {
          setIsActivatingResident(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isActivatingResident, setUser, status?.completionPercent, user]);

  useEffect(() => {
    if (status?.completionPercent !== 100) return;

    setActiveStage(FLOW_STEPS.length - 1);
    localStorage.removeItem(FLOW_STORAGE_KEY);

    const timer = window.setTimeout(() => {
      setShowCompleteScreen(true);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [status?.completionPercent]);

  if (loading || !summary || !profile || !status) {
    return (
      <div className="min-h-screen w-full bg-[#F1F5F9] px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1280px] items-center justify-center rounded-[32px] border border-slate-200/70 bg-slate-50 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.45)]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0D8A8A] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const stageProgress = ((activeStage + 1) / FLOW_STEPS.length) * 100;
  const hasBasicDetails = Boolean(profile.fullName && profile.phone && profile.email);
  const hasAvatar = Boolean(profile.avatar || user?.avatar);
  const hasPreferences = Boolean(
    profile.notificationPrefs.email || profile.notificationPrefs.push || profile.notificationPrefs.sms
  );

  const openProfile = (sheet?: string) => {
    const search = new URLSearchParams({ from: 'onboarding' });
    if (sheet) search.set('sheet', sheet);
    navigate(`/portal/profile?${search.toString()}`);
  };

  const openDocuments = () => {
    navigate('/portal/documents?from=onboarding');
  };

  const previewCards = [
    {
      title: 'Invoices & balance',
      description: `${summary.pendingInvoicesCount} items waiting for payment`,
      icon: Home,
    },
    {
      title: 'Support tickets',
      description: `${summary.recentTickets.length} recent resident requests`,
      icon: MessageSquare,
    },
    {
      title: 'Resident profile',
      description: profile.roomCode ? `Room ${profile.roomCode}` : 'Identity and account settings',
      icon: UserCheck,
    },
    {
      title: 'Notifications',
      description: 'Bills, building news, and service updates',
      icon: Bell,
    },
  ];

  const profileCards = [
    {
      title: 'Basic details',
      description: 'Set your display name, phone number, and email.',
      icon: UserCheck,
      done: hasBasicDetails,
      actionLabel: 'Edit details',
      onClick: () => openProfile('personal'),
    },
    {
      title: 'Avatar',
      description: 'Add a photo so the portal feels personal right away.',
      icon: Camera,
      done: hasAvatar,
      actionLabel: 'Open profile',
      onClick: () => openProfile(),
    },
    {
      title: 'Preferences',
      description: 'Review notification settings before verification.',
      icon: Bell,
      done: hasPreferences,
      actionLabel: 'Review settings',
      onClick: () => openProfile('notifications'),
    },
  ];

  const verificationCards = [
    {
      title: 'Confirm identity details',
      description: 'Review legal name, date of birth, phone, and email.',
      icon: ShieldCheck,
      done: status.steps.isPersonalInfoConfirmed,
      type: 'manual' as const,
      actionLabel: 'Open profile',
      onClick: () => openProfile('personal'),
    },
    {
      title: 'Upload ID documents',
      description: 'CCCD, passport, or identity proof belongs at the end of the flow.',
      icon: FileText,
      done: status.steps.isCCCDUploaded,
      type: 'manual' as const,
      actionLabel: 'Open documents',
      onClick: openDocuments,
    },
    {
      title: 'Emergency contact',
      description: 'Add a fallback contact before full access is granted.',
      icon: UserCheck,
      done: status.steps.isEmergencyContactAdded,
      type: 'manual' as const,
      actionLabel: 'Open profile',
      onClick: () => openProfile('personal'),
    },
    {
      title: 'Contract signed',
      description: 'Waiting for the leasing workflow to be completed.',
      icon: FileCheck,
      done: status.steps.isContractSigned,
      type: 'auto' as const,
      waitText: 'Waiting for management',
    },
    {
      title: 'Deposit confirmed',
      description: 'Management confirms the deposit in the back office.',
      icon: Briefcase,
      done: status.steps.isDepositPaid,
      type: 'auto' as const,
      waitText: 'Waiting for admin',
    },
    {
      title: 'Room handover',
      description: 'Final room handover closes the onboarding checklist.',
      icon: Key,
      done: status.steps.isRoomHandovered,
      type: 'auto' as const,
      waitText: 'Waiting for handover',
    },
  ];

  if (showCompleteScreen) {
    return (
      <div className="min-h-screen w-full bg-[#F1F5F9] px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1280px] flex-col items-center justify-center rounded-[32px] border border-slate-200/70 bg-slate-50 p-8 text-center shadow-[0_32px_80px_-48px_rgba(15,23,42,0.45)] relative overflow-hidden lg:p-12">
          <Confetti
            recycle={false}
            numberOfPieces={280}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-[#0D8A8A] mb-8 animate-bounce relative z-10 shadow-lg shadow-teal-500/20">
            <Sparkles size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-4">All set</h1>
          <p className="text-slate-600 px-4 leading-relaxed text-[16px] mb-12 max-w-[320px]">
            Your resident activation is complete. You can now head straight into the full portal.
          </p>
          <button
            onClick={() => navigate('/portal/dashboard')}
            className="w-full max-w-[300px] h-[48px] bg-[#0D8A8A] text-white rounded-xl font-bold text-[16px] flex items-center justify-center hover:bg-[#0A6B6B] active:scale-[0.98] transition-all"
          >
            Go to dashboard <ArrowRight size={20} className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F1F5F9] px-4 py-4 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1280px] overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-50 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.45)]">
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-20 border-b border-slate-200 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-10 pb-6 lg:px-8 lg:pt-8 lg:pb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0D8A8A]">Resident activation</p>
                <h1 className="text-xl font-bold text-slate-800 lg:text-3xl">
                  Welcome, {(user as any)?.name || (user as any)?.fullName || 'Resident'}
                </h1>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D8A8A] font-bold text-sm shadow-inner shadow-teal-500/10">
                {status.completionPercent}%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {FLOW_STEPS.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStage(index)}
                  className={cn(
                    'rounded-2xl border px-3 py-3 text-left transition-all lg:px-4 lg:py-4',
                    index === activeStage
                      ? 'border-[#0D8A8A] bg-teal-50 text-[#0D8A8A] shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500'
                  )}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Step {index + 1}</p>
                  <p className="mt-1 text-[12px] font-bold lg:text-sm">{step.title}</p>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Flow progress</span>
                <span>{activeStage + 1}/{FLOW_STEPS.length}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0D8A8A] transition-all duration-500"
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 space-y-6 lg:px-8 lg:pt-8 lg:pb-16">
          {activeStage === 0 && (
            <>
              <section className="rounded-[28px] bg-gradient-to-br from-[#1B3A6B] via-[#0D8A8A] to-[#2E5D9F] p-6 text-white shadow-xl lg:p-8">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/70">Start here</p>
                <h2 className="mt-3 text-[28px] font-black tracking-tight lg:max-w-3xl lg:text-[40px]">See your resident portal before we ask for move-in verification.</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80 lg:max-w-2xl lg:text-base">
                  SmartStay helps residents track invoices, request support, read announcements, and manage their account in one place.
                </p>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {previewCards.map((card) => (
                  <div key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-[#0D8A8A] flex items-center justify-center">
                      <card.icon size={22} />
                    </div>
                    <h3 className="mt-4 text-[14px] font-black text-slate-800">{card.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{card.description}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D8A8A] flex items-center justify-center">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-slate-800">What happens next</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                      First we show the resident experience, then we guide profile setup, and only then do we move into move-in verification.
                    </p>
                  </div>
                </div>
              </section>

              <button
                onClick={() => setActiveStage(1)}
                className="w-full h-14 bg-[#0D8A8A] text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all lg:ml-auto lg:max-w-sm"
              >
                Continue to profile setup
                <ArrowRight size={18} />
              </button>
            </>
          )}

          {activeStage === 1 && (
            <>
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0D8A8A]">Profile setup</p>
                <h2 className="mt-2 text-[24px] font-black tracking-tight text-slate-800">Make the portal feel like yours first.</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  Residents should see a friendly setup flow before identity checks. These actions reuse the existing profile UI.
                </p>
              </section>

              <section className="grid gap-4 xl:grid-cols-3">
                {profileCards.map((card) => (
                  <div
                    key={card.title}
                    className={cn(
                      'rounded-[24px] border bg-white p-5 shadow-sm transition-all',
                      card.done ? 'border-teal-200 ring-1 ring-teal-50' : 'border-slate-200'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                        card.done ? 'bg-teal-100 text-[#0D8A8A]' : 'bg-slate-50 text-slate-400'
                      )}>
                        <card.icon size={22} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-[15px] font-black text-slate-800">{card.title}</h3>
                          {card.done && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                              <CheckCircle2 size={12} />
                              Ready
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{card.description}</p>
                        <button
                          onClick={card.onClick}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-black uppercase tracking-[0.15em] text-white transition-all hover:bg-[#0D8A8A]"
                        >
                          {card.actionLabel}
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setActiveStage(0)}
                  className="h-14 rounded-2xl border border-slate-200 bg-white px-6 text-slate-700 font-black text-[12px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 sm:min-w-[180px]"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={() => setActiveStage(2)}
                  className="h-14 rounded-2xl bg-[#0D8A8A] px-6 text-white font-black text-[12px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 sm:min-w-[220px]"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}

          {activeStage === 2 && (
            <>
              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0D8A8A]">Final step</p>
                <h2 className="mt-2 text-[24px] font-black tracking-tight text-slate-800">Verification now comes at the end.</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  Identity and move-in verification still matter for residents. They now happen after the welcome and profile setup experience.
                </p>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                {verificationCards.map((card) => (
                  <div
                    key={card.title}
                    className={cn(
                      'p-4 bg-white rounded-2xl border transition-all duration-300 flex items-center gap-4 relative overflow-hidden group',
                      card.done ? 'border-teal-200 shadow-md shadow-teal-500/5 ring-1 ring-teal-50' : 'border-slate-200 shadow-sm'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
                      card.done ? 'bg-teal-100 text-[#0D8A8A]' : 'bg-slate-50 text-slate-400'
                    )}>
                      <card.icon size={22} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={cn('text-[15px] font-bold truncate', card.done ? 'text-slate-800' : 'text-slate-700')}>
                        {card.title}
                      </h3>
                      <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {card.done ? (
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 size={18} strokeWidth={3} />
                        </div>
                      ) : card.type === 'manual' ? (
                        <button
                          onClick={card.onClick}
                          className="px-3 py-2 bg-[#0D8A8A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#0A6B6B] active:scale-[0.98] transition-all whitespace-nowrap"
                        >
                          {card.actionLabel}
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-[11px] font-semibold text-slate-500">{card.waitText}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </section>

              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Completion</p>
                    <h3 className="mt-1 text-[22px] font-black text-slate-800">{status.completionPercent}% complete</h3>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D8A8A] flex items-center justify-center">
                    <ShieldCheck size={22} />
                  </div>
                </div>
                <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0D8A8A] transition-all duration-700"
                    style={{ width: `${status.completionPercent}%` }}
                  />
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setActiveStage(1)}
                  className="h-14 rounded-2xl border border-slate-200 bg-white px-6 text-slate-700 font-black text-[12px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 sm:min-w-[180px]"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={() => navigate('/portal/dashboard')}
                  disabled={status.completionPercent !== 100}
                  className="h-14 rounded-2xl bg-[#0D8A8A] px-6 text-white font-black text-[12px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed sm:min-w-[220px]"
                >
                  Enter portal
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
