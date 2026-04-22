import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/utils';

interface ContractPriceDisplayProps {
  amount: number;
  label?: string;
  sublabel?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  muted?: boolean;
  align?: 'left' | 'right';
}

export const ContractPriceDisplay: React.FC<ContractPriceDisplayProps> = ({
  amount,
  label,
  sublabel,
  className,
  size = 'md',
  muted = false,
  align = 'left',
}) => {
  const { formatted } = useCurrency(amount);

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-2xl font-black tracking-tight',
  };

  return (
    <div className={cn('flex flex-col gap-0.5', align === 'right' && 'items-end text-right', className)}>
      {label && <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>}
      <span className={cn(sizeClasses[size], muted ? 'text-slate-500' : 'text-slate-900', 'tabular-nums')}>
        {formatted}
      </span>
      {sublabel && <span className="text-xs font-medium text-slate-500">{sublabel}</span>}
    </div>
  );
};
