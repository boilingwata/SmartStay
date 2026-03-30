import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Waves, 
  Dumbbell, 
  Utensils, 
  AlertCircle,
  Calendar,
  Info,
  Check
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalAmenityService } from '@/services/portalAmenityService';
import { Service } from '@/types/service';
import { cn, formatVND } from '@/utils';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { SafeImage } from '@/components/ui';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Spinner } from '@/components/ui';

const AmenityList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAmenity, setSelectedAmenity] = useState<Service | null>(null);

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  const { data: amenities = [], isLoading } = useQuery({
    queryKey: ['portal-amenities'],
    queryFn: () => portalAmenityService.getAmenities()
  });

  const bookingMutation = useMutation({
    mutationFn: (data: { amenityId: number; date: string; timeSlot: string }) => 
      portalAmenityService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-my-bookings'] });
      toast.success(`Đặt thành công ${selectedAmenity?.serviceName}`);
      resetBookingState();
    },
    onError: (error: any) => {
      if (error.code === '23505' || error.message?.includes('conflict')) {
        toast.error('Khung giờ này đã được đặt, vui lòng chọn giờ khác');
      } else {
        toast.error(`Không thể đặt tiện ích: ${error.message}`);
      }
    }
  });

  const resetBookingState = () => {
    setSelectedAmenity(null);
    setSelectedTimeSlot(null);
    setBookingStep(1);
  };

  // Generate next 7 days
  const next7Days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i)), []);
  
  // Generate time slots (available 06:00 to 21:00)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const hour = i + 6;
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isPast = isSameDay(selectedDate, new Date()) && hour <= new Date().getHours() + 1;
      return { time, available: !isPast };
    });
  }, [selectedDate]);

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bơi')) return Waves;
    if (n.includes('gym') || n.includes('thể')) return Dumbbell;
    if (n.includes('ăn') || n.includes('bbq') || n.includes('thực')) return Utensils;
    if (n.includes('cà phê') || n.includes('coffee')) return Coffee;
    return MapPin;
  };

  const getImageUrl = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bơi')) return 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?q=80&w=800&auto=format&fit=crop';
    if (n.includes('gym')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';
    if (n.includes('bbq')) return 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=800&auto=format&fit=crop';
    if (n.includes('tennis')) return 'https://images.unsplash.com/photo-1595435066989-183422709230?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop';
  };

  const handleBookInitiate = (item: Service) => {
    setSelectedAmenity(item);
    setBookingStep(1);
    setSelectedTimeSlot(null);
  };

  const handleBook = () => {
    if (!selectedTimeSlot || !selectedAmenity) return;
    
    bookingMutation.mutate({
      amenityId: selectedAmenity.serviceId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot: `${selectedTimeSlot} - ${format(addDays(parseISO(format(selectedDate, 'yyyy-MM-dd') + 'T' + selectedTimeSlot), 0), 'HH:mm', { locale: vi })}` 
    });
    // Simplified timeslot string for DB
    const endHour = parseInt(selectedTimeSlot.split(':')[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:00`;
    
    bookingMutation.mutate({
      amenityId: selectedAmenity.serviceId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      timeSlot: `${selectedTimeSlot} - ${endTime}`
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-transparent min-h-[80vh]">
        <Spinner size="lg" />
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Đang tải tiện ích...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      <div className="p-5 space-y-8 w-full mx-auto pt-6">
        <div className="flex items-center justify-between pr-2">
            <div className="space-y-0.5">
                <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest leading-none mb-1 font-mono">Dành cho cư dân</p>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">Tiện ích tòa nhà</h2>
            </div>
            <button 
              onClick={() => navigate('/portal/amenities/my-bookings')}
              className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-5 h-12 bg-white rounded-2xl flex items-center justify-center border border-teal-100 transition-all active:scale-95 shadow-lg shadow-teal-600/5 hover:bg-teal-50"
            >
              Lịch đặt của tôi
            </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[3px] border-l-4 border-teal-500 pl-3 leading-none">Danh sách tiện ích</h3>
          <span className="text-[11px] font-black text-slate-400 tabular-nums bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">{amenities.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((item) => (
            <div 
              key={item.serviceId}
              onClick={() => handleBookInitiate(item)}
              className="relative overflow-hidden rounded-[32px] aspect-[4/3] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-xl shadow-slate-900/5 border border-white"
            >
              <SafeImage 
                src={getImageUrl(item.serviceName)} 
                alt={item.serviceName} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-lg border border-white/20 tracking-widest">
                Sẵn sàng
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex justify-between items-end">
                <div className="space-y-1">
                  <h4 className="text-lg font-black tracking-tight leading-tight uppercase">{item.serviceName}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black text-teal-300 tracking-tighter">
                      {item.currentPrice > 0 ? formatVND(item.currentPrice) : 'Miễn phí'}
                    </span>
                    <span className="text-[10px] text-white/50 font-black uppercase tracking-widest italic tracking-tighter">/ giờ</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white group-hover:bg-teal-500 transition-all group-hover:border-teal-400">
                  <ArrowRight size={18} strokeWidth={3} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {amenities.length === 0 && (
          <div className="text-center py-24 bg-white/40 rounded-[48px] border-2 border-dashed border-slate-200 space-y-4 opacity-50 shadow-inner">
            <AlertCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[4px] italic">Chưa có tiện ích khả dụng</p>
          </div>
        )}
      </div>

      <BottomSheet 
        isOpen={!!selectedAmenity} 
        onClose={resetBookingState} 
        title={bookingStep === 1 ? "Chọn ngày" : bookingStep === 2 ? "Chọn khung giờ" : "Xác nhận đặt"}
        height="h-auto"
      >
        {selectedAmenity && (
          <div className="space-y-8 pb-8 pt-4 max-w-md mx-auto px-1 font-sans">
            {bookingStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="grid grid-cols-7 gap-3">
                  {next7Days.map((date, i) => (
                    <div key={i} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {format(date, 'EEEEEE', { locale: vi })}
                    </div>
                  ))}
                  {next7Days.map((date, i) => {
                    const isToday = isSameDay(date, new Date());
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(date); setBookingStep(2); }}
                        className={cn(
                          "aspect-square rounded-[22px] flex flex-col items-center justify-center transition-all border relative shadow-sm group",
                          isToday && "ring-2 ring-teal-500 ring-offset-4",
                          "bg-white text-slate-700 border-slate-100 hover:bg-teal-50 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/[0.05]"
                        )}
                      >
                        <span className="text-[17px] font-black tracking-tighter group-hover:scale-110 transition-transform">{format(date, 'd')}</span>
                        {isToday && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]" />}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[2px] bg-slate-50/50 p-4 rounded-[24px] border border-slate-100 shadow-inner italic">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-white border border-slate-200 rounded-md" /> Khả dụng</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-teal-500 rounded-full" /> Hôm nay</div>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center justify-between bg-teal-50/50 p-4 rounded-[20px] border border-teal-100/50 shadow-inner font-mono uppercase">
                  <p className="text-[11px] font-black text-teal-800">Ngày {format(selectedDate, 'dd/MM/yyyy')}</p>
                  <button onClick={() => setBookingStep(1)} className="text-[10px] font-black text-teal-600 underline underline-offset-4 decoration-2 decoration-teal-200">Đổi ngày</button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((slot, i) => (
                    <button
                      key={i}
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                      className={cn(
                        "py-4 rounded-[20px] text-[15px] font-black transition-all border flex items-center justify-center font-mono tracking-tighter shadow-sm",
                        !slot.available
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100 opacity-50"
                          : selectedTimeSlot === slot.time
                            ? "bg-teal-600 border-teal-600 text-white shadow-xl shadow-teal-600/20 scale-[1.05] relative z-10"
                            : "bg-white border-slate-100 text-slate-600 hover:border-teal-200 hover:bg-teal-50/10"
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                   <button 
                    onClick={() => setBookingStep(3)}
                    disabled={!selectedTimeSlot}
                    className={cn(
                      "w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-[11px] transition-all flex items-center justify-center gap-3 shadow-xl",
                      selectedTimeSlot ? "bg-slate-900 text-white shadow-slate-900/20 active:scale-95" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    )}
                  >
                    Tiếp tục xác nhận
                    <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 space-y-6 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-teal-500 group-hover:scale-110 transition-transform">
                      {React.createElement(getIcon(selectedAmenity.serviceName), { size: 100 })}
                  </div>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-teal-600 shadow-xl shadow-teal-600/5 border border-slate-100">
                      {React.createElement(getIcon(selectedAmenity.serviceName), { size: 36, strokeWidth: 2.5 })}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 leading-none uppercase tracking-tight">{selectedAmenity.serviceName}</h4>
                      <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-2 bg-teal-50 inline-block px-2 py-1 rounded-md">XÁC NHẬN CHI TIẾT</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Thời gian</span>
                      <span className="font-black text-slate-800 text-[15px] font-mono tracking-tighter">{selectedTimeSlot} • {format(selectedDate, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Đơn giá</span>
                      <span className="font-black text-teal-600 text-[18px] tracking-tighter">
                        {selectedAmenity.currentPrice > 0 ? formatVND(selectedAmenity.currentPrice) : 'Miễn phí'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setBookingStep(2)}
                    className="flex-1 h-16 bg-white border border-slate-200 text-slate-400 rounded-[24px] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-slate-50 hover:text-slate-600"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={handleBook}
                    disabled={bookingMutation.isPending}
                    className="flex-[2] h-16 bg-teal-600 text-white rounded-[24px] font-black uppercase tracking-[3px] text-[11px] shadow-2xl shadow-teal-600/30 active:scale-95 transition-all hover:bg-teal-700 disabled:opacity-50"
                  >
                    {bookingMutation.isPending ? 'Đang xác thực...' : 'Xác nhận đặt ngay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default AmenityList;
