import React from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { cn, formatDate } from '@/utils';

interface ContractDateRangeProps {
  startDate: string | Date;
  endDate: string | Date;
  className?: string;
  showDuration?: boolean;
  compact?: boolean;
}

export const ContractDateRange: React.FC<ContractDateRangeProps> = ({
  startDate,
  endDate,
  className,
  showDuration = false,
  compact = false,
}) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.max(differenceInCalendarDays(end, start), 0);
  const durationMonths = Math.max(Math.round(durationDays / 30.44), 0);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'flex items-start gap-2 text-sm font-medium text-slate-600',
          compact ? 'flex-col' : 'flex-wrap sm:flex-nowrap sm:items-center'
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="tabular-nums">{formatDate(start)}</span>
        </div>
        <div className="flex items-center gap-2 pl-5 sm:pl-0">
          <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />
          <span className="tabular-nums">{formatDate(end)}</span>
        </div>
      </div>
      {showDuration ? <span className="pl-5 text-[11px] text-slate-400">Thời hạn {durationMonths} tháng</span> : null}
    </div>
  );
};
