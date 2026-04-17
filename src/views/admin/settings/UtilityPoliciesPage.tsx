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
    effectiveTo: null,
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
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Vui lòng nhập đầy đủ mã và tên chính sách.');
      return;
    }
    if (form.scopeType !== 'system' && !form.scopeId) {
      toast.error('Chính sách theo phạm vi này yêu cầu chọn đối tượng áp dụng cụ thể.');
      return;
    }
    if (form.locationMultiplier <= 0 || form.electricHotSeasonMultiplier <= 0) {
      toast.error('Các hệ số (Multiplier) phải lớn hơn 0.');
      return;
    }
    if (form.roundingIncrement <= 0) {
      toast.error('Bước làm tròn phải lớn hơn 0.');
      return;
    }
    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      toast.error('Ngày kết thúc không được nhỏ hơn ngày hiệu lực khởi điểm.');
      return;
    }
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
        <form onSubmit={handleSubmit} className="space-y-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-600 border-b border-slate-100 pb-4">
            <ShieldCheck size={18} />
            Cấu hình Chính sách Tiện ích mới
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">1. Thông Tin Chung & Phạm Vi</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Phạm vi áp dụng</span>
                <p className="text-[10px] text-slate-500 mb-1">Mức độ ưu tiên: Hợp đồng &gt; Phòng &gt; Tòa nhà &gt; Hệ thống.</p>
                <select className="input-base w-full bg-white" value={form.scopeType} onChange={(event) => updateScopeType(event.target.value as UtilityScopeType)}>
                  <option value="system">Hệ thống (Mặc định cho tất cả nếu không có policy riêng)</option>
                  <option value="building">Cấp Tòa nhà</option>
                  <option value="room">Cấp Phòng</option>
                  <option value="contract">Cấp Hợp đồng (Ghi đè cao nhất)</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Đối tượng cụ thể</span>
                <p className="text-[10px] text-slate-500 mb-1">Chọn ID tương ứng với Phạm vi. (Để trống nếu là Hệ thống).</p>
                <select className="input-base w-full bg-white disabled:bg-slate-100 disabled:opacity-60" value={form.scopeId ?? ''} onChange={(event) => setForm((current) => ({ ...current, scopeId: event.target.value ? Number(event.target.value) : null }))} disabled={form.scopeType === 'system'}>
                  <option value="">{form.scopeType === 'system' ? 'Không yêu cầu' : 'Chọn đối tượng'}</option>
                  {currentScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Ngày hiệu lực</span>
                <p className="text-[10px] text-slate-500 mb-1">Ngày bắt đầu áp dụng policy này.</p>
                <input type="date" className="input-base w-full bg-white" style={numericStyle} value={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveFrom: event.target.value }))} required />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Ngày kết thúc</span>
                <p className="text-[10px] text-slate-500 mb-1">Để trống nếu áp dụng vô thời hạn.</p>
                <input type="date" className="input-base w-full bg-white" style={numericStyle} value={form.effectiveTo ?? ''} min={form.effectiveFrom} onChange={(event) => setForm((current) => ({ ...current, effectiveTo: event.target.value || null }))} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Mã định danh</span>
                <p className="text-[10px] text-slate-500 mb-1">VD: SYS-DEFAULT, R101-VIP, BLD-A</p>
                <input className="input-base w-full bg-white" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="Nhập mã duy nhất" required />
              </label>
              <label className="space-y-2 xl:col-span-3">
                <span className="text-xs font-bold text-slate-600">Tên chính sách & Ghi chú</span>
                <p className="text-[10px] text-slate-500 mb-1">Tên dễ hiểu (VD: Chuẩn hệ thống, Điện phòng cao cấp) và Ghi chú thêm lý do tạo.</p>
                <div className="flex gap-2">
                  <input className="input-base w-1/3 bg-white" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nhập tên hiển thị" required />
                  <input className="input-base flex-1 bg-white" value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả chi tiết" />
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-6 block">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">2. Đơn Giá Cơ Sở & Cấu Hình Làm Tròn</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Giá Điện cơ bản (đ)</span>
                <p className="text-[10px] text-slate-500 mb-1">Mức phí điện cơ bản hàng tháng. VD: 200,000</p>
                <input type="number" min={0} className="input-base w-full bg-white text-emerald-700 font-bold" style={numericStyle} value={form.electricBaseAmount} onChange={(event) => setForm((current) => ({ ...current, electricBaseAmount: Number(event.target.value) }))} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Mức Điện tối thiểu (đ)</span>
                <p className="text-[10px] text-slate-500 mb-1">Nếu tổng tiền điện tính ra bé hơn số này, sẽ thu bằng mức tối thiểu này. VD: 100,000</p>
                <input type="number" min={0} className="input-base w-full bg-white text-emerald-700" style={numericStyle} value={form.minElectricFloor} onChange={(event) => setForm((current) => ({ ...current, minElectricFloor: Number(event.target.value) }))} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Giá Nước / Người (đ)</span>
                <p className="text-[10px] text-slate-500 mb-1">Phí nước tính trên MỘT người ở. VD: 50,000</p>
                <input type="number" min={0} className="input-base w-full bg-white text-blue-700 font-bold" style={numericStyle} value={form.waterPerPersonAmount} onChange={(event) => setForm((current) => ({ ...current, waterPerPersonAmount: Number(event.target.value) }))} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Giá Nước cố định / Phòng (đ)</span>
                <p className="text-[10px] text-slate-500 mb-1">Phí nước cố định thu theo phòng (Khoán). Nếu không thu, điền 0.</p>
                <input type="number" min={0} className="input-base w-full bg-white text-blue-700" style={numericStyle} value={form.waterBaseAmount} onChange={(event) => setForm((current) => ({ ...current, waterBaseAmount: Number(event.target.value) }))} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Mức Nước tối thiểu (đ)</span>
                <p className="text-[10px] text-slate-500 mb-1">Nếu tổng tiền nước tính ra bé hơn số này, sẽ thu bằng mức tối thiểu này. VD: 50,000</p>
                <input type="number" min={0} className="input-base w-full bg-white text-blue-700" style={numericStyle} value={form.minWaterFloor} onChange={(event) => setForm((current) => ({ ...current, minWaterFloor: Number(event.target.value) }))} />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-bold text-slate-600">Bước làm tròn hóa đơn</span>
                <p className="text-[10px] text-slate-500 mb-1">Làm tròn số tiền điện/nước cuối cùng. VD: 1000 (làm tròn tới hàng nghìn)</p>
                <input type="number" min={1} className="input-base w-full bg-white text-slate-700" style={numericStyle} value={form.roundingIncrement} onChange={(event) => setForm((current) => ({ ...current, roundingIncrement: Number(event.target.value) }))} />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-800 bg-slate-50 inline-block px-3 py-1 rounded-lg">3. Hệ Số Môi Trường & Thời Tiết</h3>
            <div className="grid gap-4 md:grid-cols-2 p-4 rounded-2xl border border-rose-100 bg-rose-50/30">
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-slate-600">Hệ số Mùa nóng (Điện)</span>
                    <p className="text-[10px] text-slate-500 mb-1">Nhân x lần vào các tháng nóng. VD: 1.15 (tăng 15%), 1.0 (không đổi)</p>
                    <input type="number" min={1} step="0.01" className="input-base w-full bg-white" style={numericStyle} value={form.electricHotSeasonMultiplier} onChange={(event) => setForm((current) => ({ ...current, electricHotSeasonMultiplier: Number(event.target.value) }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-bold text-slate-600">Hệ số Vị trí (Điện & Nước)</span>
                    <p className="text-[10px] text-slate-500 mb-1">Hệ số nhân theo vị trí/khu vực. VD: 1.2 (tăng 20%), 1.0 (không đổi)</p>
                    <input type="number" min={0.1} step="0.01" className="input-base w-full bg-white" style={numericStyle} value={form.locationMultiplier} onChange={(event) => setForm((current) => ({ ...current, locationMultiplier: Number(event.target.value) }))} />
                  </label>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-600">Tháng áp dụng mùa nóng</span>
                  <div className="flex flex-wrap gap-2">
                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((month) => {
                      const selected = form.seasonMonths.includes(month);
                      return (
                        <button key={month} type="button" onClick={() => setForm((current) => ({ ...current, seasonMonths: selected ? current.seasonMonths.filter((value) => value !== month) : [...current.seasonMonths, month].sort() }))}
                          className={`rounded-xl px-4 py-1.5 text-xs font-black tracking-[0.18em] transition-colors border ${selected ? 'bg-rose-500 border-rose-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`} style={numericStyle}>Tháng {month} </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 block">Phụ phí thiết bị (VND / Thiết bị)</span>
                <p className="text-[10px] text-slate-500 mb-2">Bật thiết bị và nhập số tiền (VD: Máy lạnh phụ thu 50,000đ/tháng). Phụ thu này sẽ được cộng vào Tiền điện cơ bản của phòng có thiết bị đó.</p>
                <div className="grid gap-3 grid-cols-2">
                  {form.adjustments.map((adjustment, index) => (
                    <div key={adjustment.deviceCode} className={`rounded-xl border p-3 flex flex-col gap-2 transition-colors ${adjustment.isActive ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black uppercase tracking-[0.1em] ${adjustment.isActive ? 'text-amber-700' : 'text-slate-400'}`}>{adjustment.deviceCode}</span>
                        <button type="button" onClick={() => setForm((current) => ({ ...current, adjustments: current.adjustments.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: !item.isActive } : item) }))} className="transition-transform active:scale-95">
                          {adjustment.isActive ? <ToggleRight size={24} className="text-amber-500" /> : <ToggleLeft size={24} className="text-slate-300" />}
                        </button>
                      </div>
                      {adjustment.isActive && (
                        <input type="number" min={0} className="input-base w-full bg-white h-8 text-sm px-2" style={numericStyle} value={adjustment.chargeAmount} onChange={(event) => setForm((current) => ({ ...current, adjustments: current.adjustments.map((item, itemIndex) => itemIndex === index ? { ...item, chargeAmount: Number(event.target.value) } : item) }))} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button type="submit" disabled={createMutation.isPending} className="inline-flex h-12 flex-1 md:flex-none items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 font-black text-white transition hover:bg-slate-800 disabled:opacity-60 shadow-lg shadow-slate-900/20">
              <Save size={18} />
              {createMutation.isPending ? 'Đang khởi tạo...' : 'Lưu Chính Sách'}
            </button>
            <div className="hidden md:block flex-1 rounded-2xl bg-amber-50 px-5 py-3 text-xs font-bold text-amber-800 leading-relaxed border border-amber-100">
              Chính sách hợp lệ phải có phạm vi áp dụng đúng cấp. Khi có nhiều chính sách, hệ thống sẽ ưu tiên: <strong>Hợp đồng {'>'} Phòng {'>'} Tòa nhà {'>'} Hệ thống</strong>.
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-[28px] border border-slate-100 bg-slate-50" />
      ) : isError ? (
        <ErrorBanner message="Không tải được danh sách chính sách tiện ích." onRetry={refetch} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {policies.map((policy) => (
            <article key={policy.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 transition-all hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-900/10">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${policy.scopeType === 'system' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Layers3 size={12} />
                      {getScopeLabel(policy.scopeType)}
                      {policy.scopeId != null ? <span style={numericStyle}>#{policy.scopeId}</span> : ''}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]" style={numericStyle}>{policy.code}</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-cyan-700 transition-colors">{policy.name}</h2>
                  {policy.description && <p className="text-sm font-medium text-slate-500 line-clamp-2">{policy.description}</p>}
                </div>

                <button
                  onClick={() => toggleMutation.mutate({ id: policy.id, isActive: !policy.isActive })}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-95 ${
                    policy.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {policy.isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
                </button>
              </div>

              <div className="mt-5 grid flex-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
                     <Zap size={14} /> Điện năng
                  </div>
                  <div className="space-y-1 mt-auto">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Cơ bản</span><span className="font-bold text-slate-800" style={numericStyle}>{formatVND(policy.electricBaseAmount)}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Sàn</span><span className="font-bold text-slate-800" style={numericStyle}>{formatVND(policy.minElectricFloor)}</span></div>
                    <div className="flex justify-between items-center text-sm pt-1 border-t border-emerald-100/50"><span className="text-slate-500 font-medium">Hệ số mùa nóng</span><span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md" style={numericStyle}>x{policy.electricHotSeasonMultiplier}</span></div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl bg-blue-50/50 border border-blue-100 p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                     Theo người / Phòng
                  </div>
                  <div className="space-y-1 mt-auto">
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Cố định phòng</span><span className="font-bold text-slate-800" style={numericStyle}>{formatVND(policy.waterBaseAmount)}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-slate-500 font-medium">Theo người</span><span className="font-bold text-slate-800" style={numericStyle}>{formatVND(policy.waterPerPersonAmount)}</span></div>
                    <div className="flex justify-between items-center text-sm pt-1 border-t border-blue-100/50"><span className="text-slate-500 font-medium">Mức sàn an toàn</span><span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md" style={numericStyle}>{formatVND(policy.minWaterFloor)}</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 shadow-sm" style={numericStyle}>
                    Tháng: <span className="text-slate-900">{policy.seasonMonths.join(', ')}</span>
                  </span>
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 shadow-sm" style={numericStyle}>
                    Hệ số vị trí: <span className="text-rose-600">x{policy.locationMultiplier}</span>
                  </span>
                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 shadow-sm" style={numericStyle}>
                    Làm tròn hóa đơn tới: <span className="text-indigo-600">{formatVND(policy.roundingIncrement)}</span>
                  </span>
                </div>

                {policy.adjustments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phụ phí thiết bị:</span>
                    {policy.adjustments.map((adjustment) => (
                      <span key={adjustment.deviceCode} className="rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-white" style={numericStyle}>
                        {adjustment.deviceCode}: {formatVND(adjustment.chargeAmount)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 border border-slate-100" style={numericStyle}>
                <Calendar size={14} className="text-slate-400" />
                <span>Hiệu lực từ <span className="text-slate-700">{formatDate(policy.effectiveFrom)}</span> {policy.effectiveTo ? <>đến <span className="text-slate-700">{formatDate(policy.effectiveTo)}</span></> : 'trở đi (Vô thời hạn)'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
