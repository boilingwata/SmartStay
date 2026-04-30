import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Waves, Dumbbell, Utensils, Coffee, MapPin, AlertCircle, History
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalAmenityService } from '@/services/portalAmenityService';
import { cn, formatDate } from '@/utils';
import { isAfter, addHours, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['portal-my-bookings'],
    queryFn: () => portalAmenityService.getMyBookings()
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => portalAmenityService.cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-my-bookings'] });
      toast.success('Đã hủy lịch đặt thành công');
      setCancelTarget(null);
    },
    onError: (error: any) => {
      toast.error(`Không thể hủy lịch: ${error.message}`);
    }
  });
  const now = new Date();
  const upcomingBookings = bookings.filter(b => 
    b.status === 'booked' && isAfter(parseISO(b.date + 'T' + b.timeSlot.split(' - ')[0]), now)
  );
  
  const pastBookings = bookings.filter(b => 
    b.status !== 'booked' || !isAfter(parseISO(b.date + 'T' + b.timeSlot.split(' - ')[0]), now)
  );
  const currentList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bơi')) return Waves;
    if (n.includes('gym') || n.includes('thể')) return Dumbbell;
    if (n.includes('bbq') || n.includes('ăn')) return Utensils;
    if (n.includes('coffee') || n.includes('cà phê')) return Coffee;
    return MapPin;
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-bold uppercase tracking-wider">Đã xác nhận</span>;
      case 'in_use':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-md text-[10px] font-bold uppercase tracking-wider">Đang sử dụng</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-destructive/10 text-destructive rounded-md text-[10px] font-bold uppercase tracking-wider">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };
  const handleCancelConfirm = () => {
    if (cancelTarget) {
      cancelMutation.mutate(cancelTarget.id);
    }
  };
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 min-h-[60vh] bg-background">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">Đang tải lịch đặt...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
      {/* Sticky Top Bar with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl px-5 py-4 border-b border-border space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Lịch sử đặt tiện ích</h2>
        </div>
        {/* Segmented Control Tab */}
        <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
              activeTab === 'upcoming' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sắp tới
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
              activeTab === 'past' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Đã qua
          </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {currentList.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-muted/30">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <History size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Chưa có lịch sử tiện ích</p>
          </div>
        ) : (
          currentList.map((booking) => {
            const Icon = getIcon(booking.amenityName);
            const startTime = parseISO(booking.date + 'T' + booking.timeSlot.split(' - ')[0]);
            const canCancel = booking.status === 'booked' && isAfter(startTime, addHours(now, 2));
            return (
              <div key={booking.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col gap-4 transition-all hover:border-primary/30 hover:shadow-md">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 transition-transform hover:scale-105">
                    <Icon size={24} strokeWidth={2} />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-base font-bold text-card-foreground truncate">{booking.amenityName}</h3>
                      <div className="shrink-0">{getStatusBadge(booking.status)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={14} className="text-primary/70" />
                      <span className="text-xs font-medium tabular-nums">{formatDate(booking.date)}</span>
                      <span className="text-border">•</span>
                      <span className="text-xs font-medium text-primary tabular-nums">{booking.timeSlot}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/80 animate-pulse" />
                    <p className="text-xs font-medium text-muted-foreground">Giao dịch đã xác thực</p>
                  </div>
                  
                  {canCancel && (
                    <button 
                      onClick={() => setCancelTarget(booking)}
                      className="h-9 px-4 border border-destructive/20 text-destructive bg-destructive/5 rounded-lg text-xs font-bold transition-colors hover:bg-destructive hover:text-destructive-foreground active:scale-95"
                    >
                      Hủy đặt chỗ
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Cancel Confirmation Modal (Premium Glassmorphism Overlay) */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive mb-6 mx-auto">
              <AlertCircle size={32} strokeWidth={2} />
            </div>
            
            <h3 className="text-xl font-bold text-foreground text-center mb-2">Xác nhận hủy lịch</h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed px-2">
              Bạn có chắc muốn hủy đặt chỗ <span className="font-semibold text-foreground">{cancelTarget.amenityName}</span> vào <span className="font-semibold text-foreground">{cancelTarget.timeSlot} ngày {formatDate(cancelTarget.date)}</span>?
            </p>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/50 text-xs text-muted-foreground text-center leading-relaxed">
              Lưu ý: Chỉ có thể hủy lịch đặt trước tối thiểu 2 giờ so với thời gian sử dụng thực tế.
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setCancelTarget(null)}
                className="flex-1 h-12 bg-secondary text-secondary-foreground rounded-xl font-semibold text-sm transition-colors hover:bg-secondary/80 active:scale-95"
              >
                Giữ lại
              </button>
              <button 
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending}
                className="flex-[1.5] h-12 bg-destructive text-destructive-foreground rounded-xl font-semibold text-sm transition-colors hover:bg-destructive/90 active:scale-95 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MyBookings;
