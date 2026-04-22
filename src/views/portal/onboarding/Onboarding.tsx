import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  UserCheck,
  FileText,
  Phone,
  Key,
  Briefcase,
  FileCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Confetti from 'react-confetti';
import { cn } from '@/utils';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';
import portalProfileService, { PortalProfile } from '@/services/portalProfileService';
import portalOnboardingService, { PortalOnboardingStatus } from '@/services/portalOnboardingService';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [status, setStatus] = useState<PortalOnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActivatingResident, setIsActivatingResident] = useState(false);
  const [showCompleteScreen, setShowCompleteScreen] = useState(false);

  const loadData = async () => {
    try {
      const [profileResult, statusResult] = await Promise.all([
        portalProfileService.getProfile(),
        portalOnboardingService.getStatus(),
      ]);

      setProfile(profileResult);
      setStatus(statusResult);
    } catch {
      toast.error('Không thể tải dữ liệu onboarding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
          toast.success('🎉 Chúc mừng! Chào mừng đến SmartStay!');
        }
      })
      .catch(() => {
        toast.error('Không thể hoàn tất kích hoạt cư dân');
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
    if (status?.completionPercent === 100) {
      const timer = window.setTimeout(() => {
        setShowCompleteScreen(true);
      }, 600);
      return () => window.clearTimeout(timer);
    }
  }, [status?.completionPercent]);

  if (loading || !profile || !status) {
    return (
      <div 
        className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0D8A8A]/5 via-white to-[#1B3A6B]/5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0D8A8A] rounded-full animate-spin" />
      </div>
    );
  }

  const steps = [
    {
      id: 1,
      title: 'Xác nhận thông tin cá nhân',
      isDone: status.steps.isPersonalInfoConfirmed,
      icon: UserCheck,
      actionLabel: 'Xác nhận ngay',
      onClick: () => navigate('/portal/profile?sheet=personal'),
    },
    {
      id: 2,
      title: 'Upload giấy tờ (CCCD/HC)',
      isDone: status.steps.isCCCDUploaded,
      icon: FileText,
      actionLabel: 'Upload ngay',
      onClick: () => navigate('/portal/documents?from=onboarding'),
    },
    {
      id: 3,
      title: 'Thêm liên hệ khẩn cấp',
      isDone: status.steps.isEmergencyContactAdded,
      icon: Phone,
      actionLabel: 'Thêm ngay',
      onClick: () => navigate('/portal/profile?sheet=emergency'),
    },
    {
      id: 4,
      title: 'Ký biên bản bàn giao',
      isDone: status.steps.isRoomHandovered,
      icon: Key,
      actionLabel: 'Chờ quản lý',
      disabled: true,
      onClick: () => {},
    },
    {
      id: 5,
      title: 'Xác nhận đã nộp cọc',
      isDone: status.steps.isDepositPaid,
      icon: Briefcase,
      actionLabel: 'Chờ chủ sở hữu xác nhận',
      disabled: true,
      onClick: () => {},
    },
    {
      id: 6,
      title: 'Ký hợp đồng',
      isDone: status.steps.isContractSigned,
      icon: FileCheck,
      actionLabel: status.steps.isContractSigned ? 'Đã ký' : 'Chưa ký',
      disabled: true,
      onClick: () => navigate('/portal/contract'),
    },
  ];

  // Logic: User cannot access step N+1 if step N is incomplete
  const isStepLocked = (index: number) => {
    if (index === 0) return false;
    return !steps[index - 1].isDone;
  };

  const completedCount = steps.filter(s => s.isDone).length;
  const progressPercent = (completedCount / steps.length) * 100;

  const handleStepClick = (step: any, index: number) => {
    if (isStepLocked(index) || step.disabled || step.isDone) return;
    step.onClick();
  };

  if (showCompleteScreen) {
    return (
      <div 
        className="min-h-screen w-full bg-gradient-to-br from-[#0D8A8A]/5 via-white to-[#1B3A6B]/5 flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Confetti
          recycle={false}
          numberOfPieces={300}
          gravity={0.3}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center text-[#0D8A8A] mb-8 animate-bounce relative z-10 shadow-lg shadow-teal-500/20">
          <Sparkles size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">All set</h1>
        <p className="text-slate-600 px-4 leading-relaxed text-[16px] mb-12 max-w-[320px] text-center">
          Quá trình tải hồ sơ của bạn đã hoàn tất. Bạn có thể vào nhận phòng ngay.
        </p>
        <button
          onClick={() => navigate('/portal/dashboard')}
          className="w-full max-w-[300px] h-[48px] bg-[#0D8A8A] text-white rounded-xl font-bold text-[16px] flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 ease-out shadow-lg shadow-teal-500/20"
        >
          Đến trang chủ <ArrowRight size={20} className="ml-2" />
        </button>
      </div>
    );
  }

  const fullName = (user as any)?.name || (user as any)?.fullName || 'Resident';

  return (
    <div 
      className="min-h-screen w-full bg-gradient-to-br from-[#0D8A8A]/5 via-white to-[#1B3A6B]/5 relative"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl px-4 py-3 border-b border-slate-100 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          Chào mừng, {fullName}! 👋
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Hoàn thành {completedCount}/6 bước
        </p>
        <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {steps.map((step, index) => {
          const locked = isStepLocked(index);
          const active = !locked && !step.isDone;

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(step, index)}
              className={cn(
                'bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm transition-all duration-200 ease-out flex items-center gap-4',
                !locked && !step.disabled && !step.isDone && 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                step.isDone && 'border-teal-200 bg-teal-50/50',
                active && 'border-teal-500 ring-2 ring-teal-200',
                locked && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                step.isDone ? 'bg-teal-100/50 text-teal-600' : 
                active ? 'bg-teal-50 text-teal-600' :
                'bg-slate-50 text-gray-400'
              )}>
                {locked ? (
                  <Lock size={22} className="text-gray-400" />
                ) : step.isDone ? (
                  <CheckCircle2 size={22} className="text-teal-600" />
                ) : (
                  <step.icon size={22} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'text-[15px] font-bold truncate',
                  locked ? 'text-gray-500' : 'text-slate-800'
                )}>
                  {step.title}
                </h3>
                <div className="mt-1.5 flex items-center">
                  {!step.isDone && !locked ? (
                    <span className={cn(
                      "text-[12px] font-semibold",
                      step.disabled ? "text-slate-400" : "text-[#0D8A8A]"
                    )}>
                      {step.actionLabel}
                    </span>
                  ) : step.isDone ? (
                    <span className="text-[12px] font-semibold text-teal-600 flex items-center gap-1">
                      Hoàn tất
                    </span>
                  ) : (
                    <span className="text-[12px] font-semibold text-gray-400">
                      Đang khóa
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Onboarding;

