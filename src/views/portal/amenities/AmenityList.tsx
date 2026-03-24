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
import { cn } from '@/utils';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { addDays, format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const AmenityList: React.FC = () => {
  const [amenities, setAmenities] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenity, setSelectedAmenity] = useState<Service | null>(null);
  const navigate = useNavigate();

  // Booking State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Generate next 7 days
  const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  
  // Generate time slots (mock)
  const timeSlots = Array.from({ length: 16 }).map((_, i) => {
    const hour = i + 6; // 6:00 to 21:00
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const isPast = isSameDay(selectedDate, new Date()) && hour <= new Date().getHours() + 1;
    const isBooked = Math.random() > 0.8; // Randomly book some slots
    return { time, available: !isPast && !isBooked };
  });

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

  const getColorClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bơi')) return 'bg-blue-50 text-blue-500 border-blue-100';
    if (n.includes('gym')) return 'bg-indigo-50 text-indigo-500 border-indigo-100';
    if (n.includes('bbq')) return 'bg-orange-50 text-orange-500 border-orange-100';
    if (n.includes('tennis')) return 'bg-lime-50 text-lime-600 border-lime-100';
    return 'bg-teal-50 text-[#0D8A8A] border-teal-100';
  };

  const handleBook = async () => {
    if (!selectedTimeSlot) {
      toast.error('Vui lòng chọn khung giờ');
      return;
    }
    
    try {
      // Simulate API call POST /api/portal/amenity-bookings
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Simulate 409 Conflict occasionally (e.g. 20% chance) for demo purposes
      if (Math.random() < 0.2) {
         // eslint-disable-next-line
         throw { response: { status: 409 } };
      }

      toast.success(`Đặt thành công ${selectedAmenity?.serviceName} lúc ${selectedTimeSlot} ngày ${format(selectedDate, 'dd/MM')}`);
      setSelectedAmenity(null);
      setSelectedTimeSlot(null);
    } catch (error: any) {
      if (error?.response?.status === 409) {
         toast.error('Slot đã được đặt, vui lòng chọn giờ khác');
         setSelectedTimeSlot(null);
         // In real app, we would refetch availability here
      } else {
         toast.error('Không thể đặt tiện ích, vui lòng thử lại sau');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 px-6 bg-slate-50 min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0D8A8A] rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-black animate-pulse uppercase tracking-[3px]">Loading Amenities</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32 animate-in fade-in slide-in-from-right-6 duration-700 font-sans">
      <div className="p-5 space-y-8 max-w-[430px] mx-auto pt-6">
        <div className="flex items-center justify-between pr-2">
            <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Dành cho cư dân</p>
                <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">Tiện ích tòa nhà</h2>
            </div>
            <button 
              onClick={() => navigate('/portal/amenities/my-bookings')}
              className="text-[10px] font-black text-[#0D8A8A] uppercase tracking-widest px-4 h-11 bg-white rounded-2xl flex items-center justify-center border border-teal-100 transition-all active:scale-95 shadow-sm shadow-teal-500/5"
            >
              Lịch đặt
            </button>
        </div>
        {/* VIP Status Card */}
        <div className="relative p-7 bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <ShieldCheck size={120} className="text-white" />
          </div>
          <div className="relative z-10 space-y-5">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-teal-400 border border-white/10">
                 <ShieldCheck size={26} />
               </div>
               <div className="space-y-0.5">
                 <h3 className="text-sm font-black text-white uppercase tracking-wider italic">Trải nghiệm tiện nghi</h3>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">DÀNH RIÊNG CHO CƯ DÂN</p>
               </div>
             </div>
             
             <div className="pt-2">
                <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed italic">
                  Khám phá và đặt trước các tiện ích cao cấp ngay trong toà nhà của bạn.
                </p>
             </div>
          </div>
        </div>

        {/* Categories Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-[2.5px]">Danh sách tiện ích</h3>
          <span className="text-[11px] font-bold text-slate-400 tabular-nums bg-white px-2 py-0.5 rounded-full border">{amenities.length}</span>
        </div>

        {/* Amenities Grid 2-col */}
        <div className="grid grid-cols-2 gap-4">
          {amenities.map((item) => {
            const Icon = getIcon(item.serviceName);
            const colorClass = getColorClass(item.serviceName);
            // Simulate random maintenance status
            const isMaintenance = item.serviceId % 4 === 0;

            return (
              <div 
                key={item.serviceId}
                onClick={() => !isMaintenance && setSelectedAmenity(item)}
                className={cn(
                  "bg-white p-5 rounded-[28px] shadow-sm shadow-slate-200/50 flex flex-col gap-4 border transition-all relative overflow-hidden",
                  isMaintenance 
                    ? "opacity-60 border-slate-100 grayscale-[0.5] cursor-not-allowed" 
                    : "border-slate-100 cursor-pointer active:scale-95 group hover:border-[#0D8A8A]/30 hover:shadow-xl hover:shadow-teal-100/50"
                )}
              >
                {/* Badge Khả dụng / Bảo trì */}
                <div className="absolute top-4 right-4 flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full shadow-sm", isMaintenance ? "bg-slate-300" : "bg-teal-400 animate-pulse")} />
                </div>

                <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center transition-transform group-hover:scale-110", colorClass)}>
                  <Icon size={28} strokeWidth={2} />
                </div>
                
                <div className="space-y-1 mt-2">
                  <h4 className="text-[14px] font-black text-slate-800 line-clamp-2 leading-tight tracking-tight">{item.serviceName}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isMaintenance ? 'Đang bảo trì' : 'Khả dụng'}
                  </p>
                </div>
                
                <div className="mt-auto pt-4 flex flex-col items-start gap-1 border-t border-slate-50">
                   {item.currentPrice > 0 ? (
                     <div className="flex items-baseline gap-1">
                        <span className="text-sm font-black text-[#0D8A8A] tabular-nums tracking-tighter">{item.currentPrice.toLocaleString()}đ</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">/giờ</span>
                     </div>
                   ) : (
                     <span className="text-[11px] font-black uppercase text-teal-600 tracking-widest bg-teal-50 px-2 py-0.5 rounded-md">Miễn phí</span>
                   )}
                </div>

                {/* 'Dat ngay' button implicit via card tap if desktop we might show a hover button */}
              </div>
            );
          })}
        </div>

        {/* No Amenities State */}
        {amenities.length === 0 && (
          <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 space-y-4 opacity-50">
            <AlertCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Chưa có dữ liệu tiện ích</p>
          </div>
        )}
      </div>

      {/* Booking Flow Bottom Sheet */}
      <BottomSheet 
        isOpen={!!selectedAmenity} 
        onClose={() => { setSelectedAmenity(null); setSelectedTimeSlot(null); }} 
        title="Đặt tiện ích"
      >
        {selectedAmenity && (
          <div className="space-y-8 pb-10 max-h-[85vh] overflow-y-auto pt-2 no-scrollbar">
             {/* Amenity Info Header */}
             <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[24px] border border-slate-100">
                <div className={cn("w-16 h-16 rounded-[20px] flex items-center justify-center shadow-inner shrink-0 text-white", getColorClass(selectedAmenity.serviceName).split(' ')[0], "bg-[#0D8A8A]")}>
                   {React.createElement(getIcon(selectedAmenity.serviceName), { size: 28, strokeWidth: 2 })}
                </div>
                <div className="flex-1 space-y-1">
                   <h3 className="text-lg font-black text-slate-900 leading-tight tracking-tight uppercase">
                     {selectedAmenity.serviceName}
                   </h3>
                   <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">06:00 - 22:00</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <span className="text-[11px] font-black text-[#0D8A8A]">
                        {selectedAmenity.currentPrice > 0 ? `${selectedAmenity.currentPrice.toLocaleString()}đ/h` : 'Miễn phí'}
                      </span>
                   </div>
                </div>
             </div>

             {/* Booking Flow - Step 1: Chọn ngày */}
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-[#0D8A8A] rounded-full"></div>
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[2.5px]">Chọn ngày tham gia</h4>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar px-1">
                   {next7Days.map((date, i) => {
                     const isSelected = isSameDay(date, selectedDate);
                     return (
                       <button
                         key={i}
                         onClick={() => { setSelectedDate(date); setSelectedTimeSlot(null); }}
                         className={cn(
                           "min-w-[70px] h-[80px] rounded-[24px] flex flex-col items-center justify-center gap-1 transition-all border shrink-0",
                           isSelected 
                             ? "bg-[#0D8A8A] text-white border-[#0D8A8A] shadow-lg shadow-[#0D8A8A]/30 scale-[1.05]" 
                             : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                         )}
                       >
                         <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                           {i === 0 ? 'Hôm nay' : format(date, 'E', { locale: vi })}
                         </span>
                         <span className="text-xl font-black">{format(date, 'dd')}</span>
                         <span className="text-[9px] font-bold uppercase">Th {format(date, 'MM')}</span>
                       </button>
                     );
                   })}
                </div>
             </div>

             {/* Booking Flow - Step 2: Chọn ca */}
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-amber-400 rounded-full"></div>
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[2.5px]">Chọn ca (1 tiếng)</h4>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                   {timeSlots.map((slot, i) => {
                     const isSelected = selectedTimeSlot === slot.time;
                     return (
                       <button
                         key={i}
                         disabled={!slot.available}
                         onClick={() => setSelectedTimeSlot(slot.time)}
                         className={cn(
                           "py-3 rounded-2xl text-[13px] font-black transition-all border flex items-center justify-center relative",
                           !slot.available
                             ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through decoration-slate-300/50"
                             : isSelected
                               ? "bg-amber-400 border-amber-400 text-amber-900 shadow-lg shadow-amber-400/30 scale-105"
                               : "bg-white border-slate-200 text-slate-600 hover:border-[#0D8A8A]/50 active:scale-95"
                         )}
                       >
                         {slot.time}
                         {isSelected && <Check size={12} strokeWidth={4} className="absolute top-1 right-1 opacity-50" />}
                       </button>
                     );
                   })}
                </div>
             </div>

             {/* Warning Notes */}
             <div className="p-4 bg-teal-50/50 rounded-[20px] flex items-start gap-3 border border-teal-100/50">
               <Info size={16} className="text-[#0D8A8A] shrink-0 mt-0.5" />
               <p className="text-[11px] text-teal-800 leading-relaxed font-medium italic">
                 Vui lòng đến trước 5 phút để check-in. Khách không đến quá 15 phút sẽ bị hủy lịch tự động để nhường chỗ cho cư dân khác.
               </p>
             </div>

             {/* Confirm Action */}
             <div className="pt-2">
                <button 
                  onClick={handleBook}
                  className={cn(
                    "w-full h-16 rounded-[24px] font-black uppercase tracking-[3px] text-sm shadow-2xl transition-all flex items-center justify-center gap-2",
                    selectedTimeSlot
                      ? "bg-[#0D8A8A] text-white shadow-[#0D8A8A]/30 active:scale-95 group"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  )}
                  disabled={!selectedTimeSlot}
                >
                   {selectedTimeSlot ? `Xác nhận: ${selectedTimeSlot}` : 'Vui lòng chọn ca'}
                   {selectedTimeSlot && <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
                </button>
             </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default AmenityList;
