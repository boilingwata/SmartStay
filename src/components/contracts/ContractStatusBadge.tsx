import React from 'react';
import { cva } from 'class-variance-authority';
import { getContractStatusLabel } from '@/lib/contractPresentation';
import { cn } from '@/utils';

const contractStatusVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide transition-colors',
  {
    variants: {
      status: {
        'Bản nháp': 'border-amber-200 bg-amber-50 text-amber-700',
        'Chờ ký': 'border-sky-200 bg-sky-50 text-sky-700',
        'Đang hiệu lực': 'border-emerald-200 bg-emerald-50 text-emerald-700',
        'Hết hạn': 'border-rose-200 bg-rose-50 text-rose-700',
        'Đã thanh lý': 'border-slate-200 bg-slate-100 text-slate-700',
        'Đã hủy': 'border-slate-200 bg-slate-50 text-slate-500',
      },
    },
    defaultVariants: {
      status: 'Bản nháp',
    },
  }
);

interface ContractStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
}

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({ status, className, ...props }) => {
  const label = getContractStatusLabel(status);

  return (
    <span className={cn(contractStatusVariants({ status: label as never }), className)} {...props}>
      {label}
    </span>
  );
};
