import React from 'react';
import { AlertCircle, FileText, Loader2, ShieldCheck, Upload, X } from 'lucide-react';
import { cn, formatVND } from '@/utils';
import {
  DAN_SACH_CAN_CU_PHAP_LY,
  formatContractDate,
  getPaymentCycleLabel,
  TEN_LOAI_HOP_DONG_HIEN_THI,
  type Room,
  type Service,
  type TenantSummary,
  type UtilityPolicy,
} from '../contractWizardShared';
import { useContractWizard } from '../useContractWizard';

interface ReviewStepProps {
  rooms: Room[];
  tenants: TenantSummary[];
  services: Service[];
  utilityPolicies: UtilityPolicy[];
  onUploadDocument: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument: (url: string) => void;
  isUploading: boolean;
}

export function ReviewStep({ rooms, tenants, utilityPolicies, onUploadDocument, onDeleteDocument, isUploading }: ReviewStepProps) {
  const { form } = useContractWizard();
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const values = watch();
  const selectedRoom = rooms.find((room) => room.id === values.roomId);
  const primaryTenant = tenants.find((tenant) => tenant.id === values.primaryTenantId);
  const selectedUtilityPolicy = utilityPolicies.find((policy) => String(policy.id) === values.utilityPolicyId);
  const supportingDocuments = values.ownerLegalConfirmation?.supportingDocumentUrls || [];

  const cards = [
    {
      title: 'Cư trú',
      items: [
        ['Người đứng tên', primaryTenant?.fullName || 'Chưa chọn'],
        ['Người ở cùng', `${values.occupantIds?.length || 0} người`],
      ],
    },
    {
      title: 'Phòng và loại hợp đồng',
      items: [
        ['Phòng', selectedRoom?.roomCode || 'Chưa chọn'],
        ['Tòa nhà', selectedRoom?.buildingName || 'Chưa chọn'],
        ['Loại hợp đồng', TEN_LOAI_HOP_DONG_HIEN_THI[values.type as keyof typeof TEN_LOAI_HOP_DONG_HIEN_THI]],
      ],
    },
    {
      title: 'Thời hạn',
      items: [
        ['Bắt đầu', formatContractDate(values.startDate)],
        ['Kết thúc', formatContractDate(values.endDate)],
        ['Chu kỳ thanh toán', getPaymentCycleLabel(values.paymentCycle) || 'Chưa chọn'],
      ],
    },
    {
      title: 'Tài chính',
      items: [
        ['Tiền thuê', formatVND(values.rentPrice)],
        ['Tiền cọc', formatVND(values.depositAmount)],
        ['Chính sách điện nước', selectedUtilityPolicy?.name || 'Chưa chọn'],
      ],
    },
  ];

  const confirmations = [
    { id: 'hasLegalRentalRightsConfirmed', label: 'Xác nhận bên cho thuê có đủ quyền hợp pháp để ký và cho thuê.' },
    { id: 'propertyEligibilityConfirmed', label: 'Xác nhận nhà/phòng đủ điều kiện cho thuê và không vướng tranh chấp.' },
    { id: 'landlordResponsibilitiesAccepted', label: 'Xác nhận đã hiểu và chấp nhận các trách nhiệm của bên cho thuê.' },
    { id: 'finalAcknowledgementAccepted', label: 'Xác nhận đã rà soát dữ liệu lần cuối và đồng ý tạo hợp đồng.' },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">8. Rà soát trước khi tạo hợp đồng</h2>
            <p className="text-sm text-slate-500">Đây là điểm dừng cuối để kiểm tra nhanh những gì sẽ được lưu vào hồ sơ thật.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div key={card.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{card.title}</p>
              <div className="mt-3 space-y-3">
                {card.items.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-right font-semibold text-slate-950">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-700" />
          <div>
            <h2 className="text-base font-bold text-slate-950">9. Xác nhận pháp lý</h2>
            <p className="text-sm text-slate-600">Các xác nhận dưới đây là bắt buộc trước khi lưu hợp đồng vào hệ thống.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Căn cứ pháp lý</label>
              <select
                {...register('ownerLegalConfirmation.legalBasisType')}
                className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm outline-none transition focus:border-amber-300"
              >
                {DAN_SACH_CAN_CU_PHAP_LY.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ghi chú bổ sung</label>
              <textarea
                {...register('ownerLegalConfirmation.legalBasisNote')}
                rows={4}
                placeholder="Ví dụ: Được ủy quyền bởi... theo văn bản số..."
                className="w-full rounded-[24px] border border-amber-200 bg-white p-4 text-sm outline-none transition focus:border-amber-300"
              />
              {errors.ownerLegalConfirmation?.legalBasisNote ? <p className="text-xs font-medium text-rose-600">{errors.ownerLegalConfirmation.legalBasisNote.message}</p> : null}
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Tài liệu đính kèm</p>
                  <p className="text-xs text-slate-500">Tải lên giấy tờ nếu cần lưu cùng hồ sơ hợp đồng.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                  <input type="file" multiple className="hidden" onChange={onUploadDocument} disabled={isUploading} />
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Tải lên
                </label>
              </div>

              <div className="mt-4 space-y-2">
                {supportingDocuments.length ? (
                  supportingDocuments.map((url, index) => (
                    <div key={url} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                      <a href={url} target="_blank" rel="noreferrer" className="truncate font-medium text-slate-700 hover:text-slate-950">
                        Tài liệu #{index + 1}
                      </a>
                      <button type="button" onClick={() => onDeleteDocument(url)} className="rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">Chưa có tài liệu được tải lên.</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {confirmations.map((item) => {
              const fieldName = `ownerLegalConfirmation.${item.id}` as
                | 'ownerLegalConfirmation.hasLegalRentalRightsConfirmed'
                | 'ownerLegalConfirmation.propertyEligibilityConfirmed'
                | 'ownerLegalConfirmation.landlordResponsibilitiesAccepted'
                | 'ownerLegalConfirmation.finalAcknowledgementAccepted';
              const isChecked = watch(fieldName);
              const error = (errors.ownerLegalConfirmation as Record<string, { message?: string }> | undefined)?.[item.id]?.message;

              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 rounded-[24px] border p-4 transition',
                    isChecked ? 'border-emerald-300 bg-white shadow-sm' : 'border-amber-200 bg-white/60'
                  )}
                >
                  <input type="checkbox" {...register(fieldName)} className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-300" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6 text-slate-800">{item.label}</p>
                    {error ? (
                      <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                        <AlertCircle size={12} />
                        Bắt buộc xác nhận
                      </p>
                    ) : null}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
