import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Layers3, PenSquare, Plus, Save, ShieldCheck, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatUtilityMonthList, getUtilityScopeLabel } from '@/lib/utilityPresentation';
import utilityAdminService, { type UtilityPolicyFormInput, type UtilityScopeType } from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';

const HOT_SEASON_MONTHS = ['04', '05', '06', '07', '08', '09'];

function createDefaultForm(): UtilityPolicyFormInput {
  return {
    name: '',
    scopeType: 'system',
    scopeId: null,
    description: '',
    electricBaseAmount: 220000,
    waterBaseAmount: 50000,
    waterPerPersonAmount: 40000,
    electricHotSeasonMultiplier: 1.15,
    locationMultiplier: 1,
    seasonMonths: HOT_SEASON_MONTHS,
    roundingIncrement: 1000,
    minElectricFloor: 120000,
    minWaterFloor: 60000,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: null,
    adjustments: utilityAdminService.getDefaultDeviceAdjustments(),
  };
}

export default function UtilityPoliciesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<number | null>(null);
  const [form, setForm] = useState<UtilityPolicyFormInput>(createDefaultForm);

  const { data: policies = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['utility-policies'],
    queryFn: () => utilityAdminService.listPolicies(),
  });

  const { data: scopeOptions } = useQuery({
    queryKey: ['utility-policy-scope-options'],
    queryFn: () => utilityAdminService.getPolicyScopeOptions(),
  });

  const currentScopeOptions = useMemo(() => {
    if (!scopeOptions || form.scopeType === 'system') return [];
    return scopeOptions[form.scopeType];
  }, [form.scopeType, scopeOptions]);

  const deviceCatalog = utilityAdminService.getDeviceAdjustmentCatalog();
  const suggestedCode = utilityAdminService.createSuggestedPolicyCode(form.scopeType, form.scopeId, form.effectiveFrom);

  const saveMutation = useMutation({
    mutationFn: async (payload: UtilityPolicyFormInput) => {
      if (editingPolicyId != null) {
        await utilityAdminService.updatePolicy(editingPolicyId, payload);
        return editingPolicyId;
      }

      return utilityAdminService.createPolicy(payload);
    },
    onSuccess: () => {
      toast.success(editingPolicyId != null ? 'Đã cập nhật chính sách điện nước.' : 'Đã tạo chính sách điện nước mới.');
      setForm(createDefaultForm());
      setEditingPolicyId(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['utility-policies'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu chính sách điện nước.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      utilityAdminService.setPolicyActiveStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utility-policies'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái chính sách.');
    },
  });

  const updateAdjustment = (deviceCode: string, patch: Partial<UtilityPolicyFormInput['adjustments'][number]>) => {
    setForm((current) => ({
      ...current,
      adjustments: current.adjustments.map((item) =>
        item.deviceCode === deviceCode ? { ...item, ...patch } : item,
      ),
    }));
  };

  const resetForm = () => {
    setForm(createDefaultForm());
    setEditingPolicyId(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (policyId: number) => {
    const target = policies.find((item) => item.id === policyId);
    if (!target) return;

    setEditingPolicyId(target.id);
    setForm({
      code: target.code,
      name: target.name,
      scopeType: target.scopeType,
      scopeId: target.scopeId,
      description: target.description,
      electricBaseAmount: target.electricBaseAmount,
      waterBaseAmount: target.waterBaseAmount,
      waterPerPersonAmount: target.waterPerPersonAmount,
      electricHotSeasonMultiplier: target.electricHotSeasonMultiplier,
      locationMultiplier: target.locationMultiplier,
      seasonMonths: target.seasonMonths,
      roundingIncrement: target.roundingIncrement,
      minElectricFloor: target.minElectricFloor,
      minWaterFloor: target.minWaterFloor,
      effectiveFrom: target.effectiveFrom,
      effectiveTo: target.effectiveTo,
      adjustments: utilityAdminService.getDefaultDeviceAdjustments().map((item) => {
        const currentAdjustment = target.adjustments.find((adjustment) => adjustment.deviceCode === item.deviceCode);
        return currentAdjustment
          ? { ...item, chargeAmount: currentAdjustment.chargeAmount, isActive: currentAdjustment.isActive }
          : item;
      }),
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên chính sách.');
      return;
    }
    if (form.scopeType !== 'system' && !form.scopeId) {
      toast.error('Vui lòng chọn phạm vi áp dụng cụ thể.');
      return;
    }
    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      toast.error('Ngày kết thúc không được nhỏ hơn ngày hiệu lực.');
      return;
    }

    await saveMutation.mutateAsync({
      ...form,
      code: editingPolicyId != null ? form.code : suggestedCode,
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 pb-20">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-amber-600">
            <Zap size={14} />
            Chính sách tiện ích
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Chính sách điện nước</h1>
          <p className="max-w-4xl text-sm leading-6 text-slate-500">
            Đây là nơi khai báo mức tính nền cho điện nước. Chỉ cần chọn đúng phạm vi áp dụng, nhập mức giá nền, hệ số và
            phụ phí thiết bị. Hệ thống sẽ dùng chính sách này cho các kỳ hóa đơn phát sinh về sau.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
              return;
            }

            openCreateForm();
          }}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-amber-500 px-5 font-black text-white transition hover:bg-amber-600"
        >
          <Plus size={16} />
          {showForm ? 'Đóng biểu mẫu' : 'Tạo chính sách mới'}
        </button>
      </div>

      <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 md:grid-cols-3">
        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Khi nào dùng</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Dùng khi bạn muốn thiết lập mức điện nước mặc định cho toàn hệ thống, một tòa nhà, một phòng hoặc một hợp đồng.
          </p>
        </div>
        <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Cách thao tác</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            1. Chọn phạm vi áp dụng. 2. Nhập giá nền, hệ số, phụ phí. 3. Lưu chính sách. 4. Chỉ dùng ghi đè ở màn hình khác
            nếu cần sửa riêng cho đúng một kỳ hóa đơn.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Thứ tự ưu tiên</p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Hệ thống luôn ưu tiên mức gần hợp đồng hơn: hợp đồng, phòng, tòa nhà, rồi đến toàn hệ thống. Ghi đè kỳ hóa đơn sẽ
            cao hơn mọi chính sách.
          </p>
        </div>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-sm font-black uppercase tracking-[0.2em] text-cyan-700">
            <ShieldCheck size={18} />
            {editingPolicyId != null ? 'Chỉnh sửa chính sách' : 'Tạo chính sách mới'}
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">1. Phạm vi áp dụng</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Áp dụng theo</span>
                    <select
                      className="input-base w-full bg-white"
                      value={form.scopeType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scopeType: event.target.value as UtilityScopeType,
                          scopeId: null,
                        }))
                      }
                    >
                      <option value="system">Toàn hệ thống</option>
                      <option value="building">Một tòa nhà</option>
                      <option value="room">Một phòng cụ thể</option>
                      <option value="contract">Một hợp đồng cụ thể</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Đối tượng áp dụng</span>
                    <select
                      className="input-base w-full bg-white disabled:bg-slate-100"
                      value={form.scopeId ?? ''}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scopeId: event.target.value ? Number(event.target.value) : null,
                        }))
                      }
                      disabled={form.scopeType === 'system'}
                    >
                      <option value="">{form.scopeType === 'system' ? 'Không cần chọn' : 'Chọn đối tượng áp dụng'}</option>
                      {currentScopeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-bold text-slate-700">Tên chính sách</span>
                    <input
                      className="input-base w-full bg-white"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ví dụ: Chuẩn Keangnam, Phòng cao cấp tầng 1..."
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-bold text-slate-700">Ghi chú nội bộ</span>
                    <textarea
                      className="input-base min-h-[96px] w-full bg-white"
                      value={form.description ?? ''}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Ghi chú vì sao tạo chính sách này, khi nào nên dùng..."
                    />
                  </label>
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {editingPolicyId != null ? (
                    <>Mã chính sách hiện tại: <span className="font-black">{form.code}</span>. Khi chỉnh sửa, hệ thống giữ nguyên mã nội bộ đang dùng.</>
                  ) : (
                    <>Hệ thống tự sinh mã chính sách: <span className="font-black">{suggestedCode}</span>. Người dùng không phải nhập mã nội bộ.</>
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                  <span className="font-black text-slate-900">Lưu ý:</span> “Phạm vi hợp đồng” ở đây là một chính sách áp riêng cho hợp đồng đó.
                  Nếu hợp đồng đã được gắn sẵn một chính sách riêng từ nghiệp vụ hợp đồng, hệ thống vẫn ưu tiên mức gần hợp đồng trước khi lùi về
                  phòng, tòa nhà và toàn hệ thống.
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">2. Đơn giá nền</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Điện cơ bản / phòng</span>
                    <input type="number" className="input-base w-full bg-white" value={form.electricBaseAmount} onChange={(event) => setForm((current) => ({ ...current, electricBaseAmount: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Điện tối thiểu</span>
                    <input type="number" className="input-base w-full bg-white" value={form.minElectricFloor} onChange={(event) => setForm((current) => ({ ...current, minElectricFloor: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Nước cố định / phòng</span>
                    <input type="number" className="input-base w-full bg-white" value={form.waterBaseAmount} onChange={(event) => setForm((current) => ({ ...current, waterBaseAmount: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Nước / người</span>
                    <input type="number" className="input-base w-full bg-white" value={form.waterPerPersonAmount} onChange={(event) => setForm((current) => ({ ...current, waterPerPersonAmount: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Nước tối thiểu</span>
                    <input type="number" className="input-base w-full bg-white" value={form.minWaterFloor} onChange={(event) => setForm((current) => ({ ...current, minWaterFloor: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Làm tròn hóa đơn</span>
                    <input type="number" className="input-base w-full bg-white" value={form.roundingIncrement} onChange={(event) => setForm((current) => ({ ...current, roundingIncrement: Number(event.target.value) }))} />
                  </label>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">3. Hệ số và thời gian hiệu lực</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Ngày hiệu lực</span>
                    <input type="date" className="input-base w-full bg-white" value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Ngày kết thúc</span>
                    <input type="date" className="input-base w-full bg-white" value={form.effectiveTo ?? ''} min={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveTo: event.target.value || null }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Hệ số mùa nóng</span>
                    <input type="number" step="0.01" min={1} className="input-base w-full bg-white" value={form.electricHotSeasonMultiplier} onChange={(event) => setForm((current) => ({ ...current, electricHotSeasonMultiplier: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-700">Hệ số vị trí</span>
                    <input type="number" step="0.01" min={0.1} className="input-base w-full bg-white" value={form.locationMultiplier} onChange={(event) => setForm((current) => ({ ...current, locationMultiplier: Number(event.target.value) }))} />
                  </label>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-700">Các tháng áp dụng mùa nóng</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month) => {
                      const selected = form.seasonMonths.includes(month);
                      return (
                        <button
                          key={month}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              seasonMonths: selected
                                ? current.seasonMonths.filter((item) => item !== month)
                                : [...current.seasonMonths, month].sort(),
                            }))
                          }
                          className={`rounded-xl px-4 py-2 text-xs font-black tracking-[0.18em] ${
                            selected ? 'bg-rose-500 text-white' : 'border border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          Tháng {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-slate-50/60 p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">4. Phụ phí thiết bị</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Đây là phụ thu điện cố định theo thiết bị. Ví dụ phòng có máy lạnh đang gắn thì hệ thống cộng thêm số tiền này
                  vào phần điện của hóa đơn. Thiết bị được lấy từ tài sản đang gắn vào phòng, không lấy từ mã ID thủ công.
                </p>
                <div className="mt-4 space-y-3">
                  {deviceCatalog.map((device) => {
                    const adjustment = form.adjustments.find((item) => item.deviceCode === device.code);
                    const isActive = adjustment?.isActive ?? false;
                    return (
                      <div key={device.code} className={`rounded-2xl border p-4 ${isActive ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">{device.label}</p>
                            <p className="text-sm leading-6 text-slate-500">{device.description}</p>
                          </div>
                          <button type="button" onClick={() => updateAdjustment(device.code, { isActive: !isActive })}>
                            {isActive ? <ToggleRight size={26} className="text-amber-500" /> : <ToggleLeft size={26} className="text-slate-300" />}
                          </button>
                        </div>
                        {isActive ? (
                          <div className="mt-3">
                            <input
                              type="number"
                              min={0}
                              className="input-base w-full bg-white"
                              value={adjustment?.chargeAmount ?? 0}
                              onChange={(event) => updateAdjustment(device.code, { chargeAmount: Number(event.target.value) })}
                              placeholder="Nhập số tiền / tháng"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 md:flex-row md:items-center">
            <button type="submit" disabled={saveMutation.isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 font-black text-white transition hover:bg-slate-800 disabled:opacity-60">
              <Save size={18} />
              {saveMutation.isPending ? 'Đang lưu...' : editingPolicyId != null ? 'Lưu thay đổi' : 'Lưu chính sách'}
            </button>
            {editingPolicyId != null ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 font-black text-slate-600 transition hover:bg-slate-50"
              >
                Hủy chỉnh sửa
              </button>
            ) : null}
            <div className="rounded-2xl bg-amber-50 px-5 py-3 text-sm text-amber-800">
              Chính sách chỉ áp cho các kỳ hóa đơn phát sinh sau khi lưu. Dữ liệu bản chụp công thức và lịch sử hóa đơn cũ không bị thay đổi.
            </div>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-[28px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner message="Không tải được danh sách chính sách điện nước." onRetry={refetch} />
      ) : policies.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-xl font-black text-slate-900">Chưa có chính sách tiện ích nào</p>
          <p className="mt-2 text-sm text-slate-500">
            Hãy tạo ít nhất một chính sách toàn hệ thống để các màn hình ghi đè và đợt xuất hóa đơn có cấu hình nền để sử dụng.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {policies.map((policy) => (
            <article key={policy.id} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
                      <Layers3 size={12} />
                      {getUtilityScopeLabel(policy.scopeType)}
                    </span>
                    {policy.scopeLabel ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{policy.scopeLabel}</span>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{policy.name}</h2>
                  <p className="text-sm text-slate-500">{policy.description || `Mã hệ thống tự tạo: ${policy.code}`}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(policy.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-slate-600 transition hover:bg-slate-50"
                  >
                    <PenSquare size={14} />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: policy.id, isActive: !policy.isActive })}
                    className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.15em] ${
                      policy.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {policy.isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Điện</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Cơ bản</span><span className="font-black text-slate-900">{formatVND(policy.electricBaseAmount)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Tối thiểu</span><span className="font-black text-slate-900">{formatVND(policy.minElectricFloor)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Mùa nóng</span><span className="font-black text-emerald-700">x{policy.electricHotSeasonMultiplier}</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Nước</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Cố định / phòng</span><span className="font-black text-slate-900">{formatVND(policy.waterBaseAmount)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Theo người</span><span className="font-black text-slate-900">{formatVND(policy.waterPerPersonAmount)}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Tối thiểu</span><span className="font-black text-blue-700">{formatVND(policy.minWaterFloor)}</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">Tháng nóng: {formatUtilityMonthList(policy.seasonMonths)}</span>
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">Hệ số vị trí: x{policy.locationMultiplier}</span>
                <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">Làm tròn: {formatVND(policy.roundingIncrement)}</span>
              </div>

              {policy.adjustments.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Phụ phí thiết bị đang bật</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {policy.adjustments.map((adjustment) => {
                      const meta = deviceCatalog.find((item) => item.code === adjustment.deviceCode);
                      return (
                        <span key={adjustment.deviceCode} className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
                          {meta?.label ?? adjustment.deviceCode}: {formatVND(adjustment.chargeAmount)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-bold text-slate-500">
                <Calendar size={14} className="text-slate-400" />
                <span>
                  Hiệu lực từ <span className="text-slate-700">{formatDate(policy.effectiveFrom)}</span>{' '}
                  {policy.effectiveTo ? <>đến <span className="text-slate-700">{formatDate(policy.effectiveTo)}</span></> : 'không giới hạn'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
