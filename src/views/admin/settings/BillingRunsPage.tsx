import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileWarning,
  Loader2,
  Play,
  RefreshCcw,
  SearchCheck,
  ShieldAlert,
  History,
  LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';
import {
  formatUtilityBillingPeriod,
  formatUtilityDateTime,
  getUtilityRunStatusLabel,
} from '@/lib/utilityPresentation';
import utilityAdminService from '@/services/utilityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';

const pageFontStyle: React.CSSProperties = {
  fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
};

const numericStyle: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", "JetBrains Mono", monospace',
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum"',
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalMonth(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

function getDefaultBillingPeriod() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return formatLocalMonth(date);
}

function getDefaultDueDate(billingPeriod: string) {
  const [year, month] = billingPeriod.split('-').map(Number);
  return formatLocalDate(new Date(year, month, 10));
}

function getBillingPeriodBounds(billingPeriod: string) {
  const [year, month] = billingPeriod.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end),
    endDate: end,
  };
}

function getDueDatePresets(billingPeriod: string) {
  const { endDate } = getBillingPeriodBounds(billingPeriod);
  return [7, 10, 15].map((offset) => {
    const next = new Date(endDate);
    next.setDate(endDate.getDate() + offset);
    return {
      label: `+${offset} ngày`,
      value: formatLocalDate(next),
    };
  });
}

function getDateGapInDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function getBillingRunStatusMeta(status: string) {
  switch (status.toLowerCase()) {
    case 'draft':
      return {
        label: getUtilityRunStatusLabel(status),
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    case 'running':
      return {
        label: getUtilityRunStatusLabel(status),
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'completed':
      return {
        label: getUtilityRunStatusLabel(status),
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'failed':
      return {
        label: getUtilityRunStatusLabel(status),
        className: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'cancelled':
      return {
        label: getUtilityRunStatusLabel(status),
        className: 'bg-slate-200 text-slate-700 border-slate-300',
      };
    default:
      return {
        label: getUtilityRunStatusLabel(status),
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

function getRunSummaryNumber(summary: Record<string, unknown>, key: string) {
  return Number(summary[key] ?? 0);
}

function isPreviewReady(eligibleContracts: Array<{ contractId: number; contractCode: string }>) {
  return eligibleContracts.length > 0;
}

function getBillingPreviewGuidance(error: Error | null) {
  const message = error?.message ?? '';
  if (message.includes('401') || message.toLowerCase().includes('xac thuc') || message.toLowerCase().includes('xác thực')) {
    return [
      'Supabase đang từ chối xác thực khi gọi đợt xuất hóa đơn tiện ích.',
      'Nếu bạn vẫn đang ở trang quản trị thì đây là lỗi quyền hoặc cấu hình hàm xử lý ở Supabase, không phải do bạn chọn sai tháng hay ngày.',
      'Hãy kiểm tra quyền truy cập và cấu hình hàm xử lý trước khi chạy lại.',
    ];
  }

  return [
    'Hệ thống chưa thể kiểm tra kỳ tính tiền này.',
    'Hãy đối chiếu kỳ hóa đơn, hạn thanh toán và dữ liệu hợp đồng hiện có trước khi thử lại.',
  ];
}

export default function BillingRunsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'control' | 'history'>('control');
  const [billingPeriod, setBillingPeriod] = useState(getDefaultBillingPeriod);
  const [dueDate, setDueDate] = useState(() => getDefaultDueDate(getDefaultBillingPeriod()));
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  const runsQuery = useQuery({
    queryKey: ['billing-runs'],
    queryFn: () => utilityAdminService.listBillingRuns(),
  });

  const previewQuery = useQuery({
    queryKey: ['billing-run-preview', billingPeriod, dueDate],
    queryFn: () => utilityAdminService.previewBillingRun(billingPeriod, dueDate),
    enabled: false,
    retry: false,
  });

  const snapshotsQuery = useQuery({
    queryKey: ['billing-run-snapshots', selectedRunId],
    queryFn: () => utilityAdminService.listBillingRunSnapshots(selectedRunId as number),
    enabled: selectedRunId != null,
  });

  useEffect(() => {
    if (!selectedRunId && runsQuery.data && runsQuery.data.length > 0) {
      setSelectedRunId(runsQuery.data[0].id);
    }
  }, [runsQuery.data, selectedRunId]);

  const runMutation = useMutation({
    mutationFn: () => utilityAdminService.startBillingRun(billingPeriod, dueDate),
    onSuccess: async (result) => {
      toast.success(
        `${formatUtilityBillingPeriod(result.billingPeriod)}: đã tạo ${result.createdInvoices} hóa đơn, bỏ qua ${result.skippedInvoices} hợp đồng.`,
      );
      setSelectedRunId(result.billingRunId ?? null);
      setActiveTab('history');
      await queryClient.invalidateQueries({ queryKey: ['billing-runs'] });
      await queryClient.invalidateQueries({ queryKey: ['billing-run-snapshots'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể chạy quy trình tính tiền.');
    },
  });

  const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);
  const preview = previewQuery.data;
  const snapshots = snapshotsQuery.data ?? [];
  const currentRun = useMemo(() => runs.find((run) => run.id === selectedRunId) ?? null, [runs, selectedRunId]);
  const dueDatePresets = useMemo(() => getDueDatePresets(billingPeriod), [billingPeriod]);
  const billingPeriodBounds = useMemo(() => getBillingPeriodBounds(billingPeriod), [billingPeriod]);
  const dueDateGapDays = useMemo(() => getDateGapInDays(billingPeriodBounds.end, dueDate), [billingPeriodBounds.end, dueDate]);

  const canSubmit = billingPeriod.length === 7 && dueDate.length === 10;
  const previewReady = preview ? isPreviewReady(preview.eligibleContracts) : false;
  const isDueDateBeforePeriodEnd = canSubmit && dueDate < billingPeriodBounds.end;
  const currentRunSkippedContracts = Array.isArray((currentRun?.summary as { skippedContracts?: unknown[]; ineligibleContracts?: unknown[] } | undefined)?.skippedContracts)
    ? ((currentRun?.summary as { skippedContracts?: Array<{ contractCode: string; reason: string }> }).skippedContracts ?? [])
    : Array.isArray((currentRun?.summary as { ineligibleContracts?: unknown[] } | undefined)?.ineligibleContracts)
      ? ((currentRun?.summary as { ineligibleContracts?: Array<{ contractCode: string; reason: string }> }).ineligibleContracts ?? [])
      : [];
  const currentRunExistingInvoiceContracts = Array.isArray((currentRun?.summary as { existingInvoiceContracts?: unknown[] } | undefined)?.existingInvoiceContracts)
    ? ((currentRun?.summary as { existingInvoiceContracts?: Array<{ contractCode: string }> }).existingInvoiceContracts ?? [])
    : [];
  const currentRunFailures = Array.isArray((currentRun?.error as { failures?: unknown[] } | undefined)?.failures)
    ? ((currentRun?.error as { failures?: Array<{ contractCode: string; message: string }> }).failures ?? [])
    : [];

  return (
    <div className="w-full min-w-0 space-y-8 pb-20" style={pageFontStyle}>
      {/* HEADER SECTION */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#1f2937_100%)] p-8 text-white shadow-2xl shadow-slate-900/10 transition-all duration-500 hover:shadow-slate-900/20">
        <div className="grid gap-8 xl:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100 backdrop-blur-md">
              <CalendarClock size={14} />
              Quản lý kỳ tính tiền
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white md:text-5xl">
              Điều khiển đợt xuất hóa đơn tiện ích
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-300 md:text-base">
              Luôn xem trước trước khi chạy. Hệ thống sẽ lọc đúng hợp đồng giao kỳ, đang dùng tiện ích theo chính sách, có số người tính phí hợp lệ
              và chưa có hóa đơn của cùng kỳ.
            </p>
          </div>

          <div className="flex w-full min-w-[200px] flex-col justify-center space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Tổng đợt chạy</p>
              <p className="mt-1 text-4xl font-black text-white" style={numericStyle}>
                {runs.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-2 overflow-x-auto rounded-3xl bg-slate-900/5 p-1.5 shadow-inner backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('control')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] px-6 py-3.5 text-sm font-bold transition-all duration-300 md:flex-none ${
            activeTab === 'control'
              ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard size={18} />
          Bảng điều khiển
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[20px] px-6 py-3.5 text-sm font-bold transition-all duration-300 md:flex-none ${
            activeTab === 'history'
              ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
          }`}
        >
          <History size={18} />
          Lịch sử và chi tiết
        </button>
      </div>

      {/* TAB CONTENT: BẢNG ĐIỀU KHIỂN */}
      {activeTab === 'control' && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Thiết lập kỳ tính tiền</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">Bảng điều khiển chạy hóa đơn</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Hãy xem trước để biết hợp đồng nào được tạo hóa đơn, hợp đồng nào bị loại và xác nhận dữ liệu trước khi chạy thực tế.
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Bước 1</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chọn đúng kỳ hóa đơn và hạn thanh toán. Kỳ hóa đơn là tháng phát sinh tiền điện nước, không phải tháng bạn bấm chạy.
                </p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Bước 2</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bấm <span className="font-black text-slate-900">Xem trước</span> để kiểm tra 5 điều kiện: hợp đồng còn hiệu lực, không bị xóa,
                  giao đúng kỳ, đang dùng chế độ tính theo chính sách và có số người tính phí lớn hơn 0.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Bước 3</p>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  Chỉ bấm <span className="font-black">Bắt đầu chạy hóa đơn</span> khi danh sách “Có thể tạo mới” đúng như mong muốn.
                  Hóa đơn đã có từ trước sẽ tự bị bỏ qua.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Tháng tính tiền</span>
                <input
                  type="month"
                  className="input-base h-12 w-full rounded-2xl border-slate-200 bg-slate-50"
                  style={numericStyle}
                  value={billingPeriod}
                  onChange={(event) => {
                    const nextPeriod = event.target.value;
                    setBillingPeriod(nextPeriod);
                    setDueDate(getDefaultDueDate(nextPeriod));
                  }}
                />
                <p className="text-xs font-medium text-slate-500">Tháng phát sinh tiền điện nước.</p>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hạn thanh toán</span>
                <input
                  type="date"
                  className="input-base h-12 w-full rounded-2xl border-slate-200 bg-slate-50"
                  style={numericStyle}
                  value={dueDate}
                  min={billingPeriodBounds.end}
                  onChange={(event) => setDueDate(event.target.value)}
                />
                <p className="text-xs font-medium text-slate-500">Ngày yêu cầu thanh toán hóa đơn.</p>
              </label>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs font-bold uppercase tracking-wider text-slate-500">Góp ý hạn thanh toán:</span>
                {dueDatePresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDueDate(preset.value)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.16em] transition-all duration-300 ${
                      dueDate === preset.value
                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-4 text-sm font-medium text-slate-600 md:grid-cols-3">
                <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400">Kỳ hóa đơn</span>
                    <span className="mt-1 block font-bold text-slate-800">{billingPeriodBounds.start} - {billingPeriodBounds.end}</span>
                  </div>
                <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Giãn cách từ cuối kỳ</span>
                  <span className="mt-1 block font-bold text-slate-800">{Number.isFinite(dueDateGapDays) ? `${dueDateGapDays} ngày` : '-'}</span>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">Tình trạng hạn thanh toán</span>
                  <span className={`mt-1 block font-bold ${isDueDateBeforePeriodEnd ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isDueDateBeforePeriodEnd ? 'Hạn quá sớm, cần kiểm tra.' : 'Hạn hợp lệ sau kỳ tính.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <button
                onClick={() => previewQuery.refetch()}
                disabled={!canSubmit || previewQuery.isFetching}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-900 bg-white px-5 font-black text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {previewQuery.isFetching ? <Loader2 size={18} className="animate-spin" /> : <SearchCheck size={18} />}
                {previewQuery.isFetching ? 'Đang kiểm tra...' : 'Xem trước đợt chạy'}
              </button>

              <button
                onClick={() => runMutation.mutate()}
                disabled={!canSubmit || runMutation.isPending || !previewReady}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-black text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                {runMutation.isPending ? 'Đang xuất hóa đơn...' : 'Bắt đầu chạy hóa đơn'}
              </button>
            </div>

            {previewQuery.isError && (
              <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-5">
                <ErrorBanner
                  message={previewQuery.error instanceof Error ? previewQuery.error.message : 'Không thể xem trước do lỗi kết nối máy chủ.'}
                  onRetry={() => previewQuery.refetch()}
                />
                <div className="mt-3 space-y-2 text-sm text-rose-900">
                  {getBillingPreviewGuidance(previewQuery.error instanceof Error ? previewQuery.error : null).map((line) => (
                    <p key={line}>• {line}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Hợp đồng hiệu lực</p>
                <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                  {preview?.totalContracts ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Đúng chế độ chính sách</p>
                <p className="mt-3 text-3xl font-black text-emerald-600" style={numericStyle}>
                  {preview?.validContracts ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Đã có hóa đơn</p>
                <p className="mt-3 text-3xl font-black text-sky-600" style={numericStyle}>
                  {preview?.existingInvoices ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 hover:bg-slate-100 transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Có thể tạo mới</p>
                <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                  {preview?.eligibleContracts.length ?? 0}
                </p>
              </div>
            </div>

            {preview && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Chẩn đoán kỳ hóa đơn</p>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    <span className="font-bold text-slate-900">{preview.diagnostics.totalContracts}</span> hợp đồng giao kỳ, 
                    <span className="font-bold text-slate-900 ml-1">{preview.diagnostics.validContracts}</span> hợp đồng đang dùng tiện ích theo chính sách.
                  </p>
                  <p className="mt-2 bg-slate-50 p-2 rounded-lg text-xs font-medium text-slate-500">
                    Từ {formatDate(preview.diagnostics.billingPeriodStart)} đến {formatDate(preview.diagnostics.billingPeriodEnd)}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Bị loại khỏi đợt chạy</p>
                  <p className="mt-3 text-3xl font-black text-amber-700" style={numericStyle}>
                    {preview.diagnostics.skippedContracts}
                  </p>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Đã xuất hóa đơn</p>
                  <p className="mt-3 text-3xl font-black text-sky-700" style={numericStyle}>
                    {preview.diagnostics.existingInvoiceContracts}
                  </p>
                </div>
              </div>
            )}

            {preview?.existingInvoiceContracts.length ? (
              <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Đã có hóa đơn từ trước</p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Các hợp đồng sau đã có hóa đơn của {formatUtilityBillingPeriod(preview.billingPeriod)}, nên hệ thống sẽ tự bỏ qua khi bạn bấm chạy.
                    </p>
                  </div>
                  <p className="text-2xl font-black text-sky-900" style={numericStyle}>
                    {preview.existingInvoiceContracts.length}
                  </p>
                </div>
                <div className="mt-4 flex max-h-40 flex-wrap gap-2 overflow-auto">
                  {preview.existingInvoiceContracts.map((contract) => (
                    <span
                      key={contract.contractId}
                      className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-sky-700 shadow-sm"
                    >
                      {contract.contractCode}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Phân loại dữ liệu trước khi chạy</p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">Chi tiết hợp đồng để xuất hóa đơn</h3>
                </div>
                {preview ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-sm ${
                      previewReady
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                        : 'border-amber-200 bg-amber-100 text-amber-800'
                    }`}
                  >
                    {previewReady ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                    {previewReady ? 'Sẵn sàng chạy' : 'Chưa có hợp đồng đủ điều kiện'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500 shadow-sm">
                    <Clock3 size={16} />
                    Vui lòng bấm Xem trước
                  </span>
                )}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Có thể tạo mới</p>
                  <div className="mt-4 flex max-h-56 flex-wrap gap-2 overflow-auto">
                    {preview?.eligibleContracts.length ? (
                      preview.eligibleContracts.map((contract) => (
                        <span
                          key={contract.contractId}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 shadow-sm"
                        >
                          {contract.contractCode}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-slate-500 w-full text-center py-4 bg-slate-50 rounded-xl">Chưa có thông tin. Bấm “Xem trước đợt chạy” để kiểm tra.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Bị loại khỏi đợt chạy</p>
                  <div className="mt-4 max-h-56 space-y-3 overflow-auto">
                    {preview?.ineligibleContracts.length ? (
                      preview.ineligibleContracts.map((contract) => (
                        <div key={contract.contractId} className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 shadow-sm">
                          <p className="font-black text-rose-900">{contract.contractCode}</p>
                          <p className="mt-1 text-sm font-medium leading-5 text-rose-700">{contract.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-slate-500 w-full text-center py-4 bg-slate-50 rounded-xl">Không có hợp đồng nào bị loại khỏi đợt chạy.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB CONTENT: LỊCH SỬ CHẠY */}
      {activeTab === 'history' && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lịch sử đợt chạy</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">Danh sách các đợt đã xử lý</h2>
              </div>
              <button
                onClick={() => runsQuery.refetch()}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <RefreshCcw size={16} />
                Tải lại
              </button>
            </div>

            <div className="mt-6">
              {runsQuery.isLoading ? (
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-[24px] bg-slate-100" />
                  ))}
                </div>
              ) : runsQuery.isError ? (
                <ErrorBanner message="Không tải được lịch sử quá trình chạy hóa đơn." onRetry={() => runsQuery.refetch()} />
              ) : runs.length === 0 ? (
                <div className="rounded-[28px] border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <Play size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-xl font-black text-slate-900">Chưa có đợt cập nhật nào</p>
                  <p className="mt-2 text-sm font-medium text-slate-500 max-w-sm mx-auto">Hãy quay lại bảng điều khiển, xem trước dữ liệu rồi chạy đợt xuất hóa đơn tiện ích đầu tiên.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {runs.map((run) => {
                    const statusMeta = getBillingRunStatusMeta(run.status);
                    return (
                      <button
                        key={run.id}
                        onClick={() => setSelectedRunId(run.id)}
                        className={`group relative w-full rounded-[24px] border p-5 text-left transition-all duration-300 ${
                          selectedRunId === run.id
                            ? 'border-emerald-400 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                        }`}
                      >
                        <div className="absolute top-4 right-4">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Đợt #{run.id}</p>
                        <p className="text-2xl font-black text-slate-900 mb-4" style={numericStyle}>
                          {formatUtilityBillingPeriod(run.billingPeriod)}
                        </p>
                        <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-3 border border-slate-100 shadow-sm mb-4">
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tạo</p>
                            <p className="font-black text-emerald-600">{getRunSummaryNumber(run.summary, 'createdInvoices')}</p>
                          </div>
                          <div className="text-center border-l border-r border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Bỏ qua</p>
                            <p className="font-black text-amber-600">{getRunSummaryNumber(run.summary, 'skippedInvoices')}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Lỗi</p>
                            <p className="font-black text-rose-600">{getRunSummaryNumber(run.summary, 'failedInvoices')}</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500" style={numericStyle}>
                          <span>Hoàn thành: {formatUtilityDateTime(run.completedAt)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {currentRun && (
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 animate-in fade-in duration-500 zoom-in-95">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-slate-900 flex items-center gap-3">
                    Chi tiết đợt #{currentRun.id}
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600" style={numericStyle}>
                      {formatUtilityBillingPeriod(currentRun.billingPeriod)}
                    </span>
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-500">Kết quả chi tiết của từng hợp đồng được xem xét trong đợt chạy này.</p>
                </div>
                <button
                  onClick={() => snapshotsQuery.refetch()}
                  disabled={snapshotsQuery.isFetching}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
                >
                  {snapshotsQuery.isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                  Tải lại chi tiết
                </button>
              </div>

              {/* Failures & skips */}
              {(currentRunSkippedContracts.length > 0 || currentRunExistingInvoiceContracts.length > 0 || currentRunFailures.length > 0) && (
                <div className="mb-6 grid gap-4 lg:grid-cols-2">
                  {currentRunFailures.length > 0 && (
                    <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 col-span-full">
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-rose-700">
                        <AlertTriangle size={16} /> Hợp đồng bị lỗi khi chạy
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {currentRunFailures.map((failure, index) => (
                          <div key={`${failure.contractCode}-${index}`} className="rounded-xl border border-rose-100 bg-white p-3 shadow-sm">
                            <p className="font-black text-rose-900">{failure.contractCode}</p>
                            <p className="text-xs font-medium text-rose-600 mt-1">{failure.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentRunSkippedContracts.length > 0 && (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-800">
                        <FileWarning size={16} /> Bỏ qua do dữ liệu
                      </div>
                      <div className="mt-4 max-h-60 space-y-2 overflow-auto">
                        {currentRunSkippedContracts.map((contract, index) => (
                          <div key={`${contract.contractCode}-${index}`} className="rounded-xl border border-amber-100 bg-white p-3 shadow-sm">
                            <p className="font-black text-amber-900">{contract.contractCode}</p>
                            <p className="text-xs font-medium text-amber-700 mt-1">{contract.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentRunExistingInvoiceContracts.length > 0 && (
                    <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5">
                      <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-sky-800">
                        <Clock3 size={16} /> Đã có Hóa đơn từ trước
                      </div>
                      <div className="mt-4 flex max-h-60 flex-wrap gap-2 overflow-auto">
                        {currentRunExistingInvoiceContracts.map((contract, index) => (
                          <span key={`${contract.contractCode}-${index}`} className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-black uppercase text-sky-700 shadow-sm">
                            {contract.contractCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Table details */}
              <div className="overflow-hidden rounded-[24px] border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                        <th className="px-5 py-4">Mã hợp đồng</th>
                        <th className="px-5 py-4 text-center">Phòng</th>
                        <th className="px-5 py-4 text-right">Tiền điện</th>
                        <th className="px-5 py-4 text-right">Tiền nước</th>
                        <th className="px-5 py-4 text-center">Người (Thực tế)</th>
                        <th className="px-5 py-4">Khoản áp dụng</th>
                        <th className="px-5 py-4">Lưu ý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-sm">
                      {snapshotsQuery.isLoading ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center">
                            <Loader2 className="mx-auto text-slate-300 animate-spin mb-2" size={24} />
                            <span className="text-slate-500 font-medium">Đang tải dữ liệu chi tiết...</span>
                          </td>
                        </tr>
                      ) : snapshots.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center">
                            <span className="text-slate-500 font-medium">Không có dữ liệu chi tiết nào cho đợt chạy này.</span>
                          </td>
                        </tr>
                      ) : (
                        snapshots.map((snapshot) => (
                          <tr key={snapshot.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4 font-black text-slate-900">{snapshot.contractCode}</td>
                            <td className="px-5 py-4 font-bold text-slate-600 text-center">{snapshot.roomCode}</td>
                            <td className="px-5 py-4 font-bold text-emerald-700 text-right" style={numericStyle}>
                              {formatVND(snapshot.electricFinalAmount)}
                            </td>
                            <td className="px-5 py-4 font-bold text-blue-700 text-right" style={numericStyle}>
                              {formatVND(snapshot.waterFinalAmount)}
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-600 text-center" style={numericStyle}>
                              {snapshot.occupantsForBilling}
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
                                {snapshot.policySourceLabel}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {snapshot.warnings.length === 0 ? (
                                  <span className="text-xs text-slate-400 italic">Không có</span>
                                ) : (
                                  snapshot.warnings.map((warning) => (
                                    <span
                                      key={`${snapshot.id}-${warning.code}`}
                                      className="rounded bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 border border-amber-200"
                                      title={warning.message}
                                    >
                                      {warning.label}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
