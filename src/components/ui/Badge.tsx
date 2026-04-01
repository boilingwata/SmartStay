import React from 'react';
import { cn } from '@/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'warning' | 'success' | 'destructive' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className, 
  ...props 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'bg-transparent border-slate-200 text-slate-600',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    destructive: 'bg-rose-100 text-rose-700 border-rose-200',
    info: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
