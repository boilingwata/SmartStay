import * as z from 'zod';

export const buildingSchema = z.object({
  buildingCode: z.string().optional(),
  name: z.string().min(3, 'Tên toà nhà ít nhất 3 ký tự'),
  type: z.enum(['Apartment', 'Office', 'Mixed', 'Shophouse']).optional(),
  address: z.string().min(5, 'Địa chỉ ít nhất 5 ký tự'),
  provinceId: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành'),
  districtId: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  wardId: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  openingDate: z.string().optional().or(z.literal('')),
  totalFloors: z.number().min(1),
  description: z.string().optional(),
  managementPhone: z.string().optional(),
  managementEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  amenities: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  electricityProvider: z.string().optional(),
  waterProvider: z.string().optional(),
});

export type BuildingFormData = z.infer<typeof buildingSchema>;

