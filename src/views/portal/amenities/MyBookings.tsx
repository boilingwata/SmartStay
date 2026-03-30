import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Waves, 
  Dumbbell, 
  Utensils, 
  Coffee, 
  MapPin, 
  AlertCircle,
  History
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

  // Categories
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
        return <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">Đã xác nhận</span>;
      case 'in_use':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">Đang sử dụng</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-teal-50 text-[#0D8A8A] rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100">Hoàn thành</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{status}</span>;
    }
  };

  const handleCancelConfirm = () => {
    if (cancelTarget) {
      cancelMutation.mutate(cancelTarget.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-transparent min-h-[60vh]">
        <Spinner size="lg" />
        <p className="text-small text-muted font-black animate-pulse uppercase tracking-[3px]">Đang tải lịch đặt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl px-5 py-4 border-b border-slate-100 space-y-4 shadow-sm shadow-slate-200/20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all hover:bg-slate-50">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Lịch sử đặt tiện ích</h2>
        </div>

        {/* Tab Bar */}
        <div className="flex p-1 bg-slate-100 rounded-[20px] shadow-inner mb-2 border border-slate-200/50">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-[16px] transition-all",
              activeTab === 'upcoming' ? "bg-white text-teal-600 shadow-lg shadow-teal-600/5" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Sắp tới
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={cn(
              "flex-1 py-3 text-[11px] font-black uppercase tracking-widest rounded-[16px] transition-all",
              activeTab === 'past' ? "bg-white text-teal-600 shadow-lg shadow-teal-600/5" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Đã qua
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {currentList.length === 0 ? (
          <div className="text-center py-24 bg-white/40 rounded-[48px] border-2 border-dashed border-slate-200 space-y-4 opacity-50 shadow-inner">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-2">
              <History size={40} className="text-slate-300" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase italic tracking-[4px]">Trống danh sách</p>
          </div>
        ) : (
          currentList.map((booking) => {
            const Icon = getIcon(booking.amenityName);
            // Cancel button: Booked and > 2h away
            const startTime = parseISO(booking.date + 'T' + booking.timeSlot.split(' - ')[0]);
            const canCancel = booking.status === 'booked' && isAfter(startTime, addHours(now, 2));

            return (
              <div key={booking.id} className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-teal-100 transition-all hover:shadow-xl hover:shadow-teal-900/[0.02]">
                <div className="flex gap-5">
                  <div className="w-16 h-16 bg-teal-50 rounded-[20px] flex items-center justify-center text-teal-600 shrink-0 border border-teal-100 shadow-inner group-hover:scale-105 transition-transform group-hover:rotate-3">
                    <Icon size={30} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0 pt-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[15px] font-black text-slate-800 leading-tight truncate uppercase tracking-tight">{booking.amenityName}</h3>
                      <div className="shrink-0">{getStatusBadge(booking.status)}</div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={12} className="text-teal-500" />
                      <span className="text-[11px] font-black font-mono tracking-wider tabular-nums">{formatDate(booking.date)}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-[11px] font-black text-teal-600 font-mono tracking-tighter uppercase">{booking.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao dịch đã xác thực</p>
                  </div>
                  
                  {canCancel && (
                    <button 
                      onClick={() => setCancelTarget(booking)}
                      className="h-11 px-5 border border-rose-100 text-rose-500 bg-rose-50/30 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20"
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

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full sm:max-w-[420px] bg-white rounded-t-[40px] sm:rounded-[40px] p-8 animate-in slide-in-from-bottom-12 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden" />
            
            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center text-rose-500 mb-6 border border-rose-100 mx-auto group shadow-inner">
              <AlertCircle size={40} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 text-center mb-3 tracking-tight uppercase">Xác nhận hủy lịch</h3>
            <p className="text-[14px] text-slate-500 text-center leading-relaxed font-medium px-4">
              Bạn có chắc chắn muốn hủy đặt chỗ <span className="font-black text-slate-800">{cancelTarget.amenityName}</span> vào lúc <span className="font-black text-slate-800">{cancelTarget.timeSlot} ngày {formatDate(cancelTarget.date)}</span>?
            </p>
            
            <div className="mt-6 p-4 bg-amber-50/50 rounded-[24px] border border-amber-100 text-[11px] font-bold text-amber-800 text-center italic leading-relaxed">
              Lưu ý: Bạn chỉ có thể hủy lịch đặt trước ít nhất 2 giờ so với thời gian bắt đầu.
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setCancelTarget(null)}
                className="flex-1 h-14 bg-slate-50 text-slate-500 border border-slate-100 rounded-[22px] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-slate-100"
              >
                Giữ lại
              </button>
              <button 
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending}
                className="flex-[1.5] h-14 bg-rose-500 text-white rounded-[22px] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-xl shadow-rose-500/30 hover:bg-rose-600 disabled:opacity-50"
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
