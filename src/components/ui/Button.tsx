import React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:hover:scale-100',
      outline: 'bg-transparent border border-border/50 text-muted hover:bg-bg hover:text-primary',
      danger: 'bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white',
      ghost: 'bg-transparent hover:bg-bg text-muted hover:text-primary',
      success: 'bg-success text-white shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-95',
    };

    const sizes = {
      sm: 'h-9 px-4 text-[10px] rounded-xl',
      md: 'h-11 px-6 text-[11px] rounded-2xl',
      lg: 'h-14 px-10 text-[13px] rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    return (
      <button ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span className="truncate">{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
