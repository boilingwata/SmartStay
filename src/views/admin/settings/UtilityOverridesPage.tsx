import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Eraser, PenSquare, Save } from 'lucide-react';
import { toast } from 'sonner';
import utilityAdminService, { type UtilityOverrideFormInput } from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';

const pageFontStyle: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};

const numericStyle: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

function createDefaultForm(): UtilityOverrideFormInput {
  return {
    contractId: 0,
    billingPeriod: new Date().toISOString().slice(0, 7),
    reason: '',
    seasonMonthsOverride: [],
  };
}

export default function UtilityOverridesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UtilityOverrideFormInput>(createDefaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: overrides = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['utility-overrides'],
    queryFn: () => utilityAdminService.listOverrides(),
  });

  const { data: scopeOptions } = useQuery({
    queryKey: ['utility-policy-scope-options'],
    queryFn: () => utilityAdminService.getPolicyScopeOptions(),
  });

  const contractOptions = scopeOptions?.contract ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: UtilityOverrideFormInput) => utilityAdminService.upsertOverride(payload),
    onSuccess: () => {
      toast.success('Đã lưu ghi đè cho kỳ thanh toán.');
      setForm(createDefaultForm());
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['utility-overrides'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu ghi đè.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (overrideId: number) => utilityAdminService.deleteOverride(overrideId),
    onSuccess: () => {
      toast.success('Đã xóa ghi đè của kỳ thanh toán.');
      queryClient.invalidateQueries({ queryKey: ['utility-overrides'] });
      if (editingId != null) {
        setEditingId(null);
        setForm(createDefaultForm());
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể xóa ghi đè.');
    },
  });

  const selectedContractLabel = useMemo(
    () => contractOptions.find((option) => option.value === form.contractId)?.label ?? '',
    [contractOptions, form.contractId],
  );

  const usesElectricFinalOverride = form.electricFinalOverride != null && form.electricFinalOverride !== undefined;
  const usesWaterFinalOverride = form.waterFinalOverride != null && form.waterFinalOverride !== undefined;

  const startEdit = (overrideId: number) => {
    const target = overrides.find((item) => item.id === overrideId);
    if (!target) return;

    setEditingId(target.id);
    setForm({
      contractId: target.contractId,
      billingPeriod: target.billingPeriod,
      reason: target.reason,
      occupantsForBillingOverride: target.occupantsForBillingOverride,
      electricBaseOverride: target.electricBaseOverride,
      electricFinalOverride: target.electricFinalOverride,
      waterBaseOverride: target.waterBaseOverride,
      waterFinalOverride: target.waterFinalOverride,
      locationMultiplierOverride: target.locationMultiplierOverride,
      seasonMonthsOverride: target.seasonMonthsOverride,
      electricHotSeasonMultiplierOverride: target.electricHotSeasonMultiplierOverride,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.contractId) {
      toast.error('Cần chọn hợp đồng để tạo ghi đè.');
      return;
    }
    await saveMutation.mutateAsync(form);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 pb-20" style={pageFontStyle}>
      <div className="space-y-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-rose-600">
          <PenSquare size={14} />
          Ghi đè theo kỳ hóa đơn
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Ghi Đè Tiện Ích</h1>
        <p className="max-w-3xl text-sm font-medium text-slate-500">
          Ghi đè chỉ tác động đúng một kỳ thanh toán. Policy gốc không đổi. Dùng màn này khi cần chốt tay
          số người, giá cơ bản hoặc giá cuối cùng cho một hợp đồng trong đúng một tháng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Base Override</p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            `Electric/Water base override` chỉ thay phần giá cơ bản trước khi hệ thống áp mùa nóng, hệ số vị trí,
            số người và làm tròn.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Final Override</p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            `Electric/Water final override` là số tiền chốt cuối cùng. Khi nhập trường này, hệ thống bỏ qua
            toàn bộ công thức của phần điện hoặc nước trong kỳ đó.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Kỳ Thanh Toán</p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            `Billing period` là tháng phát sinh chi phí utility, ví dụ `2026-04`, không phải ngày lập hóa đơn.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hợp đồng</span>
            <select
              className="input-base w-full"
              value={form.contractId || ''}
              onChange={(event) => setForm((current) => ({ ...current, contractId: Number(event.target.value) }))}
            >
              <option value="">Chọn hợp đồng</option>
              {contractOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chu kỳ thanh toán</span>
            <input
              type="month"
              className="input-base w-full"
              style={numericStyle}
              value={form.billingPeriod}
              onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value }))}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Lý do</span>
            <input
              className="input-base w-full"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Khách chốt giá riêng trong tháng này"
              required
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ghi đè số người</span>
            <input
              type="number"
              min={0}
              className="input-base w-full"
              style={numericStyle}
              value={form.occupantsForBillingOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  occupantsForBillingOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ghi đè điện cơ bản</span>
            <input
              type="number"
              min={0}
              className="input-base w-full"
              style={numericStyle}
              value={form.electricBaseOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  electricBaseOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ghi đè điện cuối cùng</span>
            <input
              type="number"
              min={0}
              className="input-base w-full"
              style={numericStyle}
              value={form.electricFinalOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  electricFinalOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
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
              value={form.locationMultiplierOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  locationMultiplierOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ghi đè nước cơ bản</span>
            <input
              type="number"
              min={0}
              className="input-base w-full"
              style={numericStyle}
              value={form.waterBaseOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  waterBaseOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ghi đè nước cuối cùng</span>
            <input
              type="number"
              min={0}
              className="input-base w-full"
              style={numericStyle}
              value={form.waterFinalOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  waterFinalOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hệ số mùa nóng</span>
            <input
              type="number"
              min={0.1}
              step="0.01"
              className="input-base w-full"
              style={numericStyle}
              value={form.electricHotSeasonMultiplierOverride ?? ''}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  electricHotSeasonMultiplierOverride: event.target.value === '' ? null : Number(event.target.value),
                }))
              }
            />
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-900 px-5 font-black text-white transition hover:bg-slate-800"
            >
              <Save size={16} />
              {editingId ? 'Cập nhật ghi đè' : 'Tạo ghi đè'}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(createDefaultForm());
                }}
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 font-black text-slate-600"
              >
                <Eraser size={16} />
                Hủy
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          Hợp đồng: {selectedContractLabel || 'chưa chọn'}.
          {' '}
          {usesElectricFinalOverride || usesWaterFinalOverride
            ? 'Bạn đang dùng final override, hệ thống sẽ lấy đúng số tiền chốt cuối cho phần đã nhập.'
            : 'Bạn đang dùng base override hoặc để trống, hệ thống vẫn tiếp tục áp công thức utility policy.'}
        </div>
      </form>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[28px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner message="Không tải được danh sách ghi đè tiện ích." onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr_120px] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <span>Hợp đồng</span>
            <span>Chu kỳ</span>
            <span>Điện</span>
            <span>Nước</span>
            <span>Ngày tạo</span>
            <span>Thao tác</span>
          </div>
          <div className="divide-y divide-slate-100">
            {overrides.map((override) => (
              <div key={override.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr_120px] gap-4 px-6 py-4 text-sm">
                <div>
                  <p className="font-black text-slate-900">{override.contractCode}</p>
                  <p className="text-xs font-bold text-slate-400">{override.roomCode}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{override.reason}</p>
                </div>
                <div className="font-bold text-slate-700" style={numericStyle}>
                  {override.billingPeriod}
                </div>
                <div className="font-bold text-slate-700" style={numericStyle}>
                  {override.electricFinalOverride != null
                    ? formatVND(override.electricFinalOverride)
                    : override.electricBaseOverride != null
                      ? `Cơ bản ${formatVND(override.electricBaseOverride)}`
                      : 'Không có'}
                </div>
                <div className="font-bold text-slate-700" style={numericStyle}>
                  {override.waterFinalOverride != null
                    ? formatVND(override.waterFinalOverride)
                    : override.waterBaseOverride != null
                      ? `Cơ bản ${formatVND(override.waterBaseOverride)}`
                      : 'Không có'}
                </div>
                <div className="text-xs font-bold text-slate-500" style={numericStyle}>
                  <div className="flex items-center gap-2">
                    <CalendarRange size={14} />
                    {formatDate(override.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(override.id)}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white"
                    title="Chỉnh sửa ghi đè"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(override.id)}
                    className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-700"
                    title="Xóa ghi đè"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
