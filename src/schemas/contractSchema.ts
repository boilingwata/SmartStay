import * as z from "zod";

export const contractSchema = z
  .object({
    buildingId: z.string().min(1, "Vui lòng chọn tòa nhà"),
    roomId: z.string().min(1, "Vui lòng chọn phòng"),
    primaryTenantId: z.string().min(1, "Vui lòng chọn người đứng tên hợp đồng"),
    occupantIds: z.array(z.string()).default([]),

    type: z.enum(["Residential", "Commercial", "Office"]),
    startDate: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
    endDate: z.string().min(1, "Vui lòng chọn ngày kết thúc"),
    rentPrice: z.number().min(1000, "Giá thuê phải lớn hơn 1.000 đồng"),
    depositAmount: z.number().min(0, "Tiền cọc không được âm"),
    paymentCycle: z.number().min(1),
    paymentDueDay: z.number().min(1).max(31, "Ngày đến hạn phải từ 1 đến 31"),
    autoRenew: z.boolean().default(false),

    selectedServices: z.array(z.string()).default([]),
    utilityPolicyId: z.string().min(1, "Vui lòng chọn chính sách điện nước"),
    ownerRep: z.object({
      fullName: z.string().min(2, "Tên người đại diện phải có ít nhất 2 ký tự"),
      cccd: z.string().min(9, "Số CCCD không hợp lệ"),
      role: z.string(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.startDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    if (data.occupantIds.includes(data.primaryTenantId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["occupantIds"],
        message: "Người ở cùng không được trùng với người đứng tên hợp đồng",
      });
    }
  });

export type ContractFormData = z.infer<typeof contractSchema>;
