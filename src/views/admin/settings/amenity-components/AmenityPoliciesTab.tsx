import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, {
  type AmenityPolicyFormInput,
  type AmenityPolicyRecord,
  type AmenityPolicyStatus,
} from '@/services/amenityAdminService';
import { Select } from '@/components/ui/Select';
import { formatVND } from '@/utils';
import { statusClass, statusLabel } from './utils';

function createPolicyForm(): AmenityPolicyFormInput {
  return {
    code: '', name: '', serviceId: 0, buildingId: null, bookingMode: 'slot_based',
    chargeMode: 'free', status: 'draft', slotGranularityMinutes: 60,
    maxCapacityPerSlot: 1, maxAdvanceDays: 7, cancellationCutoffHours: 2,
    autoCompleteAfterMinutes: 90, allowWaitlist: false, requiresStaffApproval: false,
    requiresCheckin: true, priceOverrideAmount: null, activeFrom: new Date().toISOString().slice(0, 10),
    activeTo: null, notes: null, rulesJson: { openingHours: '06:00-22:00', residentLimitPerDay: 1, gracePeriodMinutes: 15 },
    changeSummary: '',
  };
}

type AmenityRulesFormState = { openingHours: string; residentLimitPerDay: number; gracePeriodMinutes: number; };

function createPolicyRulesForm(): AmenityRulesFormState {
  return { openingHours: '06:00-22:00', residentLimitPerDay: 1, gracePeriodMinutes: 15 };
}

function parsePolicyRulesForm(value: Record<string, unknown> | null | undefined): AmenityRulesFormState {
  return {
    openingHours: typeof value?.openingHours === 'string' && value.openingHours.trim() ? value.openingHours : '06:00-22:00',
    residentLimitPerDay: Number(value?.residentLimitPerDay ?? 1) || 1,
    gracePeriodMinutes: Number(value?.gracePeriodMinutes ?? 15) || 15,
  };
}

function buildPolicyRulesJson(value: AmenityRulesFormState): Record<string, unknown> {
  return {
    openingHours: value.openingHours.trim() || '06:00-22:00',
    residentLimitPerDay: Math.max(1, Number(value.residentLimitPerDay) || 1),
    gracePeriodMinutes: Math.max(0, Number(value.gracePeriodMinutes) || 0),
  };
}

interface Props {
  selectedPolicyId: number | null;
  setSelectedPolicyId: (id: number | null) => void;
  setSelectedPolicy: (policy: AmenityPolicyRecord | null) => void;
}

