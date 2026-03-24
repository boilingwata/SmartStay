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
  X
} from 'lucide-react';
import { cn } from '@/utils';
import { format, isAfter, addHours, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

// Mock Data
type BookingStatus = 'Confirmed' | 'Cancelled' | 'Completed';

interface Booking {
  id: string;
  amenityName: string;
  date: string; // ISO string for the day
  timeSlot: string; // 'HH:mm - HH:mm'
  startTime: string; // ISO string for strict calculation
  status: BookingStatus;
  price: number;
  paymentMethod: string;
}

const mockBookings: Booking[] = [
  {
    id: 'B1',
    amenityName: 'Hồ bơi vô cực',
    date: '2026-03-22',
    timeSlot: '17:00 - 18:00',
    startTime: '2026-03-22T17:00:00+07:00',
    status: 'Confirmed',
    price: 0,
    paymentMethod: 'Miễn phí'
  },
  {
    id: 'B2',
    amenityName: 'Phòng Gym 24/7',
    date: '2026-03-25',
    timeSlot: '08:00 - 09:00',
    startTime: '2026-03-25T08:00:00+07:00',
    status: 'Confirmed',
    price: 50000,
    paymentMethod: 'Ví SmartStay'
  },
  {
    id: 'B3',
    amenityName: 'Khu vực BBQ',
    date: '2026-03-15',
    timeSlot: '18:00 - 20:00',
    startTime: '2026-03-15T18:00:00+07:00',
    status: 'Completed',
    price: 200000,
    paymentMethod: 'Chuyển khoản'
  },
  {
    id: 'B4',
    amenityName: 'Sân Tennis',
    date: '2026-03-18',
    timeSlot: '06:00 - 07:00',
    startTime: '2026-03-18T06:00:00+07:00',
    status: 'Cancelled',
    price: 100000,
    paymentMethod: 'Ví SmartStay'
  }
];

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const now = new Date();

  // Categories
  const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' && isAfter(parseISO(b.startTime), now));
  const pastBookings = bookings.filter(b => b.status !== 'Confirmed' || !isAfter(parseISO(b.startTime), now));

  const currentList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bơi')) return Waves;
    if (n.includes('gym') || n.includes('thể')) return Dumbbell;
    if (n.includes('bbq') || n.includes('ăn')) return Utensils;
    if (n.includes('coffee') || n.includes('cà phê')) return Coffee;
    return MapPin;
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Confirmed':
        return <span className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100">Đã xác nhận</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 bg-teal-50 text-[#0D8A8A] rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100">Hoàn thành</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">Đã hủy</span>;
    }
  };

  const handleCancelConfirm = () => {
    if (cancelTarget) {
      setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'Cancelled' } : b));
      toast.success(`Đã hủy đặt chỗ ${cancelTarget.amenityName} thành công.`);
      setCancelTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl px-5 py-4 border-b border-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition-all">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Lịch sử đặt tiện ích</h2>
        </div>

        {/* Tab Bar */}
        <div className="flex p-1 bg-slate-100/80 rounded-[20px]">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[16px] transition-all",
              activeTab === 'upcoming' ? "bg-white text-[#0D8A8A] shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Sắp tới
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={cn(
              "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-[16px] transition-all",
              activeTab === 'past' ? "bg-white text-[#0D8A8A] shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Đã qua
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {currentList.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 space-y-4 opacity-50">
            <AlertCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Chưa có lịch đặt nào</p>
          </div>
        ) : (
          currentList.map((booking) => {
            const Icon = getIcon(booking.amenityName);
            const canCancel = booking.status === 'Confirmed' && isAfter(parseISO(booking.startTime), addHours(now, 2));

            return (
              <div key={booking.id} className="p-5 bg-white rounded-[28px] shadow-sm border border-slate-100 flex flex-col gap-4 group">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-teal-50 rounded-[20px] flex items-center justify-center text-[#0D8A8A] shrink-0 border border-teal-100 shadow-inner">
                    <Icon size={26} strokeWidth={2} />
                  </div>
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-[15px] font-black text-slate-800 leading-none tracking-tight">{booking.amenityName}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} className="text-teal-600" />
                      <span className="text-[11px] font-bold tracking-wider">{format(parseISO(booking.date), 'dd/MM/yyyy')}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-black text-[#0D8A8A]">{booking.timeSlot}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Thanh toán</p>
                    <p className="text-[13px] font-black text-slate-700">
                      {booking.price === 0 ? 'Miễn phí' : `${booking.price.toLocaleString()}đ`}
                      <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase bg-slate-50 px-2 rounded-md">
                        {booking.paymentMethod}
                      </span>
                    </p>
                  </div>
                  
                  {canCancel && (
                    <button 
                      onClick={() => setCancelTarget(booking)}
                      className="h-10 px-4 bg-rose-50 text-rose-600 rounded-xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-rose-100"
                    >
                      Hủy đặt
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-[400px] bg-white rounded-t-[32px] sm:rounded-[32px] p-6 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="w-16 h-16 bg-rose-50 rounded-[24px] flex items-center justify-center text-rose-500 mb-4 border border-rose-100 mx-auto">
              <AlertCircle size={32} strokeWidth={2} />
            </div>
            
            <h3 className="text-lg font-black text-slate-900 text-center mb-2 tracking-tight">Xác nhận hủy lịch</h3>
            <p className="text-[13px] text-slate-500 text-center leading-relaxed">
              Bạn có chắc chắn muốn hủy đặt chỗ <span className="font-bold text-slate-800">{cancelTarget.amenityName}</span> vào lúc <span className="font-bold text-slate-800">{cancelTarget.timeSlot} ngày {format(parseISO(cancelTarget.date), 'dd/MM')}</span>?
            </p>
            {cancelTarget.price > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-[11px] font-bold text-amber-800 text-center">
                Phí hoàn hủy (nếu có) sẽ được áp dụng theo chính sách BQL. Tiền sẽ được hoàn vào Ví SmartStay trong 24h.
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setCancelTarget(null)}
                className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-[20px] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all"
              >
                Giữ lại
              </button>
              <button 
                onClick={handleCancelConfirm}
                className="flex-[1.5] h-14 bg-rose-500 text-white rounded-[20px] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all shadow-lg shadow-rose-500/30"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
