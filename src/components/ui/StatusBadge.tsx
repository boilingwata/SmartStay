import React from 'react';
import { cn } from '@/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium transition-colors uppercase tracking-wider',
  {
    variants: {
      status: {
        Active: 'bg-success/10 text-success border-success/20',
        Paid: 'bg-success/10 text-success border-success/20',
        Completed: 'bg-success/10 text-success border-success/20',
        Confirmed: 'bg-success/10 text-success border-success/20',
        Success: 'bg-success/10 text-success border-success/20',
        Resolved: 'bg-success/10 text-success border-success/20',
        Signed: 'bg-success/10 text-success border-success/20',
        
        Pending: 'bg-warning/10 text-warning border-warning/20',
        Unpaid: 'bg-warning/10 text-warning border-warning/20',
        Inactive: 'bg-muted/10 text-muted border-border/20',
        Replaced: 'bg-accent/10 text-accent border-accent/20',
        Draft: 'bg-warning/10 text-warning border-warning/20',
        Submitted: 'bg-warning/10 text-warning border-warning/20',
        Received: 'bg-primary/10 text-primary border-primary/20',
        Processing: 'bg-primary/10 text-primary border-primary/20',
        Retry: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        Warning: 'bg-warning/10 text-warning border-warning/20',
        
        Overdue: 'bg-destructive/10 text-destructive border-destructive/20',
        Expired: 'bg-destructive/10 text-destructive border-destructive/20',
        Terminated: 'bg-destructive/10 text-destructive border-destructive/20',
        Rejected: 'bg-destructive/10 text-destructive border-destructive/20',
        Failed: 'bg-destructive/10 text-destructive border-destructive/20',
        Critical: 'bg-destructive/10 text-destructive border-destructive/20',
        Blacklisted: 'bg-destructive/10 text-destructive border-destructive/20',
        
        InProgress: 'bg-primary/10 text-primary border-primary/20',
        Occupied: 'bg-primary/10 text-primary border-primary/20',
        Open: 'bg-primary/10 text-primary border-primary/20',
        Info: 'bg-primary/10 text-primary border-primary/20',
        Apartment: 'bg-primary/10 text-primary border-primary/20',
        
        Vacant: 'bg-secondary/10 text-secondary border-secondary/20',
        Published: 'bg-secondary/10 text-secondary border-secondary/20',
        Investor: 'bg-secondary/10 text-secondary border-secondary/20',
        
        Maintenance: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        Shophouse: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        
        Reserved: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        CoOwner: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        Mixed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        
        Cancelled: 'bg-muted/10 text-muted border-muted/20',
        Closed: 'bg-muted/10 text-muted border-muted/20',
        CheckedOut: 'bg-muted/10 text-muted border-muted/20',
        Refunded: 'bg-muted/10 text-muted border-muted/20',
        
        Office: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
        FullOwner: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        Scheduled: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        Archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      },
      size: {
        sm: 'px-1.5 py-0 text-[10px] font-bold',
        md: 'px-2.5 py-0.5 text-[11px] font-medium',
        lg: 'px-4 py-1.5 text-sm font-bold',
      },
    },
    defaultVariants: {
      status: 'Draft',
      size: 'md',
    },
  }
);

// Status labels now come from i18n: common.status.*

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size,
  className,
  children,
  label,
  ...props
}) => {
  const { t } = useTranslation();
  const statusKey = status ? `status.${status}` : '';
  const translated = statusKey ? t(statusKey) : '';
  const displayLabel = label || children || (translated !== statusKey ? translated : status || '');
  const variantStatus = status as VariantProps<typeof badgeVariants>['status'];

  return (
    <span className={cn(badgeVariants({ status: variantStatus, size, className }), 'border')} {...props}>
      {displayLabel}
    </span>
  );
};
