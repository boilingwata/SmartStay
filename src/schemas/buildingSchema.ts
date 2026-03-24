import * as z from 'zod';

export const buildingSchema = z.object({
  buildingCode: z.string().min(2, 'Mã toà nhà ít nhất 2 ký tự').max(10),
  buildingName: z.string().min(3, 'Tên toà nhà ít nhất 3 ký tự'),
  type: z.enum(['Apartment', 'Office', 'Mixed', 'Shophouse']),
  address: z.string().min(5, 'Địa chỉ ít nhất 5 ký tự'),
  provinceId: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  districtId: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  wardId: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  yearBuilt: z.number().min(1900).max(new Date().getFullYear()),
  totalFloors: z.number().min(1),
  managementPhone: z.string().optional(),
  managementEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  amenities: z.array(z.string())
});

export type BuildingFormData = z.infer<typeof buildingSchema>;
