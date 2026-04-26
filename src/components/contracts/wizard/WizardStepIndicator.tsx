import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';
import { useContractWizard } from './useContractWizard';

const STEPS = [
  { id: 1, title: 'Chọn phòng và người thuê', description: 'Xác định đúng hồ sơ sẽ ký' },
  { id: 2, title: 'Điều khoản chính', description: 'Thời hạn, giá thuê, tiền cọc' },
  { id: 3, title: 'Dịch vụ và vận hành', description: 'Dịch vụ đi kèm và chính sách điện nước' },
  { id: 4, title: 'Rà soát pháp lý', description: 'Kiểm tra lần cuối trước khi tạo hợp đồng' },
] as const;

export function WizardStepIndicator() {
  const { step } = useContractWizard();

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {STEPS.map((item, index) => {
          const isActive = step === item.id;
          const isCompleted = step > item.id;

          return (
            <React.Fragment key={item.id}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold transition',
                      isCompleted && 'border-slate-950 bg-slate-950 text-white',
                      isActive && 'border-slate-950 bg-white text-slate-950 shadow-sm',
                      !isCompleted && !isActive && 'border-slate-200 bg-slate-50 text-slate-400'
                    )}
                  >
                    {isCompleted ? <Check size={16} /> : item.id}
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold', isActive || isCompleted ? 'text-slate-950' : 'text-slate-400')}>{item.title}</p>
                    <p className="hidden text-xs text-slate-500 sm:block">{item.description}</p>
                  </div>
                </div>
              </div>
              {index < STEPS.length - 1 ? <div className="hidden h-px flex-1 bg-slate-200 lg:block" /> : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
