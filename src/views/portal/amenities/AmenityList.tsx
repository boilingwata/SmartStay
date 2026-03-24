import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Waves, 
  Dumbbell, 
  Utensils, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  Users,
  Info,
  CheckCircle2,
  CalendarDays,
  Check
} from 'lucide-react';
import { getServices } from '@/services/serviceService';
import { Service } from '@/types/service';
import { cn, formatVND } from '@/utils';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { addDays, format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const AmenityList: React.FC = () => {
  const [amenities, setAmenities] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenity, setSelectedAmenity] = useState<Service | null>(null);
  const navigate = useNavigate();
  const ENABLE_SIMULATION = import.meta.env.DEV && !import.meta.env.PROD;

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetBookingState = () => {
    setSelectedAmenity(null);
    setSelectedTimeSlot(null);
    setBookingStep(1);
  };

  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  
  // Generate time slots (mock)
  const timeSlots = React.useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const hour = i + 6; // 6:00 to 21:00
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isPast = isSameDay(selectedDate, new Date()) && hour <= new Date().getHours() + 1;
      
      // Use deterministic logic instead of Math.random
      // e.g., slot is booked if (day + hour) % 7 === 0
      const dayOfMonth = selectedDate.getDate();
      const isBooked = ENABLE_SIMULATION ? (dayOfMonth + hour + refreshKey) % 7 === 0 : false;
      
      return { time, available: !isPast && !isBooked };
    });
  }, [selectedDate, refreshKey, ENABLE_SIMULATION]);

  useEffect(() => {
    const fetchAmenities = async () => {
      setLoading(true);
      try {
        const { data } = await getServices({ search: '', page: 1, limit: 100 });
        setAmenities(data.filter(s => s.serviceType === 'Amenity'));
      } catch (error) {
        console.error('Error fetching amenities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAmenities();
  }, []);

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

  const handleBook = async () => {
    if (!selectedTimeSlot) {
      toast.error('Vui lòng chọn khung giờ');
      return;
    }
    
    try {
      // Simulate API call POST /api/portal/amenity-bookings
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate deterministic conflict for testing
          const shouldConflict = ENABLE_SIMULATION && (parseInt(selectedTimeSlot?.split(':')[0] || '0') % 5 === 0);
          if (shouldConflict) {
            const error = new Error('Conflict');
            (error as any).response = { status: 409 };
            reject(error);
          } else {
            resolve(true);
          }
        }, 800);
      });
      
      toast.success(`Đặt thành công ${selectedAmenity?.serviceName}`);
      resetBookingState();
    } catch (error: any) {
      if (error?.response?.status === 409) {
        toast.error('Slot đã được đặt, vui lòng chọn giờ khác');
        setSelectedTimeSlot(null);
        setBookingStep(2); // Stay on time slot selection
        setRefreshKey(prev => prev + 1); // Trigger "re-fetch"
      } else {
        toast.error('Không thể đặt tiện ích, vui lòng thử lại sau');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-slate-50 min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Amenities</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      <div className="p-5 space-y-8 w-full mx-auto pt-6">
        <div className="flex items-center justify-between pr-2">
            <div className="space-y-0.5">
                <p className="text-[10px] font-black text-teal-600/60 uppercase tracking-widest leading-none">Dành cho cư dân</p>
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Tiện ích tòa nhà</h2>
            </div>
            <button 
              onClick={() => navigate('/portal/amenities/my-bookings')}
              className="text-[10px] font-black text-teal-600 uppercase tracking-widest px-4 h-11 bg-white rounded-2xl flex items-center justify-center border border-teal-100 transition-all active:scale-95 shadow-sm shadow-teal-500/5 hover:bg-teal-50"
            >
              Lịch đặt của tôi
            </button>
        </div>

        {/* Categories Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[2.5px]">Danh sách tiện ích</h3>
          <span className="text-[11px] font-bold text-slate-400 tabular-nums bg-white px-2 py-0.5 rounded-full border">{amenities.length}</span>
        </div>

        {/* F.11.1 Amenity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenities.map((item) => {
            const isMaintenance = ENABLE_SIMULATION && (item.serviceId % 6 === 0); // Simulate maintenance
            
            return (
              <div 
                key={item.serviceId}
                onClick={() => !isMaintenance && handleBookInitiate(item)}
                className={cn(
                  "relative overflow-hidden rounded-[20px] aspect-[4/3] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all group",
                  isMaintenance && "opacity-80 grayscale-[0.3]"
                )}
              >
                {/* Image */}
                <img 
                  src={getImageUrl(item.serviceName)} 
                  alt={item.serviceName} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Badges */}
                {isMaintenance ? (
                  <div className="absolute top-3 right-3 bg-gray-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg">
                    Bảo trì
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg">
                    Có sẵn
                  </div>
                )}

                {/* Content bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex justify-between items-end">
                  <div className="space-y-0.5">
                    <h4 className="text-base font-black tracking-tight leading-tight">{item.serviceName}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-teal-300 tracking-tighter">
                        {item.currentPrice > 0 ? formatVND(item.currentPrice) : 'Miễn phí'}
                      </span>
                      <span className="text-[10px] text-white/60 font-medium italic">/giờ</span>
                    </div>
                  </div>
                  
                  {!isMaintenance && (
                    <button className="bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-white/30 transition-all overflow-hidden group/btn">
                      <span className="relative z-10">Đặt ngay</span>
                      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* No Amenities State */}
        {amenities.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 space-y-4 opacity-50">
            <AlertCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic tracking-[3px]">Chưa có tiện ích nào</p>
          </div>
        )}
      </div>

      {/* F.11.2 Booking Bottom Sheet / Dialog */}
      <BottomSheet 
        isOpen={!!selectedAmenity} 
        onClose={resetBookingState} 
        title={bookingStep === 1 ? "Chọn ngày" : bookingStep === 2 ? "Chọn khung giờ" : "Xác nhận đặt"}
        height={bookingStep === 1 ? 'h-[65vh] md:h-auto' : bookingStep === 2 ? 'h-[75vh] md:h-auto' : 'h-auto md:h-auto'}
      >
        {selectedAmenity && (
          <div className="space-y-6 pb-6 pt-2 max-w-md mx-auto">
            {/* Step 1: Calendar Grid */}
            {bookingStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-7 gap-2">
                  {next7Days.map((date, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase mb-2">
                      {format(date, 'EEEEEE', { locale: vi })}
                    </div>
                  ))}
                  {next7Days.map((date, i) => {
                    const isToday = isSameDay(date, new Date());
                    // Deterministic booked days: e.g. every 7th day from start of week
                    const isBooked = ENABLE_SIMULATION ? (date.getDate() % 7 === 0) : false;
                    
                    return (
                      <button
                        key={i}
                        disabled={isBooked}
                        onClick={() => { setSelectedDate(date); setBookingStep(2); }}
                        className={cn(
                          "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border shrink-0 relative",
                          isToday && "ring-2 ring-teal-500 ring-offset-2",
                          isBooked 
                            ? "bg-red-50 text-red-400 cursor-not-allowed border-red-100" 
                            : "bg-white text-slate-700 border-slate-100 hover:bg-teal-50 hover:border-teal-200"
                        )}
                      >
                        <span className="text-base font-black">{format(date, 'd')}</span>
                        {isToday && <span className="absolute bottom-1 w-1 h-1 bg-teal-500 rounded-full" />}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded" /> Trống</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-100 border border-red-200 rounded" /> Đã kín</div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 ring-2 ring-teal-500 rounded-full" /> Hôm nay</div>
                </div>
              </div>
            )}

            {/* Step 2: Time Slots */}
            {bookingStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">Ngày {format(selectedDate, 'dd/MM/yyyy')}</p>
                  <button onClick={() => setBookingStep(1)} className="text-[10px] font-black text-teal-600 uppercase">Đổi ngày</button>
                </div>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot, i) => {
                    const isSelected = selectedTimeSlot === slot.time;
                    return (
                      <button
                        key={i}
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.time)}
                        className={cn(
                          "py-3.5 rounded-xl text-[13px] font-black transition-all border flex items-center justify-center",
                          !slot.available
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100"
                            : isSelected
                              ? "bg-teal-50 border-teal-500 text-teal-700 ring-1 ring-teal-500"
                              : "bg-white border-gray-200 text-slate-600 hover:border-teal-200 hover:bg-teal-50/10"
                        )}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                   <button 
                    onClick={() => setBookingStep(3)}
                    disabled={!selectedTimeSlot}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black uppercase tracking-[2px] text-xs transition-all flex items-center justify-center gap-2 shadow-lg",
                      selectedTimeSlot ? "bg-teal-600 text-white shadow-teal-600/20 active:scale-95" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    )}
                  >
                    Tiếp tục
                    <ArrowRight size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {bookingStep === 3 && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-teal-50 rounded-[20px] p-6 border border-teal-100 space-y-4 shadow-inner shadow-teal-100/30">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                      {React.createElement(getIcon(selectedAmenity.serviceName), { size: 30, strokeWidth: 2.5 })}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 leading-none">{selectedAmenity.serviceName}</h4>
                      <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest mt-1">Xác nhận chi tiết</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Thời gian</span>
                      <span className="font-black text-slate-700">{selectedTimeSlot} • {format(selectedDate, 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Chi phí</span>
                      <span className="font-black text-teal-700">
                        {selectedAmenity.currentPrice > 0 ? formatVND(selectedAmenity.currentPrice) : 'Miễn phí'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setBookingStep(2)}
                    className="flex-1 h-14 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black uppercase tracking-[2px] text-xs active:scale-95 transition-all"
                  >
                    Quay lại
                  </button>
                  <button 
                    onClick={handleBook}
                    className="flex-[2] h-14 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-[2px] text-xs shadow-lg shadow-teal-600/30 active:scale-95 transition-all"
                  >
                    Xác nhận đặt
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
