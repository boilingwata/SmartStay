import React, { useState } from "react";
import { useForm, Controller, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Calendar, ShieldCheck, Info } from "lucide-react";
import { addDays, format, subDays } from "date-fns";

// RULE-09: ElectricityPolicies and WaterPolicies are IMMUTABLE.
// Any update creates a NEW record via POST. No PUT/PATCH allowed for historical records.
import {
  Modal,
  TierTableInput,
  PolicyPreview,
  CurrencyInput,
} from "@/components/shared";
import {
  createElectricityPolicySchema,
  createWaterPolicySchema,
  CreateElectricityPolicyForm,
  CreateWaterPolicyForm,
} from "@/schemas/policySchema";
import {
  ElectricityPolicy,
  WaterPolicy,
} from "@/types/policy";
import {
  createElectricityPolicy,
  createWaterPolicy,
} from "@/services/policyService";
import { useConfirm } from "@/hooks/useConfirm";
import { cn, formatDate } from "@/utils";

interface CreatePolicyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: "electricity" | "water";
  currentPolicy: ElectricityPolicy | WaterPolicy | null;
}

const DEFAULT_ELECTRICITY_TIERS = [
  { fromKwh: 0, toKwh: 50, unitPrice: 1806, unitPriceWithVat: 1986.6 },
  { fromKwh: 51, toKwh: 100, unitPrice: 1866, unitPriceWithVat: 2052.6 },
  { fromKwh: 101, toKwh: 200, unitPrice: 2167, unitPriceWithVat: 2383.7 },
  { fromKwh: 201, toKwh: 300, unitPrice: 2729, unitPriceWithVat: 3001.9 },
  { fromKwh: 301, toKwh: 400, unitPrice: 3050, unitPriceWithVat: 3355 },
  { fromKwh: 401, toKwh: null, unitPrice: 3151, unitPriceWithVat: 3466.1 },
];

const DEFAULT_WATER_TIERS = [
  { fromM3: 0, toM3: 10, unitPrice: 5973, unitPriceWithVat: 6570.3 },
  { fromM3: 11, toM3: 20, unitPrice: 7052, unitPriceWithVat: 7757.2 },
  { fromM3: 21, toM3: 30, unitPrice: 8669, unitPriceWithVat: 9535.9 },
  { fromM3: 31, toM3: null, unitPrice: 15929, unitPriceWithVat: 17521.9 },
];

