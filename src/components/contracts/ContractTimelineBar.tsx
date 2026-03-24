import React from 'react';
import { cn } from '@/utils';
import { differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';

interface ContractTimelineBarProps {
  startDate: string;
  endDate: string;
  className?: string;
}

export const ContractTimelineBar = ({ startDate, endDate, className }: ContractTimelineBarProps) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const now = new Date();

  // Calculate percentage
  const totalDays = differenceInDays(end, start);
  const elapsedDays = differenceInDays(now, start);
  
  let percentage = (elapsedDays / totalDays) * 100;
  let isOverdue = isAfter(now, end);
  let notStarted = isBefore(now, start);

  if (isOverdue) percentage = 100;
  if (notStarted) percentage = 0;

  return (
    <div className={cn("space-y-2", className)}>
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
      
      <div className="h-4 bg-bg rounded-full overflow-hidden border border-border/50 relative group">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-out flex items-center justify-end px-2",
            isOverdue ? "bg-danger" : "bg-gradient-to-r from-primary to-accent"
          )}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && (
            <span className="text-[9px] text-white font-bold">{Math.round(percentage)}%</span>
          )}
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
             {Math.round(percentage)}% thời gian đã trôi qua
           </span>
        </div>
      </div>
    </div>
  );
};
