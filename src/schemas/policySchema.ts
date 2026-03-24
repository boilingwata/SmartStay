import { z } from "zod";

// Schema cho 1 tier điện
export const electricityTierSchema = z.object({
  fromKwh: z.number().min(0, "Từ kWh phải >= 0"),
  toKwh: z.number().nullable(),
  unitPrice: z.number().positive("Đơn giá phải > 0"),
  unitPriceWithVat: z.number().positive(),
  note: z.string().optional(),
});

// Schema cho 1 tier nước
export const waterTierSchema = z.object({
  fromM3: z.number().min(0, "Từ m3 phải >= 0"),
  toM3: z.number().nullable(),
  unitPrice: z.number().positive("Đơn giá phải > 0"),
  unitPriceWithVat: z.number().positive(),
  note: z.string().optional(),
});

// Schema tạo chính sách điện mới
export const createElectricityPolicySchema = z.object({
  policyName: z.string()
    .min(1, "Tên chính sách không được trống")
    .max(200, "Tên tối đa 200 ký tự"),
  effectiveFrom: z.string().refine((date) => {
    return new Date(date) > new Date();
  }, "Ngày hiệu lực phải là ngày trong tương lai (tối thiểu ngày mai)"),
  legalReference: z.string().max(500).optional(),
  vatRate: z.number()
    .min(0, "VAT phải >= 0%")
    .max(100, "VAT phải <= 100%"),
  tiers: z.array(electricityTierSchema)
    .min(1, "Phải có ít nhất 1 bậc giá")
    .refine((tiers) => {
      // Validate tính liên tục
      if (tiers[0].fromKwh !== 0) return false;
      for (let i = 0; i < tiers.length - 1; i++) {
        if (tiers[i].toKwh === null) return false;
        if (tiers[i].toKwh! + 1 !== tiers[i + 1].fromKwh) return false;
      }
      // Bậc cuối phải có toKwh = null
      return tiers[tiers.length - 1].toKwh === null;
    }, "Bậc đầu tiên phải bắt đầu từ 0. Khoảng bậc giá phải liên tục, không có khoảng trống hoặc chồng lấp. Bậc cuối phải để trống giới hạn trên."),
});

// Schema tạo chính sách nước mới
export const createWaterPolicySchema = z.object({
  policyName: z.string()
    .min(1, "Tên chính sách không được trống")
    .max(200, "Tên tối đa 200 ký tự"),
  effectiveFrom: z.string().refine((date) => {
    return new Date(date) > new Date();
  }, "Ngày hiệu lực phải là ngày trong tương lai (tối thiểu ngày mai)"),
  legalReference: z.string().max(500).optional(),
  vatRate: z.number()
    .min(0, "VAT phải >= 0%")
    .max(100, "VAT phải <= 100%"),
  zoneName: z.string().min(1, "Tên vùng không được trống"),
  environmentFee: z.number().min(0, "Phí môi trường phải >= 0"),
  maintenanceFee: z.number().min(0, "Phí bảo trì phải >= 0"),
  tiers: z.array(waterTierSchema)
    .min(1, "Phải có ít nhất 1 bậc giá")
    .refine((tiers) => {
      // Validate tính liên tục cho nước
      if (tiers[0].fromM3 !== 0) return false;
      for (let i = 0; i < tiers.length - 1; i++) {
        if (tiers[i].toM3 === null) return false;
        if (tiers[i].toM3! + 1 !== tiers[i + 1].fromM3) return false;
      }
      return tiers[tiers.length - 1].toM3 === null;
    }, "Bậc đầu tiên phải bắt đầu từ 0. Khoảng bậc giá phải liên tục, không có khoảng trống hoặc chồng lấp. Bậc cuối phải để trống giới hạn trên."),
});

export type CreateElectricityPolicyForm = z.infer<typeof createElectricityPolicySchema>;
export type CreateWaterPolicyForm = z.infer<typeof createWaterPolicySchema>;