export default function AmenityPoliciesTab({ selectedPolicyId, setSelectedPolicyId, setSelectedPolicy }: Props) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', status: 'all' as AmenityPolicyStatus | 'all', serviceId: null as number | null, page: 1, limit: 6 });
  const [editingPolicy, setEditingPolicy] = useState<AmenityPolicyRecord | null>(null);
  const [policyForm, setPolicyForm] = useState<AmenityPolicyFormInput>(createPolicyForm);
  const [policyRules, setPolicyRules] = useState<AmenityRulesFormState>(createPolicyRulesForm);

  const optionsQuery = useQuery({ queryKey: ['amenity-options'], queryFn: () => amenityAdminService.getFormOptions() });
  const policiesQuery = useQuery({ queryKey: ['amenity-policies', filters], queryFn: () => amenityAdminService.listPolicies(filters) });

  useEffect(() => {
    if (!selectedPolicyId && policiesQuery.data?.data?.[0]) {
      const first = policiesQuery.data.data[0];
      setSelectedPolicyId(first.id);
      setSelectedPolicy(first);
    }
  }, [policiesQuery.data, selectedPolicyId, setSelectedPolicyId, setSelectedPolicy]);

  const resetPolicyForm = () => {
    const next = createPolicyForm();
    setEditingPolicy(null);
    setPolicyForm(next);
    setPolicyRules(parsePolicyRulesForm(next.rulesJson));
  };

  const savePolicyMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...policyForm, rulesJson: buildPolicyRulesJson(policyRules) };
      if (editingPolicy) {
        return amenityAdminService.updatePolicy(editingPolicy.id, payload);
      }
      return amenityAdminService.createPolicy(payload);
    },
    onSuccess: () => {
      toast.success(editingPolicy ? 'Đã cập nhật chính sách tiện ích.' : 'Đã tạo chính sách tiện ích.');
      resetPolicyForm();
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu chính sách.'),
  });

  const archivePolicyMutation = useMutation({
    mutationFn: (id: number) => amenityAdminService.archivePolicy(id),
    onSuccess: () => {
      toast.success('Đã lưu trữ chính sách tiện ích.');
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-versions'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu trữ chính sách.'),
  });

  const startEdit = (policy: AmenityPolicyRecord) => {
    setEditingPolicy(policy);
    setSelectedPolicyId(policy.id);
    setPolicyForm({
      code: policy.code, name: policy.name, serviceId: policy.serviceId, buildingId: policy.buildingId,
      bookingMode: policy.bookingMode, chargeMode: policy.chargeMode, status: policy.status,
      slotGranularityMinutes: policy.slotGranularityMinutes, maxCapacityPerSlot: policy.maxCapacityPerSlot,
      maxAdvanceDays: policy.maxAdvanceDays, cancellationCutoffHours: policy.cancellationCutoffHours,
      autoCompleteAfterMinutes: policy.autoCompleteAfterMinutes, allowWaitlist: policy.allowWaitlist,
      requiresStaffApproval: policy.requiresStaffApproval, requiresCheckin: policy.requiresCheckin,
      priceOverrideAmount: policy.priceOverrideAmount, activeFrom: policy.activeFrom, activeTo: policy.activeTo,
      notes: policy.notes, rulesJson: policy.rulesJson, changeSummary: 'Điều chỉnh từ trang quản trị',
    });
    setPolicyRules(parsePolicyRulesForm(policy.rulesJson));
  };

  const policyPageCount = Math.max(1, Math.ceil((policiesQuery.data?.total ?? 0) / filters.limit));

  return (
    <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6 rounded-[32px] border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input className="input-base w-full" placeholder="Tìm mã hoặc tên" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
          
          <Select 
            value={filters.status}
            onChange={(val) => setFilters((current) => ({ ...current, status: val as AmenityPolicyStatus | 'all', page: 1 }))}
            options={[
              { label: 'Tất cả trạng thái', value: 'all' },
              { label: 'Nháp', value: 'draft' },
              { label: 'Chờ duyệt', value: 'pending_approval' },
              { label: 'Đã duyệt', value: 'approved' },
              { label: 'Lưu trữ', value: 'archived' }
            ]}
          />

          <Select 
            value={filters.serviceId ? String(filters.serviceId) : ''}
            onChange={(val) => setFilters((current) => ({ ...current, serviceId: val ? Number(val) : null, page: 1 }))}
            options={[
              { label: 'Tất cả tiện ích', value: '' },
              ...(optionsQuery.data?.amenities.map(item => ({ label: item.label, value: String(item.value) })) ?? [])
            ]}
          />
        </div>

        <div className="space-y-4">
          {policiesQuery.data?.data.map((policy) => (
            <article key={policy.id} className={`rounded-[28px] border p-5 transition-shadow hover:shadow-md cursor-pointer ${selectedPolicyId === policy.id ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'}`} onClick={() => { setSelectedPolicyId(policy.id); setSelectedPolicy(policy); }}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusClass(policy.status)}`}>{statusLabel(policy.status)}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{policy.code}</span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{policy.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{policy.amenityName}{policy.buildingName ? ` · ${policy.buildingName}` : ' · Toàn hệ thống'}</p>
                  <p className="text-sm text-muted-foreground">
                    {policy.slotGranularityMinutes} phút/lượt đặt · {policy.maxCapacityPerSlot} lượt mỗi khung · huỷ trước {policy.cancellationCutoffHours} giờ
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(policy); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted"><Pencil size={14} />Sửa</button>
                  <button onClick={(e) => { e.stopPropagation(); archivePolicyMutation.mutate(policy.id); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 text-xs font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"><Trash2 size={14} />Lưu trữ</button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
                <span className="rounded-full bg-muted/50 border border-border px-3 py-1">Nhận chỗ: {policy.requiresCheckin ? 'Bắt buộc' : 'Không'}</span>
                <span className="rounded-full bg-muted/50 border border-border px-3 py-1">Duyệt tay: {policy.requiresStaffApproval ? 'Có' : 'Không'}</span>
                <span className="rounded-full bg-muted/50 border border-border px-3 py-1">Danh sách chờ: {policy.allowWaitlist ? 'Có' : 'Tắt'}</span>
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1">Giá: {policy.chargeMode === 'free' ? 'Miễn phí' : policy.priceOverrideAmount ? formatVND(policy.priceOverrideAmount) : 'Theo quy tắc'}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-bold text-muted-foreground">
          <span>Trang {filters.page}/{policyPageCount}</span>
          <div className="flex gap-2">
            <button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-xl border border-border px-4 py-2 hover:bg-muted disabled:opacity-40">Trước</button>
            <button disabled={filters.page >= policyPageCount} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-xl border border-border px-4 py-2 hover:bg-muted disabled:opacity-40">Sau</button>
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-[32px] border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary"><Plus size={16} />{editingPolicy ? 'Chỉnh sửa chính sách' : 'Tạo chính sách mới'}</div>
        <div className="grid gap-4 md:grid-cols-2">
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
                ...(optionsQuery.data?.amenities.map(item => ({ label: item.label, value: String(item.value) })) ?? [])
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
                ...(optionsQuery.data?.buildings.map(item => ({ label: item.label, value: String(item.value) })) ?? [])
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
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Giá ghi đè (nếu có)</label>
            <input type="number" className="input-base w-full" placeholder="Để trống nếu theo quy tắc gốc" value={policyForm.priceOverrideAmount ?? ''} onChange={(event) => setPolicyForm((current) => ({ ...current, priceOverrideAmount: event.target.value ? Number(event.target.value) : null }))} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Thời lượng mỗi lượt</label>
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
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Quy tắc vận hành</label>
          <div className="rounded-[24px] border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-4">Điền đúng khung giờ, giới hạn và thời gian trễ nhận chỗ.</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground ml-1">Khung giờ mở cửa</label>
                <input className="input-base w-full" placeholder="06:00-22:00" value={policyRules.openingHours} onChange={(event) => setPolicyRules((current) => ({ ...current, openingHours: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground ml-1">Lượt / người / ngày</label>
                <input type="number" min={1} className="input-base w-full" value={policyRules.residentLimitPerDay} onChange={(event) => setPolicyRules((current) => ({ ...current, residentLimitPerDay: Number(event.target.value) || 1 }))} />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground ml-1">Trễ tối đa (phút)</label>
                <input type="number" min={0} className="input-base w-full" value={policyRules.gracePeriodMinutes} onChange={(event) => setPolicyRules((current) => ({ ...current, gracePeriodMinutes: Number(event.target.value) || 0 }))} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button disabled={savePolicyMutation.isPending} onClick={() => savePolicyMutation.mutate()} className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-transform active:scale-[0.98] shadow-lg shadow-primary/20"><Plus size={16} />{editingPolicy ? 'Lưu cập nhật' : 'Tạo chính sách'}</button>
          <button onClick={resetPolicyForm} className="h-14 rounded-2xl border border-border bg-background px-5 font-bold text-foreground hover:bg-muted transition-colors">Làm mới</button>
        </div>
      </div>
    </section>
  );
}
