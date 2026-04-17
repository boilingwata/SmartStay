import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CalendarClock, ClipboardList, Filter, History, Pencil, Plus, ShieldCheck, Trash2, Waves } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, {
  type AmenityExceptionFormInput,
  type AmenityPolicyFormInput,
  type AmenityPolicyRecord,
} from '@/services/amenityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';

function createPolicyForm(): AmenityPolicyFormInput {
  return {
    code: '',
    name: '',
    serviceId: 0,
    buildingId: null,
    bookingMode: 'slot_based',
    chargeMode: 'free',
    status: 'draft',
    slotGranularityMinutes: 60,
    maxCapacityPerSlot: 1,
    maxAdvanceDays: 7,
    cancellationCutoffHours: 2,
    autoCompleteAfterMinutes: 90,
    allowWaitlist: false,
    requiresStaffApproval: false,
    requiresCheckin: true,
    priceOverrideAmount: null,
    activeFrom: new Date().toISOString().slice(0, 10),
    activeTo: null,
    notes: null,
    rulesJson: { openingHours: '06:00-22:00', residentLimitPerDay: 1, gracePeriodMinutes: 15 },
    changeSummary: '',
  };
}

function createExceptionForm(): AmenityExceptionFormInput {
  return {
    policyId: null,
    serviceId: 0,
    buildingId: null,
    title: '',
    exceptionType: 'closure',
    startAt: '',
    endAt: '',
    reason: null,
    overrideJson: { reasonCode: 'maintenance' },
  };
}

function statusLabel(value: string) {
  switch (value) {
    case 'approved':
      return 'Đã duyệt';
    case 'pending_approval':
      return 'Chờ duyệt';
    case 'archived':
      return 'Lưu trữ';
    case 'rejected':
      return 'Từ chối';
    default:
      return 'Nháp';
  }
}

function statusClass(value: string) {
  switch (value) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending_approval':
      return 'bg-amber-100 text-amber-700';
    case 'archived':
      return 'bg-slate-200 text-slate-600';
    case 'rejected':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-sky-100 text-sky-700';
  }
}

