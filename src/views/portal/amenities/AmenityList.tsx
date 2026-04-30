import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, MapPin, ArrowRight, Waves, Dumbbell, Utensils, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { portalAmenityService, type PortalAmenityItem } from "@/services/portalAmenityService";
import { BottomSheet } from "@/components/portal/BottomSheet";
import { SafeImage, Spinner } from "@/components/ui";
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
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground animate-pulse">Đang tải tiện ích...</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen pb-32 bg-background">
      <div className="space-y-8 p-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary/70">Dịch vụ cư dân</p>
            <h2 className="text-3xl font-extrabold leading-none tracking-tight text-foreground">Tiện ích</h2>
          </div>
          <button
            onClick={() => navigate("/portal/amenities/my-bookings")}
            className="flex h-10 items-center justify-center rounded-full bg-primary/10 px-5 text-xs font-bold text-primary transition-colors hover:bg-primary/20 active:scale-95"
          >
            Lịch của tôi
          </button>
        </div>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-semibold tracking-wide text-foreground">
            Danh sách tiện ích
          </h3>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
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
              className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[24px] bg-muted shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
            >
              <SafeImage
                src={getImageUrl(item.amenityName)}
                alt={item.amenityName}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />
              <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                Sẵn sàng
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 text-white">
                <div className="space-y-1">
                  <h4 className="text-xl font-bold tracking-tight text-white">{item.amenityName}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-white/90">
                      {item.bookingPrice > 0 ? formatVND(item.bookingPrice) : "Miễn phí"}
                    </span>
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {amenities.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-border bg-muted/50 py-24 text-center">
            <AlertCircle size={48} className="text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium tracking-wide text-muted-foreground">Chưa có tiện ích khả dụng</p>
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
          <div className="mx-auto max-w-md space-y-8 px-2 pb-8 pt-2">
            {bookingStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-7 gap-2">
                  {next7Days.map((date, index) => (
                    <div key={`label-${index}`} className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                          "relative flex aspect-square items-center justify-center rounded-2xl border transition-all duration-200",
                          isToday 
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted font-medium"
                        )}
                      >
                        <span className="text-lg">{format(date, "d")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {bookingStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 border border-border">
                  <p className="text-sm font-semibold text-foreground">Ngày {format(selectedDate, "dd/MM/yyyy")}</p>
                  <button onClick={() => setBookingStep(1)} className="text-xs font-medium text-primary hover:underline">
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
                        "rounded-xl border py-3 text-sm font-medium tracking-tight transition-all duration-200",
                        !slot.available
                          ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground/40"
                          : selectedTimeSlot === slot.time
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                            : "border-border bg-background text-foreground hover:border-primary/30"
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
                    "flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300",
                    selectedTimeSlot 
                      ? "bg-foreground text-background shadow-lg hover:scale-[1.02]" 
                      : "cursor-not-allowed bg-muted text-muted-foreground"
                  )}
                >
                  Tiếp tục
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}
            {bookingStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {React.createElement(getIcon(selectedAmenity.amenityName), { size: 28, strokeWidth: 2 })}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{selectedAmenity.amenityName}</h4>
                      <p className="text-xs font-medium text-muted-foreground mt-1">Xác nhận chi tiết đặt chỗ</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Thời gian</span>
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {selectedTimeSlot} • {format(selectedDate, "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Phí đặt chỗ</span>
                      <span className="text-base font-bold text-primary">
                        {selectedAmenity.bookingPrice > 0 ? formatVND(selectedAmenity.bookingPrice) : "Miễn phí"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="h-14 flex-[1] rounded-xl border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleBook}
                    disabled={bookingMutation.isPending}
                    className="h-14 flex-[2] rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98] disabled:opacity-70"
                  >
                    {bookingMutation.isPending ? "Đang xử lý..." : "Xác nhận đặt"}
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
