import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils';

export interface QuickFilterOption {
  label: string;
  value: string;
  count?: number;
  color?: string;
}

interface QuickFilterChipsProps {
  options: QuickFilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
  options,
  value,
  onChange,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 overflow-hidden",
              isActive 
                ? "text-white shadow-lg shadow-primary/20" 
                : "text-slate-500 bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="active-chip"
                className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <span className="relative z-10">{option.label}</span>
            
            {option.count !== undefined && (
              <span className={cn(
                "relative z-10 px-1.5 py-0.5 rounded-md text-[9px] font-black tabular-nums",
                isActive 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-100 text-slate-500"
              )}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