export const CreatePolicyModal: React.FC<CreatePolicyModalProps> = ({
  open,
  onClose,
  onSuccess,
  type,
  currentPolicy,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm } = useConfirm();

  const schema = type === "electricity" ? createElectricityPolicySchema : createWaterPolicySchema;
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateElectricityPolicyForm | CreateWaterPolicyForm>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      policyName: "",
      effectiveFrom: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      vatRate: 10,
      legalReference: "",
      tiers: type === "electricity" ? DEFAULT_ELECTRICITY_TIERS : DEFAULT_WATER_TIERS,
      ...(type === "water" ? {
        zoneName: "Khu vực 1",
        environmentFee: 0,
        maintenanceFee: 0,
      } : {}),
    } as any,
  });

  const effectiveFrom = watch("effectiveFrom");
  const tiers = watch("tiers");
  const vatRate = watch("vatRate");

  const onSubmit = async (data: FieldValues) => {
    // RULE-09: Update = POST new record.
    // Step 2: Confirmation
    const expireDate = formatDate(subDays(new Date(data.effectiveFrom), 1));
    const isConfirmed = await confirm({
      title: "Xác nhận tạo chính sách mới",
      description: (
        <div className="space-y-4">
          <p>
            Chính sách hiện tại <span className="font-bold text-slate-900">'{currentPolicy?.policyName || "N/A"}'</span> sẽ hết hiệu lực vào <span className="text-red-600 font-bold">{expireDate}</span>.
          </p>
          <p>
            Chính sách mới <span className="font-bold text-blue-600">'{data.policyName}'</span> sẽ có hiệu lực từ <span className="text-blue-600 font-bold">{formatDate(data.effectiveFrom)}</span>.
          </p>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs shadow-sm">
            <ShieldCheck size={14} className="inline mr-1" />
            Lưu ý: Dữ liệu lịch sử là bất biến (IMMUTABLE) theo RULE-09. Không thể sửa sau khi đã tạo.
          </div>
          <p className="font-medium">Bạn có chắc chắn muốn tiếp tục?</p>
        </div>
      ),
      confirmLabel: "Xác nhận tạo chính sách",
      variant: "info",
    });

    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      if (type === "electricity") {
        await createElectricityPolicy(data as CreateElectricityPolicyForm);
      } else {
        await createWaterPolicy(data as CreateWaterPolicyForm);
      }
      toast.success(`Chính sách mới '${data.policyName}' sẽ có hiệu lực từ ${formatDate(data.effectiveFrom)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message || "Không thể tạo chính sách"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`TẠO CHÍNH SÁCH ${type === "electricity" ? "ĐIỆN" : "NƯỚC"} MỚI`}
      className="max-w-5xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 col-span-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase flex items-center gap-2">
              Tên chính sách
              <span className="text-red-500">*</span>
            </label>
            <Controller
              name="policyName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  placeholder="VD: Giá điện sinh hoạt 2026..."
                  className={cn(
                    "w-full h-11 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium",
                    errors.policyName && "border-red-500 focus:ring-red-500/10"
                  )}
                />
              )}
            />
            {errors.policyName && <p className="text-xs text-red-500 font-medium">{errors.policyName.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase flex items-center gap-2">
              <Calendar size={14} />
              Ngày hiệu lực
              <span className="text-red-500">*</span>
            </label>
            <Controller
              name="effectiveFrom"
              control={control}
              render={({ field }) => (
                <div className="relative">
                   <input
                    {...field}
                    type="date"
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd")}
                    className={cn(
                      "w-full h-11 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium",
                      errors.effectiveFrom && "border-red-500 focus:ring-red-500/10"
                    )}
                  />
                  {effectiveFrom && (
                    <div className="mt-2 text-[11px] text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 flex items-center gap-1.5">
                      <Info size={12} />
                      Chính sách hiện tại sẽ hết hiệu lực vào {formatDate(subDays(new Date(effectiveFrom), 1))}
                    </div>
                  )}
                </div>
              )}
            />
            {errors.effectiveFrom && <p className="text-xs text-red-500 font-medium">{errors.effectiveFrom.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-500 uppercase flex items-center gap-2">
              Thuế VAT (%)
            </label>
            <Controller
              name="vatRate"
              control={control}
              render={({ field: { value, onChange } }) => (
                <input
                  type="number"
                  value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                />
              )}
            />
            {errors.vatRate && <p className="text-xs text-red-500 font-medium">{errors.vatRate.message as string}</p>}
          </div>
        </div>

        {/* Section 2: Specific Fields for Water */}
        {type === "water" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-blue-50/30 rounded-[24px] border border-blue-100">
             <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-500 uppercase">Tên vùng</label>
              <Controller
                name="zoneName"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-500 uppercase">Phí môi trường</label>
              <Controller
                name="environmentFee"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CurrencyInput value={value} onValueChange={onChange} className="bg-white border-slate-200" />
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-500 uppercase">Phí bảo trì</label>
              <Controller
                name="maintenanceFee"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CurrencyInput value={value} onValueChange={onChange} className="bg-white border-slate-200" />
                )}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-500 uppercase">Căn cứ pháp lý / Ghi chú</label>
          <Controller
            name="legalReference"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={2}
                placeholder="VD: Quyết định 1062/QĐ-BCT của Bộ Công Thương..."
                className="w-full bg-white border border-slate-200 rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none shadow-sm"
              />
            )}
          />
        </div>

        {/* Section 3: Tiers & Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-[14px] font-black uppercase tracking-wider text-slate-800 border-l-4 border-blue-500 pl-3">
              Bảng giá bậc thang
            </h3>
            <Controller
              name="tiers"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TierTableInput
                  value={value}
                  onChange={onChange}
                  vatRate={vatRate}
                  unit={type === "electricity" ? "kWh" : "m3"}
                  error={errors.tiers?.message as string}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-[14px] font-black uppercase tracking-wider text-slate-800 border-l-4 border-emerald-500 pl-3">
              Xem trước tính toán
            </h3>
            <PolicyPreview
              tiers={tiers}
              vatRate={vatRate}
              unit={type === "electricity" ? "kWh" : "m3"}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-wider text-xs"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 h-12 bg-blue-600 rounded-xl font-black text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 uppercase tracking-wider text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              "Xác nhận tạo chính sách"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePolicyModal;
