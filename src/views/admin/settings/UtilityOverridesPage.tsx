import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarRange, Eraser, PenSquare, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatUtilityBillingPeriod, formatUtilityDateTime, formatUtilityMonthList } from '@/lib/utilityPresentation';
import utilityAdminService, { type UtilityOverrideFormInput } from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatVND } from '@/utils';

const pageFontStyle: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
};

const numericStyle: React.CSSProperties = {
  fontFamily: '"Inter", system-ui, sans-serif',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

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

  const contractOptions = useMemo(() => scopeOptions?.contract ?? [], [scopeOptions]);

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
  const currentBillingMonth = useMemo(() => form.billingPeriod.slice(5, 7), [form.billingPeriod]);

  const usesElectricFinalOverride = form.electricFinalOverride != null && form.electricFinalOverride !== undefined;
  const usesWaterFinalOverride = form.waterFinalOverride != null && form.waterFinalOverride !== undefined;

  const toggleSeasonMonth = (month: string) => {
    setForm((current) => {
      const selected = current.seasonMonthsOverride ?? [];
      const exists = selected.includes(month);
      return {
        ...current,
        seasonMonthsOverride: exists
          ? selected.filter((item) => item !== month)
          : [...selected, month].sort(),
      };
    });
  };

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
      <div className="space-y-4 border-b border-slate-100 pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-full">
          <PenSquare size={14} />
          Ghi đè thủ công theo kỳ hóa đơn
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Quản Lý Ngoại Lệ Tiện Ích</h1>
        <p className="max-w-3xl text-sm font-medium text-slate-500 leading-relaxed">
          Dùng màn hình này khi bạn cần sửa riêng tiền điện nước cho <b>đúng một hợp đồng trong đúng một kỳ hóa đơn</b>.
          Nếu nhu cầu áp dụng lâu dài, hãy quay lại màn hình chính sách thay vì ghi đè thủ công.
        </p>

        <div className="grid gap-4 mt-6 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Ghi đè mức cơ sở</p>
            <p className="text-[13px] font-medium text-slate-600 leading-snug">Chỉ thay đổi mức nền. Hệ thống vẫn áp dụng hệ số vị trí, mùa nóng và phụ phí thiết bị như bình thường.</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 mb-1">Chốt số tiền tuyệt đối</p>
            <p className="text-[13px] font-medium text-slate-600 leading-snug">Khóa cứng số tiền phải thu của tháng đó. Hệ thống sẽ bỏ qua toàn bộ công thức tính ở kỳ này.</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 mb-1">Quy tắc áp dụng</p>
            <p className="text-[13px] font-medium text-slate-600 leading-snug">Ghi đè được khớp theo cặp <b>hợp đồng + kỳ hóa đơn</b>. Khi đợt xuất hóa đơn chạy, ghi đè sẽ ưu tiên cao hơn mọi chính sách.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-600">
          <span className="font-black text-slate-900">Cách thao tác:</span> 1. Chọn đúng hợp đồng và kỳ hóa đơn. 2. Chỉ nhập các trường cần sửa.
          3. Nếu muốn giữ nguyên công thức gốc, hãy để trống. 4. Chỉ dùng “chốt số tiền tuyệt đối” khi đã xác nhận chắc số tiền phải thu.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-600 border-b border-slate-100 pb-4">
          <PenSquare size={18} />
          {editingId ? 'Chỉnh sửa ghi đè' : 'Tạo ghi đè mới'}
        </div>

        <div className="space-y-6 block">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">1. Thông tin Hợp đồng & Kỳ hóa đơn</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs font-bold text-slate-600">Chọn hợp đồng</span>
              <p className="text-[10px] text-slate-500 mb-1">Hợp đồng sẽ được áp dụng ngoại lệ này.</p>
              <select className="input-base w-full bg-white font-bold text-slate-700" value={form.contractId || ''} onChange={(event) => setForm((current) => ({ ...current, contractId: Number(event.target.value) }))}>
                <option value="">-- Bấm để chọn hợp đồng --</option>
                {contractOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-600">Kỳ hóa đơn</span>
              <p className="text-[10px] text-slate-500 mb-1">Tháng áp dụng ghi đè. Ví dụ: 2026-04</p>
              <input type="month" className="input-base w-full bg-white text-indigo-700 font-bold" style={numericStyle} value={form.billingPeriod} onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value }))} />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-600">Lý do ghi đè</span>
              <p className="text-[10px] text-slate-500 mb-1">Ghi chú lại lý do để đối soát sau này.</p>
              <input className="input-base w-full bg-white" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Ví dụ: Hỗ trợ tháng đầu cho khách mới" required />
            </label>
          </div>
        </div>

        <div className="space-y-6 block">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">2. Thông số Điện & Nước</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl bg-slate-50/50 border border-slate-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 border-b border-slate-100 pb-2">Ghi đè mức cơ sở</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Điện cơ bản mới (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Chỉ thay đổi mức giá điện cơ bản. Phụ thu, prorate vẫn tính. VD: 150000</p>
                  <input type="number" min={0} className="input-base w-full bg-white" style={numericStyle} placeholder="Giữ theo chính sách" value={form.electricBaseOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, electricBaseOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Nước cơ bản mới (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Chỉ thay đổi mức khoán nước của phòng. Phí theo người vẫn tính. VD: 0</p>
                  <input type="number" min={0} className="input-base w-full bg-white" style={numericStyle} placeholder="Giữ theo chính sách" value={form.waterBaseOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, waterBaseOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Số người ở thực tế</span>
                  <p className="text-[10px] text-slate-500 mb-1">Ghi đè số người tính phí nước cho tháng này. VD: 1</p>
                  <input type="number" min={0} className="input-base w-full bg-white" style={numericStyle} placeholder="Giữ theo hợp đồng" value={form.occupantsForBillingOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, occupantsForBillingOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Hệ số Mùa nóng mới</span>
                  <p className="text-[10px] text-slate-500 mb-1">Ghi đè hệ số nhân tháng nóng. VD: 1.0 (Bỏ mùa nóng)</p>
                  <input type="number" min={0.1} step="0.01" className="input-base w-full bg-white" style={numericStyle} placeholder="Giữ theo chính sách" value={form.electricHotSeasonMultiplierOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, electricHotSeasonMultiplierOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                 <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Hệ số Vị trí mới</span>
                  <p className="text-[10px] text-slate-500 mb-1">Ghi đè hệ số nhân vị trí. VD: 1.0</p>
                  <input type="number" min={0.1} step="0.01" className="input-base w-full bg-white" style={numericStyle} placeholder="Giữ theo chính sách" value={form.locationMultiplierOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, locationMultiplierOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Thiết lập mùa nóng cho kỳ này</p>
                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      Trường này chỉ dùng khi bạn muốn thay đổi cách xác định “tháng nóng” của đúng kỳ đang sửa.
                      Nếu không chắc, hãy để trống để giữ theo chính sách gốc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, seasonMonthsOverride: [] }))}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 transition hover:bg-slate-50"
                  >
                    Giữ theo chính sách
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ALL_MONTHS.map((month) => {
                    const selected = (form.seasonMonthsOverride ?? []).includes(month);
                    const isCurrentMonth = month === currentBillingMonth;
                    return (
                      <button
                        key={month}
                        type="button"
                        onClick={() => toggleSeasonMonth(month)}
                        className={`rounded-xl border px-3 py-2 text-xs font-black tracking-[0.16em] transition ${
                          selected
                            ? 'border-rose-300 bg-rose-500 text-white'
                            : isCurrentMonth
                              ? 'border-amber-300 bg-amber-50 text-amber-800'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Th{month}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] font-medium text-slate-500">
                  Danh sách đang chọn: <span className="font-black text-slate-700">{formatUtilityMonthList(form.seasonMonthsOverride ?? [])}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-rose-50/30 border border-rose-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-rose-500 border-b border-rose-100 pb-2">Chốt số tiền tuyệt đối</div>
              <p className="text-[11px] text-slate-500">Khi nhập số tiền ở đây, hệ thống sẽ thu đúng số đó và bỏ qua toàn bộ công thức tính ở cột bên trái.</p>
              <div className="grid gap-4 sm:grid-cols-2 mt-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold text-rose-800">Chốt TỔNG tiền ĐIỆN (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Thu chính xác con số này, không qua công thức. VD: Miễn phí điền 0, hoặc thu đúng 200000.</p>
                  <input type="number" min={0} className="input-base w-full bg-white border-rose-200 text-rose-700 font-bold focus:border-rose-400 focus:ring-rose-400/20" style={numericStyle} placeholder="Không chốt tay" value={form.electricFinalOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, electricFinalOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-rose-800">Chốt TỔNG tiền NƯỚC (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Thu chính xác con số này, không qua công thức. VD: Miễn phí điền 0, hoặc thu đúng 50000.</p>
                  <input type="number" min={0} className="input-base w-full bg-white border-rose-200 text-rose-700 font-bold focus:border-rose-400 focus:ring-rose-400/20" style={numericStyle} placeholder="Không chốt tay" value={form.waterFinalOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, waterFinalOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-100">
          <div className="flex-1 rounded-2xl bg-amber-50 px-5 py-3 text-xs font-bold text-amber-800 leading-relaxed border border-amber-100 w-full">
            Đang cấu hình ghi đè cho: <strong className="text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">{form.contractId ? selectedContractLabel : 'Chưa chọn'}</strong>
            <br />
            {usesElectricFinalOverride || usesWaterFinalOverride ? <span className="text-rose-600">Đang bật chế độ chốt số tiền tuyệt đối. Các giá trị cơ sở sẽ bị bỏ qua.</span> : 'Đang dùng ghi đè mức cơ sở hoặc giữ nguyên chính sách gốc.'}
            {' '}Kỳ đang sửa: {form.billingPeriod ? formatUtilityBillingPeriod(form.billingPeriod) : '--'}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
            {editingId != null && (
              <button type="button" onClick={() => { setEditingId(null); setForm(createDefaultForm()); }} className="inline-flex h-12 w-full md:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 font-black text-slate-600 hover:bg-slate-200 transition-colors">
                <Eraser size={18} /> Hủy
              </button>
            )}
            <button type="submit" disabled={saveMutation.isPending} className="inline-flex h-12 w-full md:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 font-black text-white hover:bg-slate-800 disabled:opacity-60 transition shadow-lg shadow-slate-900/20">
              <Save size={18} /> {editingId ? 'Cập nhật' : 'Lưu ghi đè'}
            </button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[32px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner message="Không tải được danh sách ghi đè tiện ích." onRetry={refetch} />
      ) : overrides.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-xl font-black text-slate-900">Chưa có ghi đè nào</p>
          <p className="mt-2 text-sm text-slate-500">
            Nếu cần sửa riêng cho một kỳ hóa đơn, hãy chọn hợp đồng, nhập đúng trường cần thay đổi rồi lưu.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr_120px] gap-4 border-b border-slate-100 bg-slate-50/80 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <span>Hợp đồng & Lý do</span>
            <span>Kỳ hóa đơn</span>
            <span>Tiền điện</span>
            <span>Tiền nước</span>
            <span>Ngày tạo</span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="divide-y divide-slate-100">
            {overrides.map((override) => (
              <div key={override.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr_120px] gap-4 px-8 py-6 text-sm transition-colors hover:bg-slate-50/50">
                <div className="space-y-1.5">
                  <p className="font-black text-slate-900 text-base">{override.contractCode}</p>
                  <div className="flex items-center gap-2">
                     <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{override.roomCode}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-1" title={override.reason}>{override.reason}</p>
                </div>
                <div>
                  <span className="inline-flex items-center rounded-xl bg-indigo-50 px-3 py-1 font-bold text-indigo-700" style={numericStyle}>
                    {formatUtilityBillingPeriod(override.billingPeriod)}
                  </span>
                </div>
                <div className="space-y-1" style={numericStyle}>
                  {override.electricFinalOverride != null
                    ? <span className="inline-block rounded-md bg-rose-50 px-2 py-1 font-black text-rose-700">Chốt {formatVND(override.electricFinalOverride)}</span>
                    : override.electricBaseOverride != null
                      ? <span className="inline-block rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">Cơ sở {formatVND(override.electricBaseOverride)}</span>
                      : <span className="text-slate-400 text-xs font-medium">Theo chính sách</span>}
                </div>
                <div className="space-y-1" style={numericStyle}>
                  {override.waterFinalOverride != null
                    ? <span className="inline-block rounded-md bg-rose-50 px-2 py-1 font-black text-rose-700">Chốt {formatVND(override.waterFinalOverride)}</span>
                    : override.waterBaseOverride != null
                      ? <span className="inline-block rounded-md bg-blue-50 px-2 py-1 font-bold text-blue-700">Cơ sở {formatVND(override.waterBaseOverride)}</span>
                      : <span className="text-slate-400 text-xs font-medium">Theo chính sách</span>}
                </div>
                <div className="text-xs font-medium text-slate-400" style={numericStyle}>
                  <div className="flex items-center gap-1.5 opacity-80 mb-1">
                    <CalendarRange size={12} /> Tạo ngày
                  </div>
                  <div className="font-bold text-slate-600">{formatUtilityDateTime(override.createdAt)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => startEdit(override.id)}
                    className="w-full rounded-xl bg-slate-900 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(override.id)}
                    className="w-full rounded-xl bg-rose-50 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
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
