import React from 'react';
import { differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { cn } from '@/utils';

interface ContractTimelineBarProps {
  startDate: string;
  endDate: string;
  className?: string;
}

export const ContractTimelineBar = ({ startDate, endDate, className }: ContractTimelineBarProps) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const now = new Date();

  const totalDays = differenceInDays(end, start);
  const elapsedDays = differenceInDays(now, start);
  const isOverdue = isAfter(now, end);
  const notStarted = isBefore(now, start);

  let percentage = (elapsedDays / totalDays) * 100;
  if (isOverdue) percentage = 100;
  if (notStarted) percentage = 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
        <span>Bắt đầu: {startDate}</span>
        {isOverdue ? (
          <span className="text-danger">Đã quá hạn</span>
        ) : notStarted ? (
          <span className="text-primary">Chưa bắt đầu</span>
        ) : (
          <span>Còn lại {differenceInDays(end, now)} ngày</span>
        )}
        <span>Kết thúc: {endDate}</span>
      </div>

      <div className="relative h-4 overflow-hidden rounded-full border border-border/50 bg-bg group">
        <div
          className={cn(
            'flex h-full items-center justify-end px-2 transition-all duration-1000 ease-out',
            isOverdue ? 'bg-danger' : 'bg-gradient-to-r from-primary to-accent'
          )}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 ? <span className="text-[9px] font-bold text-white">{Math.round(percentage)}%</span> : null}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="whitespace-nowrap rounded bg-primary px-2 py-0.5 text-[10px] text-white shadow-lg">
            {Math.round(percentage)}% thời gian đã trôi qua
          </span>
        </div>
      </div>
    </div>
  );
};
