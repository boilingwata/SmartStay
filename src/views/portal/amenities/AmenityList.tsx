import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, MapPin, ArrowRight, Waves, Dumbbell, Utensils, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { portalAmenityService, type PortalAmenityItem } from "@/services/portalAmenityService";
import { BottomSheet } from "@/components/portal/BottomSheet";
import { SafeImage } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { cn, formatVND } from "@/utils";

const AmenityList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAmenity, setSelectedAmenity] = useState<PortalAmenityItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(1);

  const { data: amenities = [], isLoading } = useQuery({
    queryKey: ["portal-amenities"],
    queryFn: () => portalAmenityService.getAmenities(),
  });

  const bookingMutation = useMutation({
    mutationFn: (data: { amenityId: number; date: string; timeSlot: string }) => portalAmenityService.createBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-my-bookings"] });
      toast.success(`Đặt thành công ${selectedAmenity?.amenityName}`);
      resetBookingState();
    },
    onError: (error: any) => {
      if (error.code === "23505" || error.message?.includes("conflict")) {
        toast.error("Khung giờ này đã được đặt, vui lòng chọn giờ khác");
        return;
      }
      toast.error(`Không thể đặt tiện ích: ${error.message}`);
    },
  });

  const resetBookingState = () => {
    setSelectedAmenity(null);
    setSelectedTimeSlot(null);
    setBookingStep(1);
  };

  const next7Days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i)), []);
  const timeSlots = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => {
        const hour = i + 6;
        const time = `${hour.toString().padStart(2, "0")}:00`;
        const isPast = isSameDay(selectedDate, new Date()) && hour <= new Date().getHours() + 1;
        return { time, available: !isPast };
      }),
    [selectedDate],
  );

  const getIcon = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("bơi")) return Waves;
    if (normalized.includes("gym") || normalized.includes("thể")) return Dumbbell;
    if (normalized.includes("ăn") || normalized.includes("bbq")) return Utensils;
    if (normalized.includes("cà phê") || normalized.includes("coffee")) return Coffee;
    return MapPin;
  };

  const getImageUrl = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("bơi")) return "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?q=80&w=800&auto=format&fit=crop";
    if (normalized.includes("gym")) return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop";
    if (normalized.includes("bbq")) return "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=800&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop";
  };

  const handleBook = () => {
    if (!selectedTimeSlot || !selectedAmenity) return;
    const endHour = parseInt(selectedTimeSlot.split(":")[0] ?? "0", 10) + 1;
    const endTime = `${String(endHour).padStart(2, "0")}:00`;

    bookingMutation.mutate({
      amenityId: selectedAmenity.amenityId,
      date: format(selectedDate, "yyyy-MM-dd"),
      timeSlot: `${selectedTimeSlot} - ${endTime}`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-4 px-6">
        <Spinner size="lg" />
        <p className="text-sm font-black uppercase tracking-[3px] text-slate-400">Đang tải tiện ích đặt chỗ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="space-y-8 p-5 pt-6">
        <div className="flex items-center justify-between pr-2">
          <div className="space-y-1">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-teal-600/60">Dành cho cư dân</p>
            <h2 className="text-2xl font-black leading-none tracking-tight text-slate-800">Tiện ích đặt chỗ</h2>
          </div>
          <button
            onClick={() => navigate("/portal/amenities/my-bookings")}
            className="flex h-12 items-center justify-center rounded-2xl border border-teal-100 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-teal-600 shadow-lg shadow-teal-600/5"
          >
            Lịch đặt của tôi
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="border-l-4 border-teal-500 pl-3 text-[12px] font-black uppercase tracking-[3px] text-slate-400">
            Danh sách tiện ích
          </h3>
          <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-black tabular-nums text-slate-400 shadow-sm">
            {amenities.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((item) => (
            <div
              key={item.amenityId}
              onClick={() => {
                setSelectedAmenity(item);
                setBookingStep(1);
                setSelectedTimeSlot(null);
              }}
              className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[32px] border border-white shadow-xl shadow-slate-900/5 transition-all hover:scale-[1.02]"
            >
              <SafeImage
                src={getImageUrl(item.amenityName)}
                alt={item.amenityName}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-emerald-500/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white">
                Sẵn sàng
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 text-white">
                <div className="space-y-1">
                  <h4 className="text-lg font-black uppercase tracking-tight">{item.amenityName}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-black tracking-tighter text-teal-300">
                      {item.bookingPrice > 0 ? formatVND(item.bookingPrice) : "Miễn phí"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">/ lượt</span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white transition-all group-hover:border-teal-400 group-hover:bg-teal-500">
                  <ArrowRight size={18} strokeWidth={3} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {amenities.length === 0 && (
          <div className="space-y-4 rounded-[48px] border-2 border-dashed border-slate-200 bg-white/40 py-24 text-center shadow-inner">
            <AlertCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-xs font-black uppercase tracking-[4px] italic text-slate-400">Chưa có tiện ích khả dụng</p>
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={!!selectedAmenity}
        onClose={resetBookingState}
        title={bookingStep === 1 ? "Chọn ngày" : bookingStep === 2 ? "Chọn khung giờ" : "Xác nhận đặt chỗ"}
        height="h-auto"
      >
        {selectedAmenity && (
          <div className="mx-auto max-w-md space-y-8 px-1 pb-8 pt-4">
            {bookingStep === 1 && (
              <div className="space-y-8">
                <div className="grid grid-cols-7 gap-3">
                  {next7Days.map((date, index) => (
                    <div key={`label-${index}`} className="mb-1 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {format(date, "EEEEEE", { locale: vi })}
                    </div>
                  ))}
                  {next7Days.map((date, index) => {
                    const isToday = isSameDay(date, new Date());
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedDate(date);
                          setBookingStep(2);
                        }}
                        className={cn(
                          "relative aspect-square rounded-[22px] border bg-white text-slate-700 shadow-sm transition-all hover:border-teal-200 hover:bg-teal-50",
                          isToday && "ring-2 ring-teal-500 ring-offset-4",
                        )}
                      >
                        <span className="text-[17px] font-black tracking-tighter">{format(date, "d")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="space-y-8">
                <div className="flex items-center justify-between rounded-[20px] border border-teal-100/50 bg-teal-50/50 p-4">
                  <p className="text-[11px] font-black text-teal-800">Ngày {format(selectedDate, "dd/MM/yyyy")}</p>
                  <button onClick={() => setBookingStep(1)} className="text-[10px] font-black text-teal-600 underline underline-offset-4">
                    Đổi ngày
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.time)}
                      className={cn(
                        "rounded-[20px] border py-4 font-mono text-[15px] font-black tracking-tighter shadow-sm transition-all",
                        !slot.available
                          ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 opacity-50"
                          : selectedTimeSlot === slot.time
                            ? "scale-[1.05] border-teal-600 bg-teal-600 text-white shadow-xl shadow-teal-600/20"
                            : "border-slate-100 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50/10",
                      )}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setBookingStep(3)}
                  disabled={!selectedTimeSlot}
                  className={cn(
                    "flex h-16 w-full items-center justify-center gap-3 rounded-[24px] text-[11px] font-black uppercase tracking-[3px] shadow-xl",
                    selectedTimeSlot ? "bg-slate-900 text-white" : "cursor-not-allowed bg-slate-100 text-slate-300",
                  )}
                >
                  Tiếp tục xác nhận
                  <ArrowRight size={18} strokeWidth={3} />
                </button>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="space-y-8">
                <div className="relative space-y-6 overflow-hidden rounded-[32px] border border-slate-100 bg-slate-50 p-8 shadow-inner">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] border border-slate-100 bg-white text-teal-600 shadow-xl shadow-teal-600/5">
                      {React.createElement(getIcon(selectedAmenity.amenityName), { size: 36, strokeWidth: 2.5 })}
                    </div>
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-slate-900">{selectedAmenity.amenityName}</h4>
                      <p className="mt-2 inline-block rounded-md bg-teal-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-teal-600">
                        Xác nhận chi tiết
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-200/50 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian</span>
                      <span className="font-mono text-[15px] font-black tracking-tighter text-slate-800">
                        {selectedTimeSlot} • {format(selectedDate, "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phí đặt chỗ</span>
                      <span className="text-[18px] font-black tracking-tighter text-teal-600">
                        {selectedAmenity.bookingPrice > 0 ? formatVND(selectedAmenity.bookingPrice) : "Miễn phí"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="h-16 flex-1 rounded-[24px] border border-slate-200 bg-white text-[11px] font-black uppercase tracking-widest text-slate-400"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={bookingMutation.isPending}
                    className="h-16 flex-[2] rounded-[24px] bg-teal-600 text-[11px] font-black uppercase tracking-[3px] text-white shadow-2xl shadow-teal-600/30"
                  >
                    {bookingMutation.isPending ? "Đang xác thực..." : "Xác nhận đặt ngay"}
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
