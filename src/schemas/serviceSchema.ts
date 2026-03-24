import { z } from "zod";

// Tạo dịch vụ mới
export const createServiceSchema = z.object({
  serviceName: z.string()
    .min(1, "Tên dịch vụ không được trống")
    .max(200, "Tên tối đa 200 ký tự"),
  serviceCode: z.string()
    .min(1, "Mã dịch vụ không được trống")
    .max(50, "Mã tối đa 50 ký tự")
    .regex(/^SVC-[A-Z0-9]+$/, "Mã phải có định dạng SVC-XXXX"),
  serviceType: z.enum(["Utility", "Management", "Amenity", "Optional"], {
    errorMap: () => ({ message: "Vui lòng chọn loại dịch vụ" })
  }),
  unit: z.string().min(1, "Đơn vị không được trống"),
  billingMethod: z.enum(["Fixed", "PerPerson", "PerM2", "Metered", "Usage"], {
    errorMap: () => ({ message: "Vui lòng chọn phương thức tính phí" })
  }),
  description: z.string().max(2000).optional(),
  isActive: z.boolean(),
  initialPrice: z.number()
    .positive("Giá ban đầu phải > 0"),
  priceEffectiveFrom: z.string().refine(
    (d) => new Date(d) > new Date(),
    "Ngày áp dụng phải là ngày trong tương lai (tối thiểu ngày mai)"
  ),
  priceReason: z.string()
    .min(10, "Lý do tối thiểu 10 ký tự")
    .max(500, "Lý do tối đa 500 ký tự"),
});

// Cập nhật thông tin dịch vụ (không bao gồm giá)
export const updateServiceSchema = z.object({
  serviceName: z.string()
    .min(1, "Tên dịch vụ không được trống")
    .max(200, "Tên tối đa 200 ký tự"),
  serviceType: z.enum(["Utility", "Management", "Amenity", "Optional"]),
  unit: z.string().min(1, "Đơn vị không được trống"),
  billingMethod: z.enum(["Fixed", "PerPerson", "PerM2", "Metered", "Usage"]),
  description: z.string().max(2000).optional(),
  isActive: z.boolean(),
});

// Cập nhật giá mới — RULE-08: INSERT only
export const updatePriceSchema = z.object({
  newPrice: z.number()
    .positive("Giá mới phải > 0"),
  effectiveFrom: z.string().refine(
    (d) => new Date(d) > new Date(),
    "Ngày áp dụng phải là ngày trong tương lai (tối thiểu ngày mai)"
  ),
  reason: z.string()
    .min(10, "Lý do tối thiểu 10 ký tự")
    .max(500, "Lý do tối đa 500 ký tự"),
});

export type CreateServiceForm = z.infer<typeof createServiceSchema>;
export type UpdateServiceForm = z.infer<typeof updateServiceSchema>;
export type UpdatePriceForm = z.infer<typeof updatePriceSchema>;
