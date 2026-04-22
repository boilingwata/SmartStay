import * as z from 'zod';

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .or(z.literal(''))
    .transform((value) => {
      const normalized = value?.trim();
      return normalized ? normalized : undefined;
    });

const optionalDate = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((value) => value || undefined);

export const assetSchema = z
  .object({
    assetName: z.string().trim().min(1, 'Vui lòng nhập tên tài sản'),
    assetCode: optionalText(100),
    type: z.enum(['Furniture', 'Appliance', 'Electronics', 'Fixture', 'Other']),
    condition: z.enum(['New', 'Good', 'Fair', 'Poor']),
    brand: optionalText(255),
    model: optionalText(255),
    serialNumber: optionalText(255),
    purchasePrice: z.coerce.number().min(0, 'Giá trị mua phải lớn hơn hoặc bằng 0'),
    quantity: z.coerce.number().int().min(1, 'Số lượng phải lớn hơn 0'),
    purchaseDate: optionalDate,
    warrantyExpiry: optionalDate,
    description: optionalText(2000),
    isBillable: z.boolean().default(false),
    billingLabel: optionalText(255),
    monthlyCharge: z.coerce.number().min(0, 'Phí hàng tháng phải lớn hơn hoặc bằng 0'),
    billingStartDate: optionalDate,
    billingEndDate: optionalDate,
    billingStatus: z.enum(['Inactive', 'Active', 'Suspended', 'Stopped']).default('Inactive'),
  })
  .superRefine((data, ctx) => {
    if (data.purchaseDate && data.warrantyExpiry && data.warrantyExpiry < data.purchaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warrantyExpiry'],
        message: 'Ngày hết hạn bảo hành phải sau ngày mua',
      });
    }

    if (data.isBillable && data.monthlyCharge <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['monthlyCharge'],
        message: 'Tài sản tính phí cần có mức phí lớn hơn 0',
      });
    }
  });

export type AssetFormData = z.infer<typeof assetSchema>;
