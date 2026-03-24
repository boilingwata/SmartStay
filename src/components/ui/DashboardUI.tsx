import React from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  className?: string;
}

export const DashboardEmptyState = ({ 
  title = "Không có dữ liệu", 
  description = "Hiện chưa có thông tin nào để hiển thị trong mục này.", 
  icon: Icon = Database,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center space-y-4 bg-bg/50 rounded-2xl border-2 border-dashed border-border", className)}>
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-muted/30">
        <Icon size={32} />
      </div>
      <div className="space-y-1">
        <h3 className="text-h3 text-primary font-bold">{title}</h3>
        <p className="text-small text-muted max-w-[240px] mx-auto">{description}</p>
      </div>
    </div>
  );
};

interface AlertBannerProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

export const AlertBanner = ({ 
  message, 
  type = 'error', 
  onRetry,
  className 
}: AlertBannerProps) => {
  const styles = {
    error: "bg-danger/10 border-danger text-danger",
    warning: "bg-warning/10 border-warning text-warning",
    info: "bg-primary/10 border-primary text-primary"
  };

  return (
    <div className={cn("p-4 rounded-xl border-l-4 flex items-center justify-between gap-4", styles[type], className)}>
      <div className="flex items-center gap-3">
        <AlertCircle size={20} />
        <p className="text-small font-bold">{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-4 py-1.5 bg-white rounded-lg text-small font-bold shadow-sm hover:shadow-md transition-shadow"
        >
          Thử lại
        </button>
      )}
    </div>
  );
};
