import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Layers3, Plus, Save, ShieldCheck, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import utilityAdminService, {
  type UtilityPolicyFormInput,
  type UtilityScopeType,
} from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';

const HOT_SEASON_MONTHS = ['04', '05', '06', '07', '08', '09'];

const pageFontStyle: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};

const numericStyle: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

function createDefaultForm(): UtilityPolicyFormInput {
  return {
    code: '',
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
    adjustments: utilityAdminService.getDefaultDeviceAdjustments(),
  };
}

function getScopeLabel(scopeType: UtilityScopeType) {
  switch (scopeType) {
    case 'system':
      return 'Hệ thống';
    case 'building':
      return 'Tòa nhà';
    case 'room':
      return 'Phòng';
    case 'contract':
      return 'Hợp đồng';
    default:
      return scopeType;
  }
}

export default function UtilityPoliciesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UtilityPolicyFormInput>(createDefaultForm);

  const { data: policies = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['utility-policies'],
    queryFn: () => utilityAdminService.listPolicies(),
  });

  const { data: scopeOptions } = useQuery({
    queryKey: ['utility-policy-scope-options'],
    queryFn: () => utilityAdminService.getPolicyScopeOptions(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: UtilityPolicyFormInput) => utilityAdminService.createPolicy(payload),
    onSuccess: () => {
      toast.success('Đã tạo chính sách tiện ích mới.');
      setForm(createDefaultForm());
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['utility-policies'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo chính sách tiện ích.');
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

  const currentScopeOptions = useMemo(() => {
    if (!scopeOptions) return [];
    if (form.scopeType === 'system') return [];
    return scopeOptions[form.scopeType];
  }, [form.scopeType, scopeOptions]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync(form);
  };

  const updateScopeType = (scopeType: UtilityScopeType) => {
    setForm((current) => ({
      ...current,
      scopeType,
      scopeId: scopeType === 'system' ? null : null,
    }));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 pb-20" style={pageFontStyle}>
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-amber-600">
            <Zap size={14} />
            Thanh toán tiện ích
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Chính Sách Tiện Ích</h1>
          <p className="max-w-3xl text-sm font-medium text-slate-500">
            Quản lý đầy đủ chính sách cho điện và nước theo phạm vi hệ thống, tòa nhà, phòng hoặc hợp đồng. Mỗi bản ghi là một phiên
            bản hoàn chỉnh của công thức tính theo chính sách, không dùng kWh và không dùng đồng hồ.
          </p>
        </div>

        <button
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-amber-500 px-5 font-black text-white transition hover:bg-amber-600"
        >
          <Plus size={16} />
          {showForm ? 'Đóng biểu mẫu' : 'Tạo chính sách mới'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
            <ShieldCheck size={16} />
            Định nghĩa chính sách
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mã</span>
              <input
                className="input-base w-full"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="SYS-DEFAULT-2026-04"
                required
              />
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tên chính sách</span>
              <input
                className="input-base w-full"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Chính sách mặc định cho mùa nóng"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ngày hiệu lực</span>
              <input
                type="date"
                className="input-base w-full"
                style={numericStyle}
                value={form.effectiveFrom}
                onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Phạm vi</span>
              <select
                className="input-base w-full"
                value={form.scopeType}
                onChange={(event) => updateScopeType(event.target.value as UtilityScopeType)}
              >
                <option value="system">Hệ thống</option>
                <option value="building">Tòa nhà</option>
                <option value="room">Phòng</option>
                <option value="contract">Hợp đồng</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Đối tượng áp dụng</span>
              <select
                className="input-base w-full"
                value={form.scopeId ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scopeId: event.target.value ? Number(event.target.value) : null,
                  }))
                }
                disabled={form.scopeType === 'system'}
              >
                <option value="">{form.scopeType === 'system' ? 'Không áp dụng' : 'Chọn đối tượng'}</option>
                {currentScopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mô tả</span>
              <input
                className="input-base w-full"
                value={form.description ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Áp dụng cho phòng có máy lạnh, bếp điện và vị trí trung tâm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mức điện cơ bản</span>
              <input
                type="number"
                min={0}
                className="input-base w-full"
                style={numericStyle}
                value={form.electricBaseAmount}
                onChange={(event) => setForm((current) => ({ ...current, electricBaseAmount: Number(event.target.value) }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mức nước cơ bản</span>
              <input
                type="number"
                min={0}
                className="input-base w-full"
                style={numericStyle}
                value={form.waterBaseAmount}
                onChange={(event) => setForm((current) => ({ ...current, waterBaseAmount: Number(event.target.value) }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Nước / người</span>
              <input
                type="number"
                min={0}
                className="input-base w-full"
                style={numericStyle}
                value={form.waterPerPersonAmount}
                onChange={(event) => setForm((current) => ({ ...current, waterPerPersonAmount: Number(event.target.value) }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hệ số vị trí</span>
              <input
                type="number"
                min={0.1}
                step="0.01"
                className="input-base w-full"
                style={numericStyle}
                value={form.locationMultiplier}
                onChange={(event) => setForm((current) => ({ ...current, locationMultiplier: Number(event.target.value) }))}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hệ số mùa nóng</span>
              <input
                type="number"
                min={1}
                step="0.01"
                className="input-base w-full"
                style={numericStyle}
                value={form.electricHotSeasonMultiplier}
                onChange={(event) =>
                  setForm((current) => ({ ...current, electricHotSeasonMultiplier: Number(event.target.value) }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bước làm tròn</span>
              <input
                type="number"
                min={1}
                className="input-base w-full"
                style={numericStyle}
                value={form.roundingIncrement}
                onChange={(event) => setForm((current) => ({ ...current, roundingIncrement: Number(event.target.value) }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mức sàn điện</span>
              <input
                type="number"
                min={0}
                className="input-base w-full"
                style={numericStyle}
                value={form.minElectricFloor}
                onChange={(event) => setForm((current) => ({ ...current, minElectricFloor: Number(event.target.value) }))}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mức sàn nước</span>
              <input
                type="number"
                min={0}
                className="input-base w-full"
                style={numericStyle}
                value={form.minWaterFloor}
                onChange={(event) => setForm((current) => ({ ...current, minWaterFloor: Number(event.target.value) }))}
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Các tháng áp dụng</p>
            <div className="flex flex-wrap gap-2">
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
                          ? current.seasonMonths.filter((value) => value !== month)
                          : [...current.seasonMonths, month].sort(),
                      }))
                    }
                    className={`rounded-full px-4 py-2 text-xs font-black tracking-[0.18em] transition ${
                      selected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                    style={numericStyle}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Phụ phí thiết bị</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {form.adjustments.map((adjustment, index) => (
                <div key={adjustment.deviceCode} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{adjustment.deviceCode}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          adjustments: current.adjustments.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, isActive: !item.isActive } : item,
                          ),
                        }))
                      }
                      className="text-slate-500"
                      aria-label={adjustment.isActive ? 'Tắt phụ phí thiết bị' : 'Bật phụ phí thiết bị'}
                      title={adjustment.isActive ? 'Tắt phụ phí thiết bị' : 'Bật phụ phí thiết bị'}
                    >
                      {adjustment.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    className="input-base mt-3 w-full"
                    style={numericStyle}
                    value={adjustment.chargeAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        adjustments: current.adjustments.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, chargeAmount: Number(event.target.value) } : item,
                        ),
                      }))
                    }
                    disabled={!adjustment.isActive}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <Save size={16} />
            {createMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-[28px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner message="Không tải được danh sách chính sách tiện ích." onRetry={refetch} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {policies.map((policy) => (
            <article key={policy.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    <Layers3 size={14} />
                    {getScopeLabel(policy.scopeType)}
                    {policy.scopeId != null ? <span style={numericStyle}>#{policy.scopeId}</span> : ''}
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">{policy.name}</h2>
                  <p className="text-xs text-slate-400" style={numericStyle}>
                    {policy.code}
                  </p>
                </div>

                <button
                  onClick={() => toggleMutation.mutate({ id: policy.id, isActive: !policy.isActive })}
                  className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    policy.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {policy.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Điện</p>
                  <p className="mt-2 text-sm font-bold text-slate-700" style={numericStyle}>
                    Mức cơ bản: {formatVND(policy.electricBaseAmount)}
                  </p>
                  <p className="text-sm font-bold text-slate-700" style={numericStyle}>
                    Mùa nóng: x{policy.electricHotSeasonMultiplier}
                  </p>
                  <p className="text-sm font-bold text-slate-700" style={numericStyle}>
                    Mức sàn: {formatVND(policy.minElectricFloor)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Nước</p>
                  <p className="mt-2 text-sm font-bold text-slate-700" style={numericStyle}>
                    Mức cơ bản: {formatVND(policy.waterBaseAmount)}
                  </p>
                  <p className="text-sm font-bold text-slate-700" style={numericStyle}>
                    Theo người: {formatVND(policy.waterPerPersonAmount)}
                  </p>
                  <p className="text-sm font-bold text-slate-700" style={numericStyle}>
                    Mức sàn: {formatVND(policy.minWaterFloor)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700" style={numericStyle}>
                  Chu kỳ: {policy.seasonMonths.join(', ')}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue-700" style={numericStyle}>
                  Hệ số vị trí x{policy.locationMultiplier}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600" style={numericStyle}>
                  Làm tròn {formatVND(policy.roundingIncrement)}
                </span>
              </div>

              {policy.adjustments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Phụ phí thiết bị</p>
                  <div className="flex flex-wrap gap-2">
                    {policy.adjustments.map((adjustment) => (
                      <span
                        key={adjustment.deviceCode}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white"
                        style={numericStyle}
                      >
                        {adjustment.deviceCode}: {formatVND(adjustment.chargeAmount)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-400" style={numericStyle}>
                <Calendar size={14} />
                {formatDate(policy.effectiveFrom)}
                {policy.effectiveTo ? ` -> ${formatDate(policy.effectiveTo)}` : ' -> Không thời hạn'}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
