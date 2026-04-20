import * as z from 'zod';

export const contractSchema = z
  .object({
    buildingId: z.string().min(1, 'Vui lòng chọn tòa nhà'),
    roomId: z.string().min(1, 'Vui lòng chọn phòng'),
    primaryTenantId: z.string().min(1, 'Vui lòng chọn người đứng tên hợp đồng'),
    occupantIds: z.array(z.string()).default([]),

    type: z.enum(['Residential', 'Commercial', 'Office']),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    rentPrice: z.number().min(1000, 'Giá thuê phải lớn hơn 1.000 đồng'),
    depositAmount: z.number().min(0, 'Tiền cọc không được âm'),
    paymentCycle: z.number().min(1),
    paymentDueDay: z.number().min(1).max(31, 'Ngày đến hạn phải từ 1 đến 31'),
    autoRenew: z.boolean().default(false),

    selectedServices: z.array(z.string()).default([]),
    utilityPolicyId: z.string().min(1, 'Vui lòng chọn chính sách điện nước'),
    ownerRep: z.object({
      fullName: z.string().min(2, 'Tên người đại diện phải có ít nhất 2 ký tự'),
      cccd: z.string().optional().or(z.literal('')),
      role: z.string(),
    }),
    ownerLegalConfirmation: z.object({
      legalBasisType: z.enum(['Owner', 'AuthorizedRepresentative', 'BusinessEntity'], {
        required_error: 'Vui lòng chọn căn cứ pháp lý của bên cho thuê',
      }),
      legalBasisNote: z.string().max(500, 'Ghi chú pháp lý tối đa 500 ký tự').optional().or(z.literal('')),
      supportingDocumentUrls: z.array(z.string().url()).default([]),
      hasLegalRentalRightsConfirmed: z.boolean(),
      propertyEligibilityConfirmed: z.boolean(),
      landlordResponsibilitiesAccepted: z.boolean(),
      finalAcknowledgementAccepted: z.boolean(),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.endDate && data.startDate && data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
      });
    }

    if (data.occupantIds.includes(data.primaryTenantId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['occupantIds'],
        message: 'Người ở cùng không được trùng với người đứng tên hợp đồng',
      });
    }

    if (!data.ownerLegalConfirmation.hasLegalRentalRightsConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerLegalConfirmation', 'hasLegalRentalRightsConfirmed'],
        message: 'Cần xác nhận bên cho thuê có quyền cho thuê hợp pháp',
      });
    }

    if (!data.ownerLegalConfirmation.propertyEligibilityConfirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerLegalConfirmation', 'propertyEligibilityConfirmed'],
        message: 'Cần xác nhận nhà/phòng đủ điều kiện cho thuê và không có tranh chấp',
      });
    }

    if (!data.ownerLegalConfirmation.landlordResponsibilitiesAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerLegalConfirmation', 'landlordResponsibilitiesAccepted'],
        message: 'Cần xác nhận trách nhiệm và nghĩa vụ của bên cho thuê',
      });
    }

    if (!data.ownerLegalConfirmation.finalAcknowledgementAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerLegalConfirmation', 'finalAcknowledgementAccepted'],
        message: 'Cần tick cam kết đồng ý trước khi tạo hợp đồng',
      });
    }

    if (
      data.ownerLegalConfirmation.legalBasisType === 'AuthorizedRepresentative' &&
      data.ownerLegalConfirmation.supportingDocumentUrls.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerLegalConfirmation', 'supportingDocumentUrls'],
        message: 'Người được ủy quyền cần đính kèm ít nhất 1 hồ sơ pháp lý',
      });
    }
  });

export type ContractFormData = z.infer<typeof contractSchema>;
