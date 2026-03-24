import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Loader2, 
  Info, 
  Settings2, 
  History, 
  RefreshCw, 
  Save, 
  Plus, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from "lucide-react";
import { format, addDays } from "date-fns";

import { Modal, CurrencyInput } from "@/components/shared";
import { createServiceSchema, updateServiceSchema, CreateServiceForm, UpdateServiceForm } from "@/schemas/serviceSchema";
import { 
  Service, 
  ServiceType, 
  BillingMethod, 
  ServicePriceHistory,
  UpdateServiceDto 
} from "@/types/service";
import { 
  getServiceById, 
  getServices, 
  createService, 
  updateService, 
  getPriceHistory, 
  checkServiceCodeUnique, 
  checkServiceNameUnique,
  generateServiceCode 
} from "@/services/serviceService";
import { 
  SERVICE_TYPE_LABELS, 
  BILLING_METHOD_LABELS 
} from "@/utils/serviceHelpers";
import { Select } from "@/components/ui/Select";
import PriceHistoryTable from "./PriceHistoryTable";
import UpdatePriceModal from "./UpdatePriceModal";
import { cn } from "@/utils";

interface ServiceDetailModalProps {
  open: boolean;
  onClose: () => void;
  serviceId: number | null;
  mode: "create" | "view" | "edit";
  onSuccess: () => void;
}

const BILLING_METHOD_DESCRIPTIONS: Record<BillingMethod, string> = {
  Fixed: "Tính phí cố định hàng tháng, không phụ thuộc sử dụng",
  PerPerson: "Tính theo số người ghi trong hợp đồng",
  PerM2: "Tính theo diện tích phòng (m²)",
  Metered: "Tính theo chỉ số đồng hồ (điện, nước)",
  Usage: "Tính theo số lần sử dụng thực tế",
};

