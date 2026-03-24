import * as z from 'zod';

export const contractSchema = z.object({
  // Step 1: Room & Tenants
  buildingId: z.string().min(1, 'Vui lòng chọn tòa nhà'),
  roomId: z.string().min(1, 'Vui lòng chọn phòng'),
  representativeId: z.string().min(1, 'Vui lòng chọn người đại diện'),
  tenants: z.array(z.object({
    id: z.string(),
    name: z.string().min(2, 'Tên cư dân ít nhất 2 ký tự'),
    phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
    cccd: z.string().optional(),
  })).min(1, 'Phải có ít nhất 1 cư dân'),

  // Step 2: Main Info
  type: z.enum(['Residential', 'Commercial', 'Office']),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  rentPrice: z.number().min(1000, 'Giá thuê phải lớn hơn 1000 VND'),
  depositAmount: z.number().min(0),
  paymentCycle: z.number().min(1),
  paymentDueDay: z.number().min(1).max(31),
  autoRenew: z.boolean().default(false),

  // Step 3: Services & Owner
  selectedServices: z.array(z.string()),
  ownerRep: z.object({
    fullName: z.string().min(2, 'Tên người đại diện ít nhất 2 ký tự'),
    cccd: z.string().min(9, 'CCCD không hợp lệ'),
    role: z.string()
  })
});

export type ContractFormData = z.infer<typeof contractSchema>;
