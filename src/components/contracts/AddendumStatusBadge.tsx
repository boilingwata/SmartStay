import React from 'react';
import { cva } from 'class-variance-authority';
import { getContractAddendumStatusLabel } from '@/lib/contractPresentation';
import { cn } from '@/utils';

const addendumStatusVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors',
  {
    variants: {
      status: {
        'Bản nháp': 'border-slate-200 bg-slate-50 text-slate-600',
        'Đã ký': 'border-emerald-200 bg-emerald-50 text-emerald-700',
        'Đã hủy': 'border-rose-200 bg-rose-50 text-rose-700',
      },
    },
    defaultVariants: {
      status: 'Bản nháp',
    },
  }
);

interface AddendumStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
}

export const AddendumStatusBadge: React.FC<AddendumStatusBadgeProps> = ({ status, className, ...props }) => {
  const label = getContractAddendumStatusLabel(status);

  return (
    <span className={cn(addendumStatusVariants({ status: label as never }), className)} {...props}>
      {label}
    </span>
  );
};
