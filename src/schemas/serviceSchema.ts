import { z } from "zod";

const billingMethodSchema = z.enum(["Fixed", "PerPerson", "PerRoom", "PerUnit", "PerM2", "Usage"], {
  errorMap: () => ({ message: "Vui long chon phuong thuc tinh phi" }),
});

export const createServiceSchema = z.object({
  serviceName: z.string().min(1, "Ten dich vu khong duoc trong").max(200, "Ten toi da 200 ky tu"),
  serviceCode: z
    .string()
    .min(1, "Ma dich vu khong duoc trong")
    .max(50, "Ma toi da 50 ky tu")
    .regex(/^SVC-[A-Z0-9]+$/, "Ma phai co dinh dang SVC-XXXX"),
  serviceType: z.literal("FixedService"),
  unit: z.string().min(1, "Don vi khong duoc trong"),
  billingMethod: billingMethodSchema,
  description: z.string().max(2000).optional(),
  isActive: z.boolean(),
  initialPrice: z.number().positive("Gia ban dau phai > 0"),
  priceEffectiveFrom: z.string().min(1, "Ngay ap dung khong duoc trong"),
  priceReason: z.string().min(10, "Ly do toi thieu 10 ky tu").max(500, "Ly do toi da 500 ky tu"),
});

export const updateServiceSchema = z.object({
  serviceName: z.string().min(1, "Ten dich vu khong duoc trong").max(200, "Ten toi da 200 ky tu"),
  serviceType: z.literal("FixedService"),
  unit: z.string().min(1, "Don vi khong duoc trong"),
  billingMethod: billingMethodSchema,
  description: z.string().max(2000).optional(),
  isActive: z.boolean(),
});

export const updatePriceSchema = z.object({
  newPrice: z.number().positive("Gia moi phai > 0"),
  effectiveFrom: z.string().min(1, "Ngay ap dung khong duoc trong"),
  reason: z.string().min(10, "Ly do toi thieu 10 ky tu").max(500, "Ly do toi da 500 ky tu"),
});

export type CreateServiceForm = z.infer<typeof createServiceSchema>;
export type UpdateServiceForm = z.infer<typeof updateServiceSchema>;
export type UpdatePriceForm = z.infer<typeof updatePriceSchema>;
