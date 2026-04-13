import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RefreshCcw,
  SearchCheck,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
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
      label: `+${offset} ngay`,
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
    case 'running':
      return {
        label: 'Dang chay',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'completed':
      return {
        label: 'Hoan thanh',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    case 'failed':
      return {
        label: 'That bai',
        className: 'bg-rose-100 text-rose-800 border-rose-200',
      };
    case 'cancelled':
      return {
        label: 'Da huy',
        className: 'bg-slate-200 text-slate-700 border-slate-300',
      };
    default:
      return {
        label: status,
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
  if (message.includes('401') || message.toLowerCase().includes('xac thuc')) {
    return [
      'Function utility billing dang bi tu choi xac thuc o phia Supabase.',
      'Neu ban van dang o trong trang admin thi day la loi auth/quyen cua edge function, khong phai do ban vua chon sai thang hay ngay.',
      'Man hinh nay se hien thong tin chan doan cu the thay vi chi bao dang nhap lai.',
    ];
  }

  return [
    'He thong chua the kiem tra ky tinh tien nay.',
    'Hay doi chieu thang billing, han thanh toan va du lieu hop dong hoa don hien co truoc khi thu lai.',
  ];
}

function getUserGuidance(error: Error | null) {
  const message = error?.message ?? '';
  if (message.includes('401') || message.toLowerCase().includes('xac thuc')) {
    return [
      'Function utility billing dang bi tu choi xac thuc o phia Supabase.',
      'Neu ban van dang o trong trang admin thi day la loi auth/quyen cua edge function, khong phai do ban vua chon sai thang hay ngay.',
    ];
  }
  if (message.includes('Phiên đăng nhập')) {
    return [
      'Phiên đăng nhập quản trị đang không hợp lệ để chạy tác vụ này.',
      'Hãy đăng xuất rồi đăng nhập lại, sau đó bấm “Xem trước kỳ tính tiền” thêm một lần.',
    ];
  }

  return [
    'Hệ thống chưa thể kiểm tra kỳ tính tiền này.',
    'Hãy kiểm tra lại tháng tính tiền, ngày đến hạn và dữ liệu hợp đồng trước khi thử lại.',
  ];
}

export default function BillingRunsPage() {
  const queryClient = useQueryClient();
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
      toast.success(`Ky ${result.billingPeriod}: tao ${result.createdInvoices}, bo qua ${result.skippedInvoices}.`);
      setSelectedRunId(result.billingRunId ?? null);
      await queryClient.invalidateQueries({ queryKey: ['billing-runs'] });
      await queryClient.invalidateQueries({ queryKey: ['billing-run-snapshots'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Khong the chay utility billing.');
    },
  });

  const runs = runsQuery.data ?? [];
  const preview = previewQuery.data;
  const snapshots = snapshotsQuery.data ?? [];
  const currentRun = useMemo(() => runs.find((run) => run.id === selectedRunId) ?? null, [runs, selectedRunId]);
  const dueDatePresets = useMemo(() => getDueDatePresets(billingPeriod), [billingPeriod]);
  const billingPeriodBounds = useMemo(() => getBillingPeriodBounds(billingPeriod), [billingPeriod]);
  const dueDateGapDays = useMemo(() => getDateGapInDays(billingPeriodBounds.end, dueDate), [billingPeriodBounds.end, dueDate]);

  const canSubmit = billingPeriod.length === 7 && dueDate.length === 10;
  const previewReady = preview ? isPreviewReady(preview.eligibleContracts) : false;
  const selectedRunStatus = currentRun ? getBillingRunStatusMeta(currentRun.status) : null;
  const isDueDateBeforePeriodEnd = canSubmit && dueDate < billingPeriodBounds.end;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 pb-20 md:px-6" style={pageFontStyle}>
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#111827_45%,_#1f2937_100%)] p-6 text-white shadow-2xl shadow-slate-900/10 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.26em] text-emerald-100">
              <CalendarClock size={14} />
              Utility Billing Control
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">
                Xem trước kỳ tính tiền, kiểm tra điều kiện, rồi mới tạo hóa đơn.
              </h1>
              <p className="max-w-3xl text-sm font-medium leading-6 text-slate-300 md:text-base">
                Đây là màn hình kiểm tra và chạy tiền điện nước theo chính sách chung của hệ thống. Hệ thống sẽ tự
                tìm đúng mức giá đang áp dụng, bỏ qua những hợp đồng không phù hợp với luồng này, rồi mới tạo hóa đơn.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Buoc 1</p>
                <p className="mt-2 text-lg font-black">Chọn kỳ + hạn thanh toán</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Buoc 2</p>
                <p className="mt-2 text-lg font-black">Xem trước danh sách hợp lệ</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Buoc 3</p>
                <p className="mt-2 text-lg font-black">Chạy tạo hóa đơn</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">Trạng thái hiện tại</p>
                <p className="mt-2 text-2xl font-black">Bộ điều khiển tiền điện nước</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/25 px-3 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Runs</p>
                <p className="text-2xl font-black" style={numericStyle}>
                  {runs.length}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm font-medium text-slate-200">
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3">
                Những hợp đồng đang tính điện nước theo công tơ riêng sẽ không được chạy ở màn hình này để tránh tính sai.
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3">
                Mỗi tháng chỉ có một lần chạy chính. Nếu chạy lại cùng tháng, hệ thống sẽ cập nhật theo cùng một đợt xử lý thay vì tạo lung tung nhiều bản.
              </div>
              <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 px-4 py-3">
                Nếu phiên đăng nhập hết hạn, màn hình sẽ yêu cầu bạn đăng nhập lại trước khi cho chạy tác vụ.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Thiết lập kỳ tính tiền</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">Bảng điều khiển</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Hãy xem trước để biết hợp đồng nào được tạo hóa đơn, hợp đồng nào bị loại và vì sao bị loại.
              </p>
            </div>
            <button
              onClick={() => runsQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <RefreshCcw size={16} />
              Tai lai lich su
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
              <p className="text-xs font-medium text-slate-500">Chọn tháng phát sinh tiền điện nước.</p>
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
              <p className="text-xs font-medium text-slate-500">Ngày khách cần thanh toán hóa đơn.</p>
            </label>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              {dueDatePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDueDate(preset.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] transition ${
                    dueDate === preset.value
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 text-sm font-medium text-slate-600 md:grid-cols-3">
              <p>Ky billing: {billingPeriodBounds.start} den {billingPeriodBounds.end}</p>
              <p>Han thanh toan cach cuoi ky: {Number.isFinite(dueDateGapDays) ? `${dueDateGapDays} ngay` : '-'}</p>
              <p>{isDueDateBeforePeriodEnd ? 'Han thanh toan dang nam trong ky billing, can kiem tra lai.' : 'Han thanh toan dang sau ngay chot ky.'}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <button
              onClick={() => previewQuery.refetch()}
              disabled={!canSubmit || previewQuery.isFetching}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-5 font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewQuery.isFetching ? <Loader2 size={16} className="animate-spin" /> : <SearchCheck size={16} />}
              {previewQuery.isFetching ? 'Đang kiểm tra...' : 'Xem trước kỳ tính tiền'}
            </button>

            <button
              onClick={() => runMutation.mutate()}
              disabled={!canSubmit || runMutation.isPending}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {runMutation.isPending ? 'Đang tạo hóa đơn...' : 'Chạy tạo hóa đơn'}
            </button>
          </div>

          {previewQuery.isError && (
            <div className="space-y-3 rounded-[24px] border border-rose-200 bg-rose-50 p-4">
              <ErrorBanner
                message={previewQuery.error instanceof Error ? previewQuery.error.message : 'Không thể kiểm tra kỳ tính tiền.'}
                onRetry={() => previewQuery.refetch()}
              />
              <div className="space-y-2 text-sm text-rose-900">
                {getBillingPreviewGuidance(previewQuery.error instanceof Error ? previewQuery.error : null).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tổng hợp đồng đang hiệu lực</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {preview?.totalContracts ?? 0}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hợp đồng áp dụng màn hình này</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {preview?.policyContracts ?? 0}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Đã có hóa đơn trong tháng</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {preview?.existingInvoices ?? 0}
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Có thể tạo mới</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {preview?.eligibleContracts.length ?? 0}
              </p>
            </div>
          </div>

          {preview && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Chan doan ky billing</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {preview.diagnostics.totalContracts} hop dong giao ky, {preview.diagnostics.policyContracts} hop dong theo luong utility policy.
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Ky duoc tinh tu {preview.diagnostics.billingPeriodStart} den {preview.diagnostics.billingPeriodEnd}.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Bi loai vi cong to</p>
                <p className="mt-2 text-2xl font-black text-slate-900" style={numericStyle}>
                  {preview.diagnostics.legacyMeteredContracts}
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Da co hoa don</p>
                <p className="mt-2 text-2xl font-black text-slate-900" style={numericStyle}>
                  {preview.diagnostics.existingInvoiceContracts}
                </p>
              </div>
            </div>
          )}

          {preview?.existingInvoiceContracts.length ? (
            <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Da ton tai hoa don trong ky</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Day la cac hop dong da co hoa don utility trong ky {preview.billingPeriod}, vi vay preview se bo qua khi tao moi.
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
                    className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-sky-700"
                  >
                    {contract.contractCode}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,0.02),_rgba(16,185,129,0.06))] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Kiểm tra trước khi chạy</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">Có nên bấm chạy không?</h3>
              </div>
              {preview ? (
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                    previewReady
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-800'
                  }`}
                >
                  {previewReady ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                  {previewReady ? 'Sẵn sàng tạo hóa đơn' : 'Chưa có hợp đồng nào để tạo'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                  <Clock3 size={14} />
                  Chưa kiểm tra
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[24px] border border-white/80 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hợp đồng đủ điều kiện</p>
                <div className="mt-3 flex max-h-56 flex-wrap gap-2 overflow-auto">
                  {preview?.eligibleContracts.length ? (
                    preview.eligibleContracts.map((contract) => (
                      <span
                        key={contract.contractId}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700"
                      >
                        {contract.contractCode}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-slate-500">Bấm xem trước để kiểm tra hợp đồng nào sẽ được tạo hóa đơn.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/80 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Hợp đồng chưa thể chạy ở đây</p>
                <div className="mt-3 max-h-56 space-y-2 overflow-auto">
                  {preview?.ineligibleContracts.length ? (
                    preview.ineligibleContracts.map((contract) => (
                      <div key={contract.contractId} className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3">
                        <p className="font-black text-slate-900">{contract.contractCode}</p>
                        <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{contract.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-slate-500">
                      Hiện chưa có hợp đồng nào bị loại khỏi đợt xử lý này.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Lịch sử chạy</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">Các đợt đã xử lý</h2>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Selected</p>
              <p className="text-lg font-black text-slate-900" style={numericStyle}>
                {currentRun?.id ?? '-'}
              </p>
            </div>
          </div>

          {runsQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-[28px] bg-slate-100" />
          ) : runsQuery.isError ? (
            <ErrorBanner message="Khong tai duoc billing runs." onRetry={() => runsQuery.refetch()} />
          ) : runs.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-lg font-black text-slate-900">Chưa có đợt xử lý nào.</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Hãy xem trước rồi chạy tháng đầu tiên để hệ thống bắt đầu ghi nhận lịch sử.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => {
                const statusMeta = getBillingRunStatusMeta(run.status);
                return (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition ${
                      selectedRunId === run.id
                        ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-900/5'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-black text-slate-900" style={numericStyle}>
                            {run.billingPeriod}
                          </p>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${statusMeta.className}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                          Đã tạo {getRunSummaryNumber(run.summary, 'createdInvoices')} hóa đơn, bỏ qua{' '}
                          {getRunSummaryNumber(run.summary, 'skippedInvoices')}, lỗi{' '}
                          {getRunSummaryNumber(run.summary, 'failedInvoices')}.
                        </p>
                      </div>
                      <div className="text-right text-xs font-bold text-slate-500" style={numericStyle}>
                        <div>{run.startedAt ? formatDate(run.startedAt) : 'Chua bat dau'}</div>
                        <div>{run.completedAt ? formatDate(run.completedAt) : 'Dang mo'}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {currentRun && (
        <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900">Billing run #{currentRun.id}</h2>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600" style={numericStyle}>
                  {currentRun.billingPeriod}
                </span>
                {selectedRunStatus && (
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${selectedRunStatus.className}`}>
                    {selectedRunStatus.label}
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Phần này cho bạn biết đợt chạy đó đã tạo được bao nhiêu hóa đơn, hợp đồng nào lỗi, và kết quả tính tiền của từng phòng.
              </p>
            </div>
            <button
              onClick={() => snapshotsQuery.refetch()}
              disabled={snapshotsQuery.isFetching || selectedRunId == null}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {snapshotsQuery.isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
              Tai lai snapshots
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Da tao</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {getRunSummaryNumber(currentRun.summary, 'createdInvoices')}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Da bo qua</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {getRunSummaryNumber(currentRun.summary, 'skippedInvoices')}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">That bai</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {getRunSummaryNumber(currentRun.summary, 'failedInvoices')}
              </p>
            </div>
            <div className="rounded-[24px] bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Version khoa</p>
              <p className="mt-3 text-3xl font-black text-slate-900" style={numericStyle}>
                {currentRun.lockVersion}
              </p>
            </div>
          </div>

          {Array.isArray((currentRun.error as { failures?: unknown[] }).failures) &&
            (currentRun.error as { failures?: Array<{ contractCode: string; message: string }> }).failures!.length > 0 && (
              <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-rose-700">
                  <AlertTriangle size={16} />
                  Hợp đồng bị lỗi khi chạy
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {(currentRun.error as { failures?: Array<{ contractCode: string; message: string }> }).failures!.map((failure, index) => (
                    <div key={`${failure.contractCode}-${index}`} className="rounded-2xl border border-rose-100 bg-white px-4 py-3">
                      <p className="font-black text-slate-900">{failure.contractCode}</p>
                      <p className="mt-1 text-sm font-medium leading-5 text-slate-600">{failure.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="overflow-hidden rounded-[28px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    <th className="px-4 py-4">Contract</th>
                    <th className="px-4 py-4">Room</th>
                    <th className="px-4 py-4">Electric</th>
                    <th className="px-4 py-4">Water</th>
                    <th className="px-4 py-4">Occupants</th>
                    <th className="px-4 py-4">Occupied days</th>
                    <th className="px-4 py-4">Policy source</th>
                    <th className="px-4 py-4">Warnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm">
                  {snapshotsQuery.isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Đang tải chi tiết...
                      </td>
                    </tr>
                  ) : snapshots.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Chưa có chi tiết tính tiền cho đợt chạy này.
                      </td>
                    </tr>
                  ) : (
                    snapshots.map((snapshot) => (
                      <tr key={snapshot.id} className="align-top">
                        <td className="px-4 py-4 font-black text-slate-900">{snapshot.contractCode}</td>
                        <td className="px-4 py-4 font-bold text-slate-600">{snapshot.roomCode}</td>
                        <td className="px-4 py-4 font-bold text-slate-700" style={numericStyle}>
                          {formatVND(snapshot.electricFinalAmount)}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700" style={numericStyle}>
                          {formatVND(snapshot.waterFinalAmount)}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700" style={numericStyle}>
                          {snapshot.occupantsForBilling}
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-700" style={numericStyle}>
                          {snapshot.occupiedDays}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                            {snapshot.policySourceType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {snapshot.warnings.length === 0 ? (
                              <span className="text-xs font-bold text-slate-400">Không có lưu ý</span>
                            ) : (
                              snapshot.warnings.map((warning) => (
                                <span
                                  key={`${snapshot.id}-${warning.code}`}
                                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-700"
                                  title={warning.message}
                                >
                                  {warning.code}
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
        </section>
      )}
    </div>
  );
}
