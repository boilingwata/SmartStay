import React from 'react';
import { 
  ShieldAlert, 
  SearchX, 
  Lock, 
  RefreshCcw, 
  CloudOff, 
  WifiOff, 
  UserX,
  History
} from 'lucide-react';
import { cn } from '@/utils';

// --- Spec 5.1 Empty State ---
export const EmptyState = ({ 
  title = "Không có dữ liệu", 
  message = "Hiện chưa có thông tin nào để hiển thị ở đây.", 
  icon: Icon = SearchX,
  actionLabel,
  onAction
}: { 
  title?: string;
  message?: string;
  icon?: any;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center p-12 min-h-[400px] animate-in fade-in zoom-in duration-500">
    <div className="w-24 h-24 bg-bg rounded-full flex items-center justify-center text-muted/30 mb-6">
      <Icon size={48} />
    </div>
    <h3 className="text-h2 text-primary mb-2">{title}</h3>
    <p className="text-body text-muted text-center max-w-sm mb-8">{message}</p>
    {onAction && (
      <button 
        onClick={onAction}
        className="btn-primary"
      >
        {actionLabel || "Thêm mới"}
      </button>
    )}
  </div>
);

// --- Spec 5.2 Error Banner ---
export const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="card-container p-6 bg-danger/5 border-danger/20 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center text-danger">
        <ShieldAlert size={20} />
      </div>
      <div>
        <h4 className="text-h3 text-danger font-bold">Lỗi kết nối</h4>
        <p className="text-body text-text-secondary">{message}</p>
      </div>
    </div>
    {onRetry && (
      <button 
        onClick={onRetry} 
        className="btn-primary bg-danger hover:bg-danger/90 flex items-center gap-2"
      >
        <RefreshCcw size={18} /> Thử lại
      </button>
    )}
  </div>
);

// --- Spec 5.0 No Permission ---
export const NoPermission = () => (
  <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
    <div className="w-24 h-24 bg-warning/10 rounded-full flex items-center justify-center text-warning">
      <Lock size={48} />
    </div>
    <div className="space-y-2">
      <h2 className="text-h1 text-primary">Không có quyền truy cập</h2>
      <p className="text-body text-muted max-w-md mx-auto">
        Tài khoản của bạn không có đủ quyền hạn để xem nội dung này. 
        Vui lòng liên hệ Quản trị viên nếu bạn tin rằng đây là một lỗi.
      </p>
    </div>
  </div>
);

// --- Spec 5.0 Offline Banner ---
export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[9999] bg-warning text-white py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300">
      <WifiOff size={18} />
      <span className="text-small font-bold uppercase tracking-wider">Mất kết nối Internet — Một số tính năng có thể bị hạn chế</span>
    </div>
  );
};

// --- Spec 5.3 Session Expired Overlay ---
export const SessionExpiredOverlay = ({ onLogin }: { onLogin: () => void }) => (
  <div className="fixed inset-0 z-[10000] bg-primary/95 backdrop-blur-md flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
    <div className="card-container p-12 max-w-md space-y-8 bg-white shadow-2xl">
      <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center text-danger mx-auto">
        <ShieldAlert size={40} />
      </div>
      <div className="space-y-4">
        <h2 className="text-display text-primary">Phiên đăng nhập hết hạn</h2>
        <p className="text-body text-muted leading-relaxed">
          Vì lý do bảo mật, phiên làm việc của bạn đã kết thúc. Vui lòng đăng nhập lại để tiếp tục công việc.
        </p>
      </div>
      <button 
        onClick={onLogin}
        className="w-full py-4 bg-primary text-white rounded-md font-bold shadow-lg hover:bg-primary-light transition-all"
      >
        Đăng nhập lại ngay
      </button>
    </div>
  </div>
);

// --- Spec 5.4 Stale Cache Indicator ---
export const StaleCacheIndicator = ({ lastUpdated }: { lastUpdated: Date }) => (
  <div className="flex items-center gap-2 text-small text-muted py-2">
    <History size={14} />
    <span>Cập nhật lúc {lastUpdated.toLocaleTimeString()}</span>
  </div>
);

// --- Page Skeleton for Suspense Fallbacks ---
export const PageSkeleton = () => (
  <div className="p-8 space-y-6">
    <div className="h-10 w-64 bg-slate-100 animate-pulse rounded-lg" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
      ))}
    </div>
    <div className="h-96 w-full bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-12 w-full bg-slate-100/50 animate-pulse rounded-lg" />
      ))}
    </div>
  </div>
);

// --- Grid Skeleton for Card Lists ---
export const GridSkeleton = ({ count = 6, className }: { count?: number; className?: string }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card-container p-0 overflow-hidden h-[450px] bg-slate-50 animate-pulse border border-slate-100 flex flex-col">
        <div className="h-60 bg-slate-200" />
        <div className="p-6 flex-1 space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
          <div className="grid grid-cols-3 gap-4 border-b border-dashed pb-6">
             <div className="h-10 bg-slate-100 rounded" />
             <div className="h-10 bg-slate-100 rounded" />
             <div className="h-10 bg-slate-100 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-8 w-24 bg-slate-100 rounded-full" />
            <div className="h-6 w-32 bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
