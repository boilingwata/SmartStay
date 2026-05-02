import React from 'react';
import { Select } from '@/components/ui/Select';
import { type AmenityPolicyFormInput, type AmenityPolicyStatus } from '@/services/amenityAdminService';

interface Props {
  policyForm: AmenityPolicyFormInput;
  setPolicyForm: React.Dispatch<React.SetStateAction<AmenityPolicyFormInput>>;
  policyRules: { openingHours: string; residentLimitPerDay: number; gracePeriodMinutes: number };
  setPolicyRules: React.Dispatch<React.SetStateAction<{ openingHours: string; residentLimitPerDay: number; gracePeriodMinutes: number }>>;
  optionsQuery: any;
}

export default function AmenityPolicyFormFields({ policyForm, setPolicyForm, policyRules, setPolicyRules, optionsQuery }: Props) {
  return (
    <div className="space-y-6">
      {/* Thông tin chung */}
      <section className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
        <h4 className="text-sm font-bold text-foreground">Thông tin chung</h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Mã chính sách</label>
            <input className="input-base w-full" placeholder="Ví dụ: GYM-R1" value={policyForm.code} onChange={(event) => setPolicyForm((current) => ({ ...current, code: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tên chính sách</label>
            <input className="input-base w-full" placeholder="Ví dụ: Phòng tập tòa A" value={policyForm.name} onChange={(event) => setPolicyForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <Select 
              label="Chọn tiện ích (*)"
              value={policyForm.serviceId ? String(policyForm.serviceId) : ''}
              onChange={(val) => setPolicyForm((current) => ({ ...current, serviceId: Number(val) }))}
              options={[
                { label: 'Chọn tiện ích', value: '' },
                ...(optionsQuery.data?.amenities.map((item: any) => ({ label: item.label, value: String(item.value) })) ?? [])
              ]}
            />
          </div>
          <div className="space-y-1">
            <Select 
              label="Áp dụng theo tòa nhà"
              value={policyForm.buildingId ? String(policyForm.buildingId) : ''}
              onChange={(val) => setPolicyForm((current) => ({ ...current, buildingId: val ? Number(val) : null }))}
              options={[
                { label: 'Toàn hệ thống', value: '' },
                ...(optionsQuery.data?.buildings.map((item: any) => ({ label: item.label, value: String(item.value) })) ?? [])
              ]}
            />
          </div>
          <div className="space-y-1">
            <Select 
              label="Trạng thái duyệt"
              value={policyForm.status}
              onChange={(val) => setPolicyForm((current) => ({ ...current, status: val as AmenityPolicyStatus }))}
              options={[
                { label: 'Nháp', value: 'draft' },
                { label: 'Chờ duyệt', value: 'pending_approval' },
                { label: 'Duyệt ngay', value: 'approved' }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Thông tin Giá */}
      <section className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
        <h4 className="text-sm font-bold text-foreground">Cấu hình giá</h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <Select 
              label="Hình thức thu phí"
              value={policyForm.chargeMode}
              onChange={(val) => setPolicyForm((current) => ({ ...current, chargeMode: val as any }))}
              options={[
                { label: 'Miễn phí', value: 'free' },
                { label: 'Thu phí theo lượt', value: 'per_slot' },
                { label: 'Thu phí theo giờ', value: 'per_hour' }
              ]}
            />
          </div>
          {policyForm.chargeMode !== 'free' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Giá ghi đè (VNĐ)</label>
              <input type="number" className="input-base w-full" placeholder="Để trống nếu theo quy tắc gốc" value={policyForm.priceOverrideAmount ?? ''} onChange={(event) => setPolicyForm((current) => ({ ...current, priceOverrideAmount: event.target.value ? Number(event.target.value) : null }))} />
            </div>
          )}
        </div>
      </section>

      {/* Sức chứa và Đặt chỗ */}
      <section className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
        <h4 className="text-sm font-bold text-foreground">Sức chứa & Thời gian</h4>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Thời lượng/lượt (Phút)</label>
            <input type="number" className="input-base w-full" placeholder="60" value={policyForm.slotGranularityMinutes} onChange={(event) => setPolicyForm((current) => ({ ...current, slotGranularityMinutes: Number(event.target.value) }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Sức chứa mỗi khung</label>
            <input type="number" className="input-base w-full" placeholder="10" value={policyForm.maxCapacityPerSlot} onChange={(event) => setPolicyForm((current) => ({ ...current, maxCapacityPerSlot: Number(event.target.value) }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Hạn đặt trước (Ngày)</label>
            <input type="number" className="input-base w-full" placeholder="7" value={policyForm.maxAdvanceDays} onChange={(event) => setPolicyForm((current) => ({ ...current, maxAdvanceDays: Number(event.target.value) }))} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Hạn huỷ trước (Giờ)</label>
            <input type="number" className="input-base w-full" placeholder="2" value={policyForm.cancellationCutoffHours} onChange={(event) => setPolicyForm((current) => ({ ...current, cancellationCutoffHours: Number(event.target.value) }))} />
          </div>
        </div>
      </section>

      {/* Quy tắc vận hành */}
      <section className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
        <h4 className="text-sm font-bold text-foreground">Quy tắc vận hành</h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground ml-1">Khung giờ mở cửa</label>
            <input className="input-base w-full" placeholder="06:00-22:00" value={policyRules.openingHours} onChange={(event) => setPolicyRules((current) => ({ ...current, openingHours: event.target.value }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground ml-1">Lượt/người/ngày</label>
              <input type="number" min={1} className="input-base w-full" value={policyRules.residentLimitPerDay} onChange={(event) => setPolicyRules((current) => ({ ...current, residentLimitPerDay: Number(event.target.value) || 1 }))} />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground ml-1">Trễ tối đa (Phút)</label>
              <input type="number" min={0} className="input-base w-full" value={policyRules.gracePeriodMinutes} onChange={(event) => setPolicyRules((current) => ({ ...current, gracePeriodMinutes: Number(event.target.value) || 0 }))} />
            </div>
          </div>
        </div>
      </section>

      {/* Tuỳ chọn nâng cao */}
      <section className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
        <h4 className="text-sm font-bold text-foreground">Tuỳ chọn nâng cao</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={policyForm.requiresCheckin} onChange={(e) => setPolicyForm((c) => ({ ...c, requiresCheckin: e.target.checked }))} className="rounded border-input text-primary focus:ring-primary h-4 w-4" />
            Yêu cầu Check-in
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={policyForm.requiresStaffApproval} onChange={(e) => setPolicyForm((c) => ({ ...c, requiresStaffApproval: e.target.checked }))} className="rounded border-input text-primary focus:ring-primary h-4 w-4" />
            Nhân viên duyệt (Staff Approval)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input type="checkbox" checked={policyForm.allowWaitlist} onChange={(e) => setPolicyForm((c) => ({ ...c, allowWaitlist: e.target.checked }))} className="rounded border-input text-primary focus:ring-primary h-4 w-4" />
            Cho phép danh sách chờ (Waitlist)
          </label>
        </div>
      </section>
    </div>
  );
}