export default function AmenityManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'policies' | 'exceptions' | 'versions'>('policies');
  const [filters, setFilters] = useState({ search: '', status: 'all' as const, serviceId: null as number | null, page: 1, limit: 6 });
  const [exceptionFilters, setExceptionFilters] = useState({ search: '', exceptionType: 'all' as const, page: 1, limit: 4 });
  const [editingPolicy, setEditingPolicy] = useState<AmenityPolicyRecord | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [policyForm, setPolicyForm] = useState<AmenityPolicyFormInput>(createPolicyForm);
  const [policyRulesText, setPolicyRulesText] = useState(JSON.stringify(createPolicyForm().rulesJson, null, 2));
  const [exceptionForm, setExceptionForm] = useState<AmenityExceptionFormInput>(createExceptionForm);
  const [exceptionOverrideText, setExceptionOverrideText] = useState(JSON.stringify(createExceptionForm().overrideJson, null, 2));
  const [notificationTitle, setNotificationTitle] = useState('Cập nhật chính sách tiện ích');
  const [notificationMessage, setNotificationMessage] = useState('Ban quản lý vừa cập nhật quy định sử dụng tiện ích. Vui lòng xem lại điều kiện đặt chỗ trước khi sử dụng.');

  const optionsQuery = useQuery({ queryKey: ['amenity-options'], queryFn: () => amenityAdminService.getFormOptions() });
  const dashboardQuery = useQuery({ queryKey: ['amenity-dashboard'], queryFn: () => amenityAdminService.getDashboard() });
  const policiesQuery = useQuery({ queryKey: ['amenity-policies', filters], queryFn: () => amenityAdminService.listPolicies(filters) });
  const exceptionsQuery = useQuery({ queryKey: ['amenity-exceptions', exceptionFilters], queryFn: () => amenityAdminService.listExceptions(exceptionFilters) });
  const versionsQuery = useQuery({
    queryKey: ['amenity-policy-versions', selectedPolicyId],
    queryFn: () => amenityAdminService.listPolicyVersions(selectedPolicyId as number),
    enabled: Boolean(selectedPolicyId),
  });
  const notificationsQuery = useQuery({ queryKey: ['amenity-policy-notifications'], queryFn: () => amenityAdminService.listNotifications(6) });

  useEffect(() => {
    if (!selectedPolicyId && policiesQuery.data?.data?.[0]?.id) {
      setSelectedPolicyId(policiesQuery.data.data[0].id);
    }
  }, [policiesQuery.data, selectedPolicyId]);

  const resetPolicyForm = () => {
    const next = createPolicyForm();
    setEditingPolicy(null);
    setPolicyForm(next);
    setPolicyRulesText(JSON.stringify(next.rulesJson, null, 2));
  };

  const savePolicyMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...policyForm, rulesJson: JSON.parse(policyRulesText || '{}') as Record<string, unknown> };
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
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể lưu chính sách tiện ích.'),
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

  const reviewVersionMutation = useMutation({
    mutationFn: (versionId: number) => amenityAdminService.reviewVersion(versionId, 'approved', 'Duyệt từ owner portal'),
    onSuccess: () => {
      toast.success('Đã duyệt phiên bản chính sách.');
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-versions'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
  });

  const createExceptionMutation = useMutation({
    mutationFn: () =>
      amenityAdminService.createException({
        ...exceptionForm,
        overrideJson: JSON.parse(exceptionOverrideText || '{}') as Record<string, unknown>,
      }),
    onSuccess: () => {
      toast.success('Đã tạo ngoại lệ tiện ích.');
      setExceptionForm(createExceptionForm());
      setExceptionOverrideText(JSON.stringify(createExceptionForm().overrideJson, null, 2));
      queryClient.invalidateQueries({ queryKey: ['amenity-exceptions'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
  });

  const queueNotificationMutation = useMutation({
    mutationFn: () =>
      amenityAdminService.queuePolicyNotification({
        policyId: selectedPolicyId as number,
        versionId: versionsQuery.data?.[0]?.id ?? null,
        title: notificationTitle,
        message: notificationMessage,
        channel: 'in_app',
        audienceScope: 'active_residents',
      }),
    onSuccess: () => {
      toast.success('Đã đưa thông báo vào hàng đợi.');
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể tạo thông báo.'),
  });

  const policyPageCount = Math.max(1, Math.ceil((policiesQuery.data?.total ?? 0) / filters.limit));
  const exceptionPageCount = Math.max(1, Math.ceil((exceptionsQuery.data?.total ?? 0) / exceptionFilters.limit));

  const selectedPolicy = useMemo(
    () => policiesQuery.data?.data.find((item) => item.id === selectedPolicyId) ?? null,
    [policiesQuery.data, selectedPolicyId]
  );

  const startEdit = (policy: AmenityPolicyRecord) => {
    setEditingPolicy(policy);
    setSelectedPolicyId(policy.id);
    setPolicyForm({
      code: policy.code,
      name: policy.name,
      serviceId: policy.serviceId,
      buildingId: policy.buildingId,
      bookingMode: policy.bookingMode,
      chargeMode: policy.chargeMode,
      status: policy.status,
      slotGranularityMinutes: policy.slotGranularityMinutes,
      maxCapacityPerSlot: policy.maxCapacityPerSlot,
      maxAdvanceDays: policy.maxAdvanceDays,
      cancellationCutoffHours: policy.cancellationCutoffHours,
      autoCompleteAfterMinutes: policy.autoCompleteAfterMinutes,
      allowWaitlist: policy.allowWaitlist,
      requiresStaffApproval: policy.requiresStaffApproval,
      requiresCheckin: policy.requiresCheckin,
      priceOverrideAmount: policy.priceOverrideAmount,
      activeFrom: policy.activeFrom,
      activeTo: policy.activeTo,
      notes: policy.notes,
      rulesJson: policy.rulesJson,
      changeSummary: 'Điều chỉnh từ owner portal',
    });
    setPolicyRulesText(JSON.stringify(policy.rulesJson, null, 2));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 pb-20">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-600">
            <Waves size={14} />
            Amenity governance
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Quản Trị Tiện Ích</h1>
          <p className="max-w-4xl text-sm font-medium text-slate-500">
            Dành cho gym, hồ bơi, BBQ, sân thể thao và các tiện ích cần đặt chỗ. Phần này tách hẳn khỏi điện nước.
          </p>
        </div>
        <div className="rounded-3xl border border-cyan-100 bg-cyan-50 px-5 py-4 text-xs font-bold text-cyan-700">
          `ngày chốt công tơ`, `ngày xuất hóa đơn`, `deposit_per_person` phải để ở `System Settings / Billing`.
        </div>
      </div>

      {policiesQuery.isError ? (
        <ErrorBanner
          message="Không tải được dữ liệu tiện ích. Kiểm tra lại migration amenity_* hoặc quyền truy cập Supabase."
          onRetry={() => {
            void policiesQuery.refetch();
            void exceptionsQuery.refetch();
          }}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Chính sách', value: dashboardQuery.data?.totalPolicies ?? 0, icon: ClipboardList },
          { label: 'Chờ duyệt', value: dashboardQuery.data?.pendingApprovals ?? 0, icon: ShieldCheck },
          { label: 'Ngoại lệ đang mở', value: dashboardQuery.data?.activeExceptions ?? 0, icon: Filter },
          { label: 'Đặt chỗ hôm nay', value: dashboardQuery.data?.todayBookings ?? 0, icon: CalendarClock },
        ].map((item) => (
          <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 inline-flex rounded-2xl bg-slate-900 p-3 text-white">
              <item.icon size={18} />
            </div>
            <p className="text-3xl font-black text-slate-900">{item.value}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-6 border-b border-slate-200">
        <button onClick={() => setActiveTab('policies')} className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'policies' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-slate-500 hover:text-slate-800'}`}>Chính Sách & Nội Quy</button>
        <button onClick={() => setActiveTab('exceptions')} className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'exceptions' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-slate-500 hover:text-slate-800'}`}>Ghi Đè Ngoại Lệ</button>
        <button onClick={() => setActiveTab('versions')} className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'versions' ? 'border-b-2 border-cyan-600 text-cyan-700' : 'text-slate-500 hover:text-slate-800'}`}>Lịch Sử & Thông Báo</button>
      </div>

      {activeTab === 'policies' && (
        <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <input className="input-base w-full" placeholder="Tìm mã hoặc tên" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
              <select className="input-base w-full" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as typeof current.status, page: 1 }))}>
                <option value="all">Tất cả trạng thái</option>
                <option value="draft">Nháp</option>
                <option value="pending_approval">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="archived">Lưu trữ</option>
              </select>
              <select className="input-base w-full" value={filters.serviceId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, serviceId: event.target.value ? Number(event.target.value) : null, page: 1 }))}>
                <option value="">Tất cả tiện ích</option>
                {optionsQuery.data?.amenities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              {policiesQuery.data?.data.map((policy) => (
                <article key={policy.id} className={`rounded-[28px] border p-5 transition-shadow hover:shadow-md ${selectedPolicyId === policy.id ? 'border-cyan-300 bg-cyan-50/50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <button className="space-y-2 text-left" onClick={() => setSelectedPolicyId(policy.id)}>
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusClass(policy.status)}`}>{statusLabel(policy.status)}</span>
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{policy.code}</span>
                      </div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">{policy.name}</h3>
                      <p className="text-sm font-medium text-slate-600">{policy.amenityName}{policy.buildingName ? ` · ${policy.buildingName}` : ' · Toàn hệ thống'}</p>
                      <p className="text-sm text-slate-500">
                        {policy.slotGranularityMinutes} phút/slot · {policy.maxCapacityPerSlot} lượt/slot · huỷ trước {policy.cancellationCutoffHours} giờ
                      </p>
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(policy)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"><Pencil size={16} />Sửa</button>
                      <button onClick={() => archivePolicyMutation.mutate(policy.id)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"><Trash2 size={16} />Lưu</button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Check-in: {policy.requiresCheckin ? 'Bắt buộc' : 'Không bắt buộc'}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Duyệt tay: {policy.requiresStaffApproval ? 'Có' : 'Không'}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Waitlist: {policy.allowWaitlist ? 'Có' : 'Tắt'}</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1">Giá: {policy.chargeMode === 'free' ? 'Miễn phí' : policy.priceOverrideAmount ? formatVND(policy.priceOverrideAmount) : 'Theo rule'}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-500">
              <span>Trang {filters.page}/{policyPageCount}</span>
              <div className="flex gap-2">
                <button disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-2xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-40">Trước</button>
                <button disabled={filters.page >= policyPageCount} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-2xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-40">Sau</button>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400"><Plus size={16} />{editingPolicy ? 'Chỉnh sửa policy' : 'Tạo policy mới'}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mã chính sách</label>
                <input className="input-base w-full" placeholder="VD: GYM-R1" value={policyForm.code} onChange={(event) => setPolicyForm((current) => ({ ...current, code: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tên chính sách</label>
                <input className="input-base w-full" placeholder="VD: Gym Tòa A" value={policyForm.name} onChange={(event) => setPolicyForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Chọn tiện ích (*)</label>
                <select className="input-base w-full" value={policyForm.serviceId || ''} onChange={(event) => setPolicyForm((current) => ({ ...current, serviceId: Number(event.target.value) }))}>
                  <option value="">Chọn tiện ích</option>
                  {optionsQuery.data?.amenities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Áp dụng Tòa/Facility</label>
                <select className="input-base w-full" value={policyForm.buildingId ?? ''} onChange={(event) => setPolicyForm((current) => ({ ...current, buildingId: event.target.value ? Number(event.target.value) : null }))}>
                  <option value="">Toàn hệ thống</option>
                  {optionsQuery.data?.buildings.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Trạng thái duyệt</label>
                <select className="input-base w-full" value={policyForm.status} onChange={(event) => setPolicyForm((current) => ({ ...current, status: event.target.value as typeof current.status }))}>
                  <option value="draft">Nháp</option>
                  <option value="pending_approval">Chờ duyệt</option>
                  <option value="approved">Duyệt ngay</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Giá đè (nếu có)</label>
                <input type="number" className="input-base w-full" placeholder="Để trống nếu theo rule gốc" value={policyForm.priceOverrideAmount ?? ''} onChange={(event) => setPolicyForm((current) => ({ ...current, priceOverrideAmount: event.target.value ? Number(event.target.value) : null }))} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Thời lượng (Phút/Slot)</label>
                <input type="number" className="input-base w-full" placeholder="60" value={policyForm.slotGranularityMinutes} onChange={(event) => setPolicyForm((current) => ({ ...current, slotGranularityMinutes: Number(event.target.value) }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Sức chứa/Slot</label>
                <input type="number" className="input-base w-full" placeholder="10" value={policyForm.maxCapacityPerSlot} onChange={(event) => setPolicyForm((current) => ({ ...current, maxCapacityPerSlot: Number(event.target.value) }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Hạn đặt trước (Ngày)</label>
                <input type="number" className="input-base w-full" placeholder="7" value={policyForm.maxAdvanceDays} onChange={(event) => setPolicyForm((current) => ({ ...current, maxAdvanceDays: Number(event.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Luật nâng cao (JSON)</label>
              <textarea className="input-base min-h-[130px] w-full font-mono text-sm leading-relaxed" value={policyRulesText} onChange={(event) => setPolicyRulesText(event.target.value)} />
            </div>
            <div className="flex gap-3">
              <button disabled={savePolicyMutation.isPending} onClick={() => savePolicyMutation.mutate()} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 font-black text-white hover:bg-cyan-700 disabled:opacity-70"><Plus size={16} />{editingPolicy ? 'Lưu cập nhật' : 'Tạo policy'}</button>
              <button onClick={resetPolicyForm} className="h-12 rounded-2xl border border-slate-200 px-5 font-black text-slate-600 hover:bg-slate-50">Làm mới</button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'exceptions' && (
        <section className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input-base w-full" placeholder="Tìm ngoại lệ" value={exceptionFilters.search} onChange={(event) => setExceptionFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} />
              <select className="input-base w-full" value={exceptionFilters.exceptionType} onChange={(event) => setExceptionFilters((current) => ({ ...current, exceptionType: event.target.value as typeof current.exceptionType, page: 1 }))}>
                <option value="all">Tất cả ngoại lệ</option>
                <option value="closure">Đóng tiện ích</option>
                <option value="blackout">Khóa khung giờ</option>
                <option value="capacity_override">Sửa sức chứa</option>
                <option value="price_override">Sửa giá</option>
                <option value="rule_override">Sửa quy tắc</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            {exceptionsQuery.data?.data.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50/50 p-5 hover:border-rose-200 hover:bg-rose-50/30 transition-colors">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">{item.exceptionType}</p>
                <h3 className="mt-2 text-lg font-black text-slate-900">{item.title}</h3>
                <p className="text-sm font-medium text-slate-600">{item.amenityName}{item.buildingName ? ` · ${item.buildingName}` : ''}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <CalendarClock size={14} />
                  <span>{formatDate(item.startAt)} → {formatDate(item.endAt)}</span>
                </div>
              </div>
            ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-500">
              <span>Trang {exceptionFilters.page}/{exceptionPageCount}</span>
              <div className="flex gap-2">
                <button disabled={exceptionFilters.page <= 1} onClick={() => setExceptionFilters((current) => ({ ...current, page: current.page - 1 }))} className="rounded-2xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-40">Trước</button>
                <button disabled={exceptionFilters.page >= exceptionPageCount} onClick={() => setExceptionFilters((current) => ({ ...current, page: current.page + 1 }))} className="rounded-2xl border border-slate-200 px-4 py-2 hover:bg-slate-50 disabled:opacity-40">Sau</button>
              </div>
            </div>
          </div>

          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-rose-500"><Plus size={16} />Thêm Ghi Đè Ngoại Lệ</div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Tiện ích áp dụng</label>
              <select className="input-base w-full" value={exceptionForm.serviceId || ''} onChange={(event) => setExceptionForm((current) => ({ ...current, serviceId: Number(event.target.value) }))}>
                <option value="">Chọn tiện ích</option>
                {optionsQuery.data?.amenities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Tiêu đề ghi đè</label>
              <input className="input-base w-full" placeholder="VD: Đóng cửa bảo trì hồ bơi..." value={exceptionForm.title} onChange={(event) => setExceptionForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Bắt đầu từ</label>
                <input type="datetime-local" className="input-base w-full" value={exceptionForm.startAt} onChange={(event) => setExceptionForm((current) => ({ ...current, startAt: event.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Kết thúc</label>
                <input type="datetime-local" className="input-base w-full" value={exceptionForm.endAt} onChange={(event) => setExceptionForm((current) => ({ ...current, endAt: event.target.value }))} />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Cấu hình ghi đè (JSON)</label>
              <textarea className="input-base min-h-[110px] w-full font-mono text-sm leading-relaxed" value={exceptionOverrideText} onChange={(event) => setExceptionOverrideText(event.target.value)} />
            </div>
            
            <button disabled={createExceptionMutation.isPending} onClick={() => createExceptionMutation.mutate()} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 font-black text-white hover:bg-rose-700 disabled:opacity-70"><Plus size={16} />Xác nhận ngoại lệ</button>
          </div>
        </section>
      )}

      {activeTab === 'versions' && (
        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400"><History size={16} />Lịch Sử & Xét Duyệt (Versions)</div>
            
            {selectedPolicy ? (
              <div className="rounded-[24px] border border-cyan-100 bg-cyan-50/60 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Đang theo dõi chính sách: {selectedPolicy.code}</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">{selectedPolicy.name}</h3>
                <p className="text-sm font-medium text-slate-600">{selectedPolicy.amenityName}</p>
              </div>
            ) : (
              <div className="rounded-[20px] p-4 bg-amber-50 text-amber-700 text-sm font-medium">Vui lòng chọn 1 Chính sách ở Tab "Chính Sách & Nội Quy" để xem lịch sử version.</div>
            )}

            <div className="space-y-3">
              {versionsQuery.data?.map((version) => (
                <div key={version.id} className="rounded-[24px] border border-slate-200 bg-slate-50/50 p-5 hover:bg-white transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-slate-900">Version {version.versionNo}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusClass(version.status)}`}>{statusLabel(version.status)}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-100/50 p-3 rounded-xl">{version.changeSummary ?? 'Không có ghi chú'}</p>
                  {version.status === 'pending_approval' ? <button disabled={reviewVersionMutation.isPending} onClick={() => reviewVersionMutation.mutate(version.id)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-70"><ShieldCheck size={16} />Duyệt phiên bản ngay</button> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400"><BellRing size={16} />Chiến Dịch Thông Báo</div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tiêu đề thông báo</label>
                <input className="input-base w-full" value={notificationTitle} onChange={(event) => setNotificationTitle(event.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Nội dung chi tiết</label>
                <textarea className="input-base min-h-[120px] w-full leading-relaxed" value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} />
              </div>
              <button disabled={!selectedPolicyId || queueNotificationMutation.isPending} onClick={() => queueNotificationMutation.mutate()} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 font-black text-white hover:bg-cyan-700 disabled:opacity-50 transition-colors"><BellRing size={16} />Phát thông báo cho tòa nhà</button>
            </div>
            
            <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thông báo gần đây</p>
              {notificationsQuery.data?.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400"></div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900 truncate">{item.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] shrink-0 ${statusClass(item.status)}`}>{item.status === 'queued' ? 'Chưa gửi' : item.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
