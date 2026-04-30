// RULE-08: Lịch sử giá không được sửa hoặc xóa.
// Khi cập nhật giá, hệ thống thêm một mốc giá mới và tự đóng mốc giá cũ.

import React, { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, addDays, subDays } from "date-fns";
import { 
  AlertTriangle, 
  Calendar, 
  History, 
  Info, 
  Loader2, 
  MessageSquare, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";

import { Modal, CurrencyInput } from "@/components/shared";
import { updatePriceSchema, UpdatePriceForm } from "@/schemas/serviceSchema";
import { Service } from "@/types/service";
import { updateServicePrice } from "@/services/serviceService";
import { useConfirm } from "@/hooks/useConfirm";
import { cn, formatDate } from "@/utils";
import { formatVND, calcPriceChangePct, isPriceChangeWarning } from "@/utils/serviceHelpers";

interface UpdatePriceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service: Service;
}

const UpdatePriceModal: React.FC<UpdatePriceModalProps> = ({
  open,
  onClose,
  onSuccess,
  service,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm } = useConfirm();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdatePriceForm>({
    resolver: zodResolver(updatePriceSchema),
    defaultValues: {
      newPrice: 0,
      effectiveFrom: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      reason: "",
    },
  });

  const newPrice = watch("newPrice");
  const effectiveFrom = watch("effectiveFrom");
  const reason = watch("reason");

  const priceDiff = useMemo(() => {
    if (!newPrice || newPrice <= 0) return 0;
    return calcPriceChangePct(service.currentPrice, newPrice);
  }, [newPrice, service.currentPrice]);

  const showWarning = useMemo(() => {
    return isPriceChangeWarning(service.currentPrice, newPrice);
  }, [newPrice, service.currentPrice]);

  const onSubmit = async (data: UpdatePriceForm) => {
    const expireDate = formatDate(subDays(new Date(data.effectiveFrom), 1));
    const isWarning = isPriceChangeWarning(service.currentPrice, data.newPrice);
    const pctChange = ((data.newPrice - service.currentPrice) / service.currentPrice) * 100;

    const isConfirmed = await confirm({
      title: "Xác nhận cập nhật giá mới",
      variant: isWarning ? "warning" : "info",
      description: (
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
             <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Dịch vụ</span>
                <span className="text-slate-900">{service.serviceName} ({service.serviceCode})</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">Giá hiện tại:</span>
                <span className="text-sm font-bold text-slate-900">{formatVND(service.currentPrice)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">Giá mới:</span>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-primary">{formatVND(data.newPrice)}</span>
                    <span className={cn(
                        "text-[10px] font-bold",
                        pctChange > 0 ? "text-red-500" : "text-green-500"
                    )}>
                        ({pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%)
                    </span>
                </div>
             </div>
          </div>

          <div className="flex flex-col gap-1.5 px-1">
             <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Giá hiện tại sẽ hết hiệu lực vào <span className="text-red-600 font-bold">{expireDate}</span>.
             </p>
             <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Giá mới sẽ bắt đầu áp dụng từ <span className="text-blue-600 font-bold">{formatDate(data.effectiveFrom)}</span>.
             </p>
          </div>

          {isWarning && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-bold flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 animate-pulse text-amber-600" />
                Lưu ý: Giá thay đổi hơn 20%. Bạn đã kiểm tra kỹ và có căn cứ xác thực?
            </div>
          )}
        </div>
      ),
      confirmLabel: "Xác nhận & Áp dụng giá",
      cancelLabel: "Kiểm tra lại",
    });

    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      await updateServicePrice(service.serviceId, data);
      toast.success(
        `Giá mới ${service.serviceCode}: ${formatVND(data.newPrice)} sẽ áp dụng từ ${formatDate(data.effectiveFrom)}`
      );
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không thể cập nhật giá"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Cập nhật giá - ${service.serviceCode}`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Price Display (Readonly) */}
        <div className="p-5 bg-slate-50 rounded-[28px] border border-slate-100/50 flex flex-col gap-1 shadow-inner">
           <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">Giá hiện tại</label>
           <div className="flex items-baseline gap-3">
              <span className="text-2xl font-black text-slate-400 opacity-70">
                {formatVND(service.currentPrice)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100/50 px-2 py-1 rounded-lg">
                Áp dụng từ: {formatDate(service.currentPriceEffectiveFrom)}
              </span>
           </div>
        </div>

        <div className="space-y-6 px-1">
            {/* New Price Input */}
            <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2">
                    <History size={14} className="text-primary" />
                    Giá mới (VND)
                    <span className="text-red-500">*</span>
                </label>
                <Controller
                    name="newPrice"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <div className="space-y-3">
                            <CurrencyInput 
                                value={value} 
                                onValueChange={onChange} 
                                className={cn(
                                    "h-14 text-lg font-black tracking-tight",
                                    errors.newPrice && "border-red-500 focus:ring-red-500/10"
                                )}
                            />
                            {showWarning && (
                                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Cảnh báo chênh lệch</p>
                                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                            Giá thay đổi <span className="font-bold underline">{priceDiff.toFixed(1)}%</span> so với giá hiện tại. 
                                            Vui lòng xác nhận lý do rõ ràng.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                />
                {errors.newPrice && <p className="text-xs text-red-500 font-medium">{errors.newPrice.message}</p>}
            </div>

            {/* Effective From Date */}
            <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    Ngày bắt đầu áp dụng
                    <span className="text-red-500">*</span>
                </label>
                <Controller
                    name="effectiveFrom"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-3">
                            <div className="relative group">
                                <input
                                    {...field}
                                    type="date"
                                    min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                                    className={cn(
                                        "w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-black text-slate-800",
                                        errors.effectiveFrom && "border-red-500 focus:ring-red-500/10"
                                    )}
                                />
                            </div>
                            {effectiveFrom && (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                                    <span className="text-red-500">Hết hạn:</span>
                                    <span className="text-slate-600">{formatDate(subDays(new Date(effectiveFrom), 1))}</span>
                                    <ArrowRight size={12} className="text-slate-300" />
                                    <span className="text-blue-500">Hiệu lực:</span>
                                    <span className="text-slate-600">{formatDate(effectiveFrom)}</span>
                                </div>
                            )}
                        </div>
                    )}
                />
                {errors.effectiveFrom && <p className="text-xs text-red-500 font-medium">{errors.effectiveFrom.message}</p>}
            </div>

            {/* Change Reason */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-2">
                        <MessageSquare size={14} className="text-primary" />
                        Lý do thay đổi
                        <span className="text-red-500">*</span>
                    </label>
                    <span className={cn(
                        "text-[10px] font-bold",
                        reason.length >= 500 ? "text-red-500" : "text-slate-400"
                    )}>
                        {reason.length}/500
                    </span>
                </div>
                <Controller
                    name="reason"
                    control={control}
                    render={({ field }) => (
                        <textarea
                            {...field}
                            rows={3}
                            placeholder="Ví dụ: Điều chỉnh theo khung giá nhà nước mới áp dụng từ quý 2/2026..."
                            className={cn(
                                "w-full bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium resize-none shadow-sm",
                                errors.reason && "border-red-500 focus:ring-red-500/10"
                            )}
                        />
                    )}
                />
                {errors.reason && <p className="text-xs text-red-500 font-medium">{errors.reason.message}</p>}
                <p className="text-[10px] text-slate-400 italic flex items-center gap-1.5 px-2">
                    <Info size={12} /> Dữ liệu này sẽ được lưu cố định vào lịch sử giá và không thể xóa.
                </p>
            </div>
        </div>

        <div className="flex flex-col pt-4 gap-3">
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[3px] hover:bg-primary/90 hover:translate-y-[-2px] active:translate-y-[0] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang xử lý...
                    </>
                ) : (
                    "Cập nhật giá mới"
                )}
            </button>
            <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full h-12 bg-white text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-[2px] hover:bg-slate-50 transition-all"
            >
                Bỏ qua
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdatePriceModal;
