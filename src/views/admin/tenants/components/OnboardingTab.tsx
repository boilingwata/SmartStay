import React from 'react';
import { ArrowRight, CheckCircle2, LayoutList } from 'lucide-react';

import { OnboardingProgress } from '@/models/Tenant';
import { cn } from '@/utils';

import { TabType } from '../TenantDetail';

interface OnboardingTabProps {
  onboarding: OnboardingProgress | undefined;
  onTabChange: (tab: TabType) => void;
}

export const OnboardingTab: React.FC<OnboardingTabProps> = ({ onboarding, onTabChange }) => {
  const steps: Array<{ key: keyof OnboardingProgress; label: string; target: TabType | null }> = [
    { key: 'isPersonalInfoConfirmed', label: 'Xac nhan thong tin ca nhan', target: 'Ho so' },
    { key: 'isCCCDUploaded', label: 'Upload CCCD/Ho chieu', target: 'Ho so' },
    { key: 'isEmergencyContactAdded', label: 'Them lien he khan cap', target: 'Lien he' },
    { key: 'isContractSigned', label: 'Ky hop dong thue', target: 'Hop dong' },
    { key: 'isDepositPaid', label: 'Thanh toan tien coc', target: 'Hoa don' },
    { key: 'isRoomHandovered', label: 'Nhan ban giao phong', target: 'Hop dong' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-12 py-10 animate-in slide-in-from-right-4 duration-500">
      <div className="card-container relative overflow-hidden border-none bg-slate-900 p-10">
        <div className="relative z-10 flex flex-col items-center gap-10 md:flex-row">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-8 border-white/5" />
            <div
              className="absolute inset-0 rounded-full border-8 border-success border-b-transparent transition-all duration-1000"
              style={{ transform: `rotate(${(onboarding?.completionPercent ?? 0) * 3.6}deg)` }}
            />
            <span className="text-h1 font-black text-white">{onboarding?.completionPercent ?? 0}%</span>
          </div>

          <div className="flex-1 space-y-3">
            <h2 className="text-h2 font-black uppercase tracking-widest text-white">Qua trinh Onboarding</h2>
            <p className="text-small font-medium text-slate-400">
              Tab nay chi hien tien do onboarding theo du lieu thuc te trong tenant, contract va invoice.
            </p>
            {onboarding?.completionPercent === 100 ? (
              <div className="flex items-center gap-2 text-[11px] font-black uppercase text-success">
                <CheckCircle2 size={16} /> Da hoan tat
              </div>
            ) : null}
          </div>
        </div>

        <LayoutList size={200} className="absolute -bottom-20 -right-20 text-white/5" />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const completed = Boolean(onboarding?.[step.key]);

          return (
            <div
              key={step.key}
              className={cn(
                'group flex items-center justify-between rounded-[24px] border p-6 transition-all',
                completed ? 'border-success/20 bg-success/5' : 'border-border/50 bg-white hover:-translate-x-1 hover:shadow-xl',
              )}
            >
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl transition-all',
                    completed ? 'bg-success text-white' : 'bg-bg text-muted group-hover:bg-primary/10 group-hover:text-primary',
                  )}
                >
                  {completed ? <CheckCircle2 size={24} /> : <span className="font-black">0{index + 1}</span>}
                </div>
                <p className={cn('text-body font-black uppercase tracking-widest', completed ? 'text-success' : 'text-primary')}>
                  {step.label}
                </p>
              </div>

              {step.target && !completed ? (
                <button
                  onClick={() => onTabChange(step.target!)}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-primary hover:underline"
                >
                  Mo tab lien quan
                  <ArrowRight size={14} />
                </button>
              ) : (
                <span className="text-[10px] font-black uppercase text-muted">{completed ? 'Da xong' : 'Theo doi'}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
