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
      <div className="space-y-4 border-b border-slate-100 pb-6 mb-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-rose-600 bg-rose-50 w-fit px-3 py-1.5 rounded-full">
          <PenSquare size={14} />
          Ghi đè thủ công theo kỳ hóa đơn
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-900">Quản Lý Ngoại Lệ Tiện Ích</h1>
        <p className="max-w-3xl text-sm font-medium text-slate-500 leading-relaxed">
          Sử dụng tính năng này khi cần đặc cách tính tiền điện/nước cho một hợp đồng trong <b>đúng một tháng duy nhất</b>. 
          Các thông số ghi đè sẽ thay thế giá trị từ chính sách gốc (Policy) tại thời điểm chốt hóa đơn.
        </p>

        <div className="grid gap-4 mt-6 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 mb-1">Base Override (Cơ bản)</p>
            <p className="text-[13px] font-medium text-slate-600 leading-snug">Chỉ thay đổi mức giá khởi điểm. Hệ thống vẫn tiếp tục áp các hệ số (vị trí, mùa nóng) và phụ thu thiết bị.</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 mb-1">Final Override (Tuyệt đối)</p>
            <p className="text-[13px] font-medium text-slate-600 leading-snug">Chốt cứng số tiền phải đóng. Bỏ qua hoàn toàn mọi hệ số và công thức tính toán của tháng đó.</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 mb-1">Quy tắc Resolve</p>
            <p className="text-[13px] font-medium text-slate-600 leading-snug">Khớp theo `Hợp đồng + Tháng`. Bạn có thể lập bảng ghi đè trước cả khi hệ thống tự động sinh hóa đơn (Billing Run).</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-600 border-b border-slate-100 pb-4">
          <PenSquare size={18} />
          {editingId ? 'Chỉnh sửa Ghi Đè' : 'Tạo Ghi Đè Mới'}
        </div>

        <div className="space-y-6 block">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">1. Thông tin Hợp đồng & Kỳ hóa đơn</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
            <label className="space-y-2 xl:col-span-2">
              <span className="text-xs font-bold text-slate-600">Chọn Hợp đồng</span>
              <p className="text-[10px] text-slate-500 mb-1">Hợp đồng sẽ được áp dụng ngoại lệ này.</p>
              <select className="input-base w-full bg-white font-bold text-slate-700" value={form.contractId || ''} onChange={(event) => setForm((current) => ({ ...current, contractId: Number(event.target.value) }))}>
                <option value="">-- Click để chọn hợp đồng --</option>
                {contractOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-600">Chu kỳ thanh toán</span>
              <p className="text-[10px] text-slate-500 mb-1">Tháng áp dụng ghi đè. VD: 2026-04</p>
              <input type="month" className="input-base w-full bg-white text-indigo-700 font-bold" style={numericStyle} value={form.billingPeriod} onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value }))} />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold text-slate-600">Lý do ghi đè</span>
              <p className="text-[10px] text-slate-500 mb-1">Ghi chú lại lý do để đối soát sau này.</p>
              <input className="input-base w-full bg-white" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} placeholder="VD: Khuyến mãi tân gia tháng đầu" required />
            </label>
          </div>
        </div>

        <div className="space-y-6 block">
          <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">2. Thông số Điện & Nước</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4 rounded-2xl bg-slate-50/50 border border-slate-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400 border-b border-slate-100 pb-2">Ngoại lệ Giá Cơ Bản (Base)</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Điện cơ bản mới (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Chỉ thay đổi mức giá điện cơ bản. Phụ thu, prorate vẫn tính. VD: 150000</p>
                  <input type="number" min={0} className="input-base w-full bg-white" style={numericStyle} placeholder="Theo Policy" value={form.electricBaseOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, electricBaseOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Nước cơ bản mới (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Chỉ thay đổi mức khoán nước của phòng. Phí theo người vẫn tính. VD: 0</p>
                  <input type="number" min={0} className="input-base w-full bg-white" style={numericStyle} placeholder="Theo Policy" value={form.waterBaseOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, waterBaseOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Số người ở thực tế</span>
                  <p className="text-[10px] text-slate-500 mb-1">Ghi đè số người tính phí nước cho tháng này. VD: 1</p>
                  <input type="number" min={0} className="input-base w-full bg-white" style={numericStyle} placeholder="Tự động tính" value={form.occupantsForBillingOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, occupantsForBillingOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Hệ số Mùa nóng mới</span>
                  <p className="text-[10px] text-slate-500 mb-1">Ghi đè hệ số nhân tháng nóng. VD: 1.0 (Bỏ mùa nóng)</p>
                  <input type="number" min={0.1} step="0.01" className="input-base w-full bg-white" style={numericStyle} placeholder="Theo Policy" value={form.electricHotSeasonMultiplierOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, electricHotSeasonMultiplierOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                 <label className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Hệ số Vị trí mới</span>
                  <p className="text-[10px] text-slate-500 mb-1">Ghi đè hệ số nhân vị trí. VD: 1.0</p>
                  <input type="number" min={0.1} step="0.01" className="input-base w-full bg-white" style={numericStyle} placeholder="Theo Policy" value={form.locationMultiplierOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, locationMultiplierOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl bg-rose-50/30 border border-rose-100 p-4">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-rose-500 border-b border-rose-100 pb-2">Ngoại lệ Tuyệt đối (Final)</div>
              <p className="text-[11px] text-slate-500">Cảnh báo: Khi nhập giá trị này, giá trị Final sẽ khóa cứng, bỏ qua mọi tính toán base, hệ số bên trái.</p>
              <div className="grid gap-4 sm:grid-cols-2 mt-2">
                <label className="space-y-2">
                  <span className="text-xs font-bold text-rose-800">Chốt TỔNG tiền ĐIỆN (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Thu chính xác con số này, không qua công thức. VD: Miễn phí điền 0, hoặc thu đúng 200000.</p>
                  <input type="number" min={0} className="input-base w-full bg-white border-rose-200 text-rose-700 font-bold focus:border-rose-400 focus:ring-rose-400/20" style={numericStyle} placeholder="Bỏ qua policy" value={form.electricFinalOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, electricFinalOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-bold text-rose-800">Chốt TỔNG tiền NƯỚC (đ)</span>
                  <p className="text-[10px] text-slate-500 mb-1">Thu chính xác con số này, không qua công thức. VD: Miễn phí điền 0, hoặc thu đúng 50000.</p>
                  <input type="number" min={0} className="input-base w-full bg-white border-rose-200 text-rose-700 font-bold focus:border-rose-400 focus:ring-rose-400/20" style={numericStyle} placeholder="Bỏ qua policy" value={form.waterFinalOverride ?? ''} onChange={(event) => setForm((current) => ({ ...current, waterFinalOverride: event.target.value === '' ? null : Number(event.target.value) }))} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 pt-4 border-t border-slate-100">
          <div className="flex-1 rounded-2xl bg-amber-50 px-5 py-3 text-xs font-bold text-amber-800 leading-relaxed border border-amber-100 w-full">
            Đang cấu hình ghi đè cho: <strong className="text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">{form.contractId ? selectedContractLabel : 'Chưa chọn'}</strong>
            <br />
            {usesElectricFinalOverride || usesWaterFinalOverride ? <span className="text-rose-600">Đang bật Final Override - Các giá trị cơ sở sẽ bị bỏ qua.</span> : 'Sử dụng Base Override - Công thức định giá vẫn sẽ kích hoạt.'}
            {' '}Mã thiết lập: [{form.contractId || 0} / {form.billingPeriod || '--'}]
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
            {editingId != null && (
              <button type="button" onClick={() => { setEditingId(null); setForm(createDefaultForm()); }} className="inline-flex h-12 w-full md:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 font-black text-slate-600 hover:bg-slate-200 transition-colors">
                <Eraser size={18} /> Hủy
              </button>
            )}
            <button type="submit" disabled={saveMutation.isPending} className="inline-flex h-12 w-full md:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 font-black text-white hover:bg-slate-800 disabled:opacity-60 transition shadow-lg shadow-slate-900/20">
              <Save size={18} /> {editingId ? 'Cập Nhật' : 'Lưu Ghi Đè'}
            </button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[32px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner message="Không tải được danh sách ghi đè tiện ích." onRetry={refetch} />
      ) : (
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr_120px] gap-4 border-b border-slate-100 bg-slate-50/80 px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <span>Hợp đồng & Lý do</span>
            <span>Kỳ Hóa Đơn</span>
            <span>Tiền Điện</span>
            <span>Tiền Nước</span>
            <span>Kỷ Lục</span>
            <span className="text-center">Thao tác</span>
          </div>
          <div className="divide-y divide-slate-100">
            {overrides.map((override) => (
              <div key={override.id} className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr_120px] gap-4 px-8 py-6 text-sm transition-colors hover:bg-slate-50/50">
                <div className="space-y-1.5">
                  <p className="font-black text-slate-900 text-base">{override.contractCode}</p>
                  <div className="flex items-center gap-2">
                     <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{override.roomCode}</span>
                     <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">ID: {override.contractId}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-2 line-clamp-1" title={override.reason}>{override.reason}</p>
                </div>
                <div>
                  <span className="inline-flex items-center rounded-xl bg-indigo-50 px-3 py-1 font-bold text-indigo-700" style={numericStyle}>
                    {override.billingPeriod}
                  </span>
                </div>
                <div className="space-y-1" style={numericStyle}>
                  {override.electricFinalOverride != null
                    ? <span className="inline-block rounded-md bg-rose-50 px-2 py-1 font-black text-rose-700">Final {formatVND(override.electricFinalOverride)}</span>
                    : override.electricBaseOverride != null
                      ? <span className="inline-block rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">Base {formatVND(override.electricBaseOverride)}</span>
                      : <span className="text-slate-400 text-xs font-medium">Policy</span>}
                </div>
                <div className="space-y-1" style={numericStyle}>
                  {override.waterFinalOverride != null
                    ? <span className="inline-block rounded-md bg-rose-50 px-2 py-1 font-black text-rose-700">Final {formatVND(override.waterFinalOverride)}</span>
                    : override.waterBaseOverride != null
                      ? <span className="inline-block rounded-md bg-blue-50 px-2 py-1 font-bold text-blue-700">Base {formatVND(override.waterBaseOverride)}</span>
                      : <span className="text-slate-400 text-xs font-medium">Policy</span>}
                </div>
                <div className="text-xs font-medium text-slate-400" style={numericStyle}>
                  <div className="flex items-center gap-1.5 opacity-80 mb-1">
                    <CalendarRange size={12} /> Tạo ngày
                  </div>
                  <div className="font-bold text-slate-600">{formatDate(override.createdAt)}</div>
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
