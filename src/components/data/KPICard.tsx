import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn, formatVND } from '@/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  isCurrency?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  onClick?: () => void;
  subtitle?: React.ReactNode;
  reverseDeltaColor?: boolean;
}

export const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  delta, 
  isCurrency, 
  color = 'primary', 
  loading,
  onClick,
  subtitle,
  reverseDeltaColor
}: KPICardProps) => {
  if (loading) {
    return (
      <div className="card-container p-6 animate-pulse border-none">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 bg-bg rounded-lg"></div>
          <div className="w-16 h-4 bg-bg rounded"></div>
        </div>
        <div className="w-24 h-8 bg-bg rounded mb-2"></div>
        <div className="w-full h-4 bg-bg rounded"></div>
      </div>
    );
  }

  const isPositive = delta && delta > 0;
  const isGood = reverseDeltaColor ? !isPositive : isPositive;
  
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger'
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "card-container p-6 hover:shadow-lg transition-all duration-300 border-none group cursor-pointer",
        onClick && "hover:-translate-y-1"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", colorMap[color])}>
          <Icon size={24} />
        </div>
        {delta !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-small font-bold px-2 py-1 rounded-full",
            isGood ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
          )}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-small font-medium text-muted uppercase tracking-wider">{title}</p>
          {subtitle && <div className="text-[10px] font-mono font-bold text-muted/40 uppercase">{subtitle}</div>}
        </div>
        <h3 className="text-h1 font-bold text-primary">
          {isCurrency ? formatVND(Number(value)) : value.toLocaleString()}
        </h3>
      </div>
      
      {/* Subtle indicator line */}
      <div className="mt-4 h-1.5 w-full bg-bg rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", 
          color === 'primary' ? 'bg-primary' : 
          color === 'secondary' ? 'bg-secondary' : 
          color === 'accent' ? 'bg-accent' : 
          color === 'success' ? 'bg-success' : 
          color === 'warning' ? 'bg-warning' : 'bg-danger'
        )} style={{ width: '65%' }}></div>
      </div>
    </div>
  );
};