const UNIT_SUGGESTIONS = ["người/tháng", "m2/tháng", "KW", "lần", "tháng"];

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  open,
  onClose,
  serviceId,
  mode,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "history">("info");
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Mode based schema
  const schema = mode === "create" ? createServiceSchema : updateServiceSchema;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateServiceForm | UpdateServiceForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceName: "",
      serviceCode: "",
      serviceType: "Utility",
      unit: "tháng",
      billingMethod: "Fixed",
      description: "",
      isActive: true,
      ...(mode === "create" ? {
        initialPrice: 0,
        priceEffectiveFrom: format(addDays(new Date(), 1), "yyyy-MM-dd"), // Tối thiểu ngày mai
        priceReason: "Giá khởi tạo hệ thống",
      } : {}),
    } as any,
  });

  const selectedBillingMethod = watch("billingMethod");
  const currentServiceCode = watch("serviceCode");

  // Fetch Service History Data
  const { data: priceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["service-price-history", serviceId],
    queryFn: () => getPriceHistory(serviceId!),
    enabled: !!serviceId && activeTab === "history",
  });

  // Fetch Service Detail Data (if not create)
  const { data: serviceDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => getServiceById(serviceId!),
    enabled: !!serviceId && mode !== "create",
  });

  // Init form on service detail load
  useEffect(() => {
    if (serviceDetail && mode !== "create") {
      reset({
        serviceName: serviceDetail.serviceName,
        serviceCode: serviceDetail.serviceCode,
        serviceType: serviceDetail.serviceType,
        unit: serviceDetail.unit,
        billingMethod: serviceDetail.billingMethod,
        description: serviceDetail.description || "",
        isActive: serviceDetail.isActive,
      } as any);
    }
  }, [serviceDetail, mode, reset]);

  // Auto-generate code for create mode
  useEffect(() => {
    if (mode === "create" && open && !currentServiceCode) {
      setValue("serviceCode", generateServiceCode());
    }
  }, [mode, open, currentServiceCode, setValue]);

  const handleGenerateNewCode = () => {
    setValue("serviceCode", generateServiceCode());
    clearErrors("serviceCode");
  };

  const handleCheckCodeUnique = async (code: string) => {
    if (!code || mode === "edit") return;
    const isUnique = await checkServiceCodeUnique(code, serviceId ?? undefined);
    if (!isUnique) {
      setError("serviceCode", { message: "Mã dịch vụ đã tồn tại, vui lòng chọn mã khác" });
    } else {
      clearErrors("serviceCode");
    }
  };

  const handleCheckNameUnique = async (name: string) => {
    if (!name || mode === "edit") return;
    const isUnique = await checkServiceNameUnique(name, serviceId ?? undefined);
    if (!isUnique) {
      setError("serviceName", { message: "Tên dịch vụ đã tồn tại, vui lòng chọn tên khác" });
    } else {
      clearErrors("serviceName");
    }
  };

  const onSubmit = async (data: CreateServiceForm | UpdateServiceForm) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createService(data as CreateServiceForm);
        toast.success(`Đã tạo dịch vụ ${data.serviceName}`);
      } else if (mode === "edit" && serviceId) {
        await updateService(serviceId, data as UpdateServiceDto);
        toast.success(`Đã cập nhật dịch vụ ${data.serviceName}`);
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không thể lưu thông tin"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isReadOnly = mode === "view";
  const isLoading = (mode !== "create" && detailLoading);

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={
        mode === "create" 
          ? "Tạo dịch vụ mới" 
          : mode === "edit" 
            ? `Chỉnh sửa: ${serviceDetail?.serviceCode || ""}` 
            : `Chi tiết: ${serviceDetail?.serviceCode || ""}`
      }
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Tabs Navigation */}
        {mode !== "create" && (
          <div className="flex bg-slate-100/50 p-1.5 rounded-[20px] w-fit mx-auto sm:mx-0">
             <button
               onClick={() => setActiveTab("info")}
               className={cn(
                 "flex items-center gap-2 px-6 h-10 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all",
                 activeTab === "info" 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
               )}
             >
                <Settings2 size={16} /> Thông tin
             </button>
             <button
               onClick={() => setActiveTab("history")}
               className={cn(
                 "flex items-center gap-2 px-6 h-10 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all",
                 activeTab === "history" 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
               )}
             >
                <History size={16} /> Lịch sử Giá
             </button>
          </div>
        )}

        {activeTab === "info" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 className="animate-spin text-primary" size={40} />
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Đang tải thông tin...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Service Name */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Tên dịch vụ <span className="text-red-500">*</span></label>
                        <Controller
                            name="serviceName"
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    onBlur={(e) => {
                                        field.onBlur();
                                        handleCheckNameUnique(e.target.value);
                                    }}
                                    className={cn(
                                        "w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800",
                                        errors.serviceName && "border-red-500",
                                        isReadOnly && "bg-slate-50 text-slate-500 border-none shadow-inner"
                                    )}
                                    placeholder="VD: Cửa cuốn tự động, Vệ sinh tầng..."
                                />
                            )}
                        />
                        {errors.serviceName && <p className="text-xs text-red-500 font-medium">{errors.serviceName.message as string}</p>}
                    </div>

                    {/* Service Code */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Mã dịch vụ <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <Controller
                                name="serviceCode"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        readOnly={mode !== "create"}
                                        onBlur={(e) => {
                                            field.onBlur();
                                            handleCheckCodeUnique(e.target.value);
                                        }}
                                        className={cn(
                                            "w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-black text-slate-800 tracking-wider",
                                            (errors as any).serviceCode && "border-red-500",
                                            mode !== "create" && "bg-slate-50 text-slate-500 border-none shadow-inner cursor-not-allowed"
                                        )}
                                        placeholder="SVC-XXXX"
                                    />
                                )}
                            />
                            {mode === "create" && (
                                <button
                                    type="button"
                                    onClick={handleGenerateNewCode}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm"
                                    title="Tạo mã mới"
                                >
                                    <RefreshCw size={14} className={isSubmitting ? "animate-spin" : ""} />
                                </button>
                            )}
                        </div>
                        {(errors as any).serviceCode && <p className="text-xs text-red-500 font-medium">{(errors as any).serviceCode.message}</p>}
                    </div>

                    {/* Service Type */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Loại dịch vụ <span className="text-red-500">*</span></label>
                        <Controller
                            name="serviceType"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => ({
                                        value: val,
                                        label: label,
                                    }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                    disabled={isReadOnly}
                                    placeholder="Chọn loại dịch vụ"
                                />
                            )}
                        />
                        {errors.serviceType && <p className="text-xs text-red-500 font-medium">{errors.serviceType.message as string}</p>}
                    </div>

                    {/* Billing Method */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Phương thức tính <span className="text-red-500">*</span></label>
                        <Controller
                            name="billingMethod"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <Select
                                        options={Object.entries(BILLING_METHOD_LABELS).map(([val, label]) => ({
                                            value: val,
                                            label: label,
                                        }))}
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isReadOnly}
                                        placeholder="Chọn phương thức tính"
                                    />
                                    {field.value && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100/50">
                                            <Info size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                                                {BILLING_METHOD_DESCRIPTIONS[field.value as BillingMethod]}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                        {errors.billingMethod && <p className="text-xs text-red-500 font-medium">{errors.billingMethod.message as string}</p>}
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Đơn vị tính <span className="text-red-500">*</span></label>
                        <Controller
                            name="unit"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <input
                                        {...field}
                                        disabled={isReadOnly}
                                        list="unit-suggestions"
                                        className={cn(
                                            "w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800",
                                            errors.unit && "border-red-500",
                                            isReadOnly && "bg-slate-50 text-slate-500 border-none shadow-inner"
                                        )}
                                        placeholder="Chọn hoặc nhập đơn vị..."
                                    />
                                    <datalist id="unit-suggestions">
                                        {UNIT_SUGGESTIONS.map(u => <option key={u} value={u} />)}
                                    </datalist>
                                </div>
                            )}
                        />
                        {errors.unit && <p className="text-xs text-red-500 font-medium">{errors.unit.message as string}</p>}
                    </div>

                    {/* Active Status Toggle */}
                    <div className="space-y-2 flex flex-col justify-end pb-1 px-1">
                        <Controller
                            name="isActive"
                            control={control}
                            render={({ field }) => (
                                <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => field.onChange(!field.value)}
                                    className={cn(
                                        "flex items-center justify-between w-full h-14 px-5 rounded-2xl border transition-all",
                                        field.value 
                                            ? "bg-green-50 border-green-200 text-green-700 shadow-sm" 
                                            : "bg-slate-50 border-slate-200 text-slate-400 opacity-60",
                                        isReadOnly && "pointer-events-none"
                                    )}
                                >
                                    <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                        {field.value ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                        Trạng thái hoạt động
                                    </span>
                                    <div className={cn(
                                        "w-12 h-6 rounded-full relative transition-colors p-1",
                                        field.value ? "bg-green-500" : "bg-slate-300"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-transform",
                                            field.value ? "translate-x-6" : "translate-x-0"
                                        )} />
                                    </div>
                                </button>
                            )}
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Mô tả dịch vụ</label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <textarea
                                    {...field}
                                    disabled={isReadOnly}
                                    rows={3}
                                    className={cn(
                                        "w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-600 resize-none",
                                        isReadOnly && "bg-slate-50 text-slate-400 border-none shadow-inner"
                                    )}
                                    placeholder="Thông tin thêm về cách triển khai hoặc lưu ý cho cư dân..."
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Section only for Create Mode */}
                {mode === "create" && (
                    <div className="pt-8 border-t border-slate-100 animate-in zoom-in-95 duration-500 delay-150">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Plus size={18} />
                            </div>
                            <h3 className="text-[14px] font-black uppercase tracking-[2px] text-slate-900">Thiết lập giá ban đầu</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 /10 p-6 rounded-[28px] border border-dashed border-slate-200">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Giá ban đầu (VND) <span className="text-red-500">*</span></label>
                                <Controller
                                    name="initialPrice"
                                    control={control}
                                    render={({ field }) => (
                                        <CurrencyInput
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="h-14 font-black text-xl tracking-tight"
                                        />
                                    )}
                                />
                                {errors && (errors as any).initialPrice && <p className="text-xs text-red-500 font-medium">{(errors as any).initialPrice.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Ngày áp dụng <span className="text-red-500">*</span></label>
                                <Controller
                                    name="priceEffectiveFrom"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="date"
                                            className={cn(
                                                "w-full h-14 bg-white border border-slate-200 rounded-2xl px-5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-black text-slate-800",
                                                (errors as any)?.priceEffectiveFrom && "border-red-500"
                                            )}
                                        />
                                    )}
                                />
                                {errors && (errors as any).priceEffectiveFrom && <p className="text-xs text-red-500 font-medium">{(errors as any).priceEffectiveFrom.message}</p>}
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 ml-1">Lý do thiết lập <span className="text-red-500">*</span></label>
                                <Controller
                                    name="priceReason"
                                    control={control}
                                    render={({ field }) => (
                                        <textarea
                                            {...field}
                                            rows={2}
                                            className={cn(
                                                "w-full bg-white border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium text-slate-600 resize-none",
                                                (errors as any)?.priceReason && "border-red-500"
                                            )}
                                            placeholder="VD: Giá quy định theo hợp đồng thuê, giá điện nhà nước Q1/2025..."
                                        />
                                    )}
                                />
                                {errors && (errors as any).priceReason && <p className="text-xs text-red-500 font-medium">{(errors as any).priceReason.message}</p>}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Submit Buttons */}
                {!isReadOnly && (
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 h-12 rounded-xl text-[11px] font-black uppercase tracking-[2px] text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary text-white h-12 px-10 rounded-xl text-[11px] font-black uppercase tracking-[2px] flex items-center gap-2 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            {isSubmitting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                mode === "create" ? <><Plus size={16} /> Tạo dịch vụ</> : <><Save size={16} /> Lưu thay đổi</>
                            )}
                        </button>
                    </div>
                )}

                {isReadOnly && (
                    <div className="flex justify-end pt-4 border-t border-slate-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-12 h-14 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[3px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            Đóng cửa sổ
                        </button>
                    </div>
                )}
              </>
            )}
          </form>
        ) : (
          /* TAB 2: PRICE HISTORY */
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <PriceHistoryTable
               priceHistory={priceHistory}
               isLoading={historyLoading}
               onUpdatePrice={() => setShowUpdatePrice(true)}
            />
          </div>
        )}
      </div>

      {/* Update Price Modal */}
      {serviceDetail && (
        <UpdatePriceModal
          open={showUpdatePrice}
          onClose={() => setShowUpdatePrice(false)}
          service={serviceDetail}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["service-price-history", serviceId] });
            queryClient.invalidateQueries({ queryKey: ["service", serviceId] });
          }}
        />
      )}
    </Modal>
  );
};

export default ServiceDetailModal;
