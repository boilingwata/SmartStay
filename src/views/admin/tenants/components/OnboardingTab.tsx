import React from 'react';
import { LayoutList, CheckCircle2, ArrowRight } from 'lucide-react';
import { OnboardingProgress } from '@/models/Tenant';
import { cn } from '@/utils';

import { TabType } from '../TenantDetail';

interface OnboardingTabProps {
  onboarding: OnboardingProgress | undefined;
  onAction: (key: string) => void;
  onTabChange: (tab: TabType) => void;
}

export const OnboardingTab: React.FC<OnboardingTabProps> = ({ onboarding, onAction, onTabChange }) => {
  const steps: { key: string; label: string; target: TabType | null }[] = [
    { key: 'isPersonalInfoConfirmed', label: 'Xác nhận thông tin cá nhân', target: 'Ho so' },
    { key: 'isCCCDUploaded', label: 'Upload CCCD/Hộ chiếu', target: 'Ho so' },
    { key: 'isEmergencyContactAdded', label: 'Thêm liên hệ khẩn cấp', target: 'Lien he' },
    { key: 'isContractSigned', label: 'Ký hợp đồng thuê', target: 'Hop dong' },
    { key: 'isDepositPaid', label: 'Thanh toán tiền cọc', target: 'Vi' },
    { key: 'isRoomHandovered', label: 'Nhận bàn giao phòng', target: null },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in slide-in-from-right-4 duration-500">
      {/* Progress Summary */}
      <div className="card-container p-10 bg-slate-900 border-none relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 border-8 border-white/5 rounded-full" />
            <div 
              className="absolute inset-0 border-8 border-success rounded-full border-b-transparent transition-all duration-1000" 
              style={{ transform: `rotate(${onboarding?.completionPercent || 0 * 3.6}deg)` }} 
            />
            <span className="text-h1 font-black text-white">{onboarding?.completionPercent}%</span>
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-h2 font-black text-white tracking-widest uppercase">Quá trình Onboarding</h2>
            <p className="text-small text-slate-400 font-medium">Hoàn thành toàn bộ các bước để kích hoạt tư cách cư dân chính thức tại toà nhà. Dữ liệu sẽ được lưu vào blockchain Ledger.</p>
            {onboarding?.completionPercent === 100 && (
              <div className="flex items-center gap-2 text-success font-black text-[11px] uppercase animate-pulse">
                <CheckCircle2 size={16} /> Hoàn thành xuất sắc!
              </div>
            )}
          </div>
        </div>
        <LayoutList size={200} className="absolute -bottom-20 -right-20 text-white/5" />
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div 
            key={step.key} 
            className={cn(
              "group p-6 rounded-[24px] border flex items-center justify-between transition-all",
              onboarding?.[step.key as keyof OnboardingProgress] 
                ? "bg-success/5 border-success/20" 
                : "bg-white border-border/50 hover:shadow-xl hover:-translate-x-1"
            )}
          >
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                onboarding?.[step.key as keyof OnboardingProgress] ? "bg-success text-white" : "bg-bg text-muted group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                {onboarding?.[step.key as keyof OnboardingProgress] ? <CheckCircle2 size={24} /> : <span className="font-black">0{idx + 1}</span>}
              </div>
              <p className={cn("text-body font-black uppercase tracking-widest", onboarding?.[step.key as keyof OnboardingProgress] ? "text-success" : "text-primary")}>
                {step.label}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {step.target && !onboarding?.[step.key as keyof OnboardingProgress] && (
                <button 
                  onClick={() => onTabChange(step.target!)}
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  Thực hiện ngay
                </button>
              )}
              <button 
                onClick={() => onAction(step.key)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                  onboarding?.[step.key as keyof OnboardingProgress] ? "border-success bg-success/10 text-success" : "border-border text-muted hover:border-primary hover:text-primary"
                )}
              >
                {onboarding?.[step.key as keyof OnboardingProgress] ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
