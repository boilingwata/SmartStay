import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import {
  cancelInvoice,
  generateCurrentMonthInvoices,
  listPlatformInvoices,
  markInvoicePaid,
  refreshOverdueStatus,
  summarizeBilling,
  adjustInvoice,
  type PlatformInvoiceRow,
} from '@/services/superAdmin/platformInvoicesService';
import { listPlans, type SubscriptionPlanRow } from '@/services/superAdmin/subscriptionPlansService';
import { formatVND } from '@/utils';

type Tab = 'overview' | 'invoices' | 'plans';

const BillingCenter: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');

  const summaryQuery = useQuery({
    queryKey: ['super-admin', 'billing-summary'],
    queryFn: summarizeBilling,
    enabled: tab === 'overview',
  });

  const invoicesQuery = useQuery({
    queryKey: ['super-admin', 'platform-invoices'],
    queryFn: () => listPlatformInvoices(),
    enabled: tab === 'invoices',
  });

  const plansQuery = useQuery({
    queryKey: ['super-admin', 'billing-plans-readonly'],
    queryFn: () => listPlans(false),
    enabled: tab === 'plans',
  });

  const genMu = useMutation({
    mutationFn: generateCurrentMonthInvoices,
    onSuccess: (n) => {
      toast.success(`Đã tạo ${n} hóa đơn`);
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const overdueMu = useMutation({
    mutationFn: refreshOverdueStatus,
    onSuccess: (n) => {
      toast.success(`Cập nhật ${n} hóa đơn quá hạn`);
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const payMu = useMutation({
    mutationFn: markInvoicePaid,
    onSuccess: () => {
      toast.success('Đã đánh dấu đã thanh toán');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMu = useMutation({
    mutationFn: cancelInvoice,
    onSuccess: () => {
      toast.success('Đã hủy');
      qc.invalidateQueries({ queryKey: ['super-admin'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = summaryQuery.data;

  return (
    <div className="space-y-6">
      <Link
        to="/super-admin/dashboard"
        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:border-primary/25"
      >
        <ArrowLeft size={16} />
        Bảng điều khiển
      </Link>

      <section className="rounded-[32px] border border-border/70 bg-card p-6 shadow-[0_24px_72px_-48px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Billing & Gói dịch vụ</h1>
            <p className="mt-2 text-sm text-muted">MRR, hóa đơn nền tảng và danh mục gói.</p>
          </div>
          <Link
            to="/super-admin/system-config"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-sm font-bold text-primary hover:bg-primary/10"
          >
            Chỉnh sửa gói (Cấu hình)
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border/70 pb-3">
          {(
            [
              ['overview', 'Tổng quan'],
              ['invoices', 'Hóa đơn nền tảng'],
              ['plans', 'Danh mục gói'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
                tab === k ? 'bg-primary text-primary-foreground' : 'bg-background text-muted hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
              <p className="text-[11px] font-black uppercase text-muted">Ước tính MRR</p>
              <p className="mt-2 text-2xl font-black tabular-nums">
                {summaryQuery.isLoading ? '—' : formatVND(s?.mrr ?? 0)}
              </p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
              <p className="text-[11px] font-black uppercase text-muted">Hóa đơn quá hạn</p>
              <p className="mt-2 text-2xl font-black tabular-nums">{summaryQuery.isLoading ? '—' : s?.overdueCount ?? 0}</p>
              <p className="mt-1 text-xs text-muted">{formatVND(s?.overdueAmount ?? 0)} dư nợ</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
              <p className="text-[11px] font-black uppercase text-muted">Chờ thanh toán</p>
              <p className="mt-2 text-2xl font-black tabular-nums">{summaryQuery.isLoading ? '—' : s?.pendingCount ?? 0}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-background/70 p-5">
              <p className="text-[11px] font-black uppercase text-muted">ARR (ước tính)</p>
              <p className="mt-2 text-2xl font-black tabular-nums">
                {summaryQuery.isLoading ? '—' : formatVND((s?.mrr ?? 0) * 12)}
              </p>
            </div>
          </div>
        ) : null}

        {tab === 'invoices' ? (
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => genMu.mutate()} isLoading={genMu.isPending}>
                Tạo hóa đơn tháng này
              </Button>
              <Button type="button" variant="outline" onClick={() => overdueMu.mutate()} isLoading={overdueMu.isPending}>
                Cập nhật trạng thái quá hạn
              </Button>
            </div>
            <div className="overflow-x-auto rounded-[24px] border border-border/70">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="border-b border-border/70 bg-background/70">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Org</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Kỳ</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Số tiền</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">Hạn</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-muted">TT</th>
                    <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-muted">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoicesQuery.data ?? []).map((inv: PlatformInvoiceRow) => (
                    <InvoiceRow
                      key={inv.id}
                      inv={inv}
                      onPaid={() => payMu.mutate(inv.id)}
                      onCancel={() => cancelMu.mutate(inv.id)}
                      onAdjust={async (patch) => {
                        await adjustInvoice(inv.id, patch);
                        toast.success('Đã cập nhật');
                        qc.invalidateQueries({ queryKey: ['super-admin'] });
                      }}
                      payPending={payMu.isPending}
                      cancelPending={cancelMu.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === 'plans' ? (
          <div className="mt-8 overflow-hidden rounded-[24px] border border-border/70">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-background/70">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-muted">Gói</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-muted">Giá / tháng</th>
                  <th className="px-4 py-3 text-left text-[11px] font-black uppercase text-muted">Giới hạn</th>
                </tr>
              </thead>
              <tbody>
                {(plansQuery.data ?? []).map((p: SubscriptionPlanRow) => (
                  <tr key={p.id} className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3 text-muted">{formatVND(Number(p.monthly_price))}</td>
                    <td className="px-4 py-3 text-muted">
                      {p.building_limit} tòa / {p.room_limit} phòng / {p.user_limit} user
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
};

function InvoiceRow({
  inv,
  onPaid,
  onCancel,
  onAdjust,
  payPending,
  cancelPending,
}: {
  inv: PlatformInvoiceRow;
  onPaid: () => void;
  onCancel: () => void;
  onAdjust: (patch: Partial<Pick<PlatformInvoiceRow, 'amount_due' | 'due_date' | 'notes'>>) => Promise<void>;
  payPending: boolean;
  cancelPending: boolean;
}) {
  const orgLabel = inv.organization_id.slice(0, 8);
  const [note, setNote] = useState(inv.notes ?? '');

  return (
    <tr className="border-b border-border/40">
      <td className="px-3 py-2 font-mono text-xs">{orgLabel}…</td>
      <td className="px-3 py-2 text-xs text-muted">
        {inv.period_start} → {inv.period_end}
      </td>
      <td className="px-3 py-2">{formatVND(Number(inv.amount_due))}</td>
      <td className="px-3 py-2 text-xs">{inv.due_date ?? '—'}</td>
      <td className="px-3 py-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black uppercase">{inv.status}</span>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex flex-wrap justify-end gap-2">
          {inv.status === 'pending' || inv.status === 'overdue' ? (
            <Button type="button" size="sm" variant="outline" onClick={onPaid} disabled={payPending}>
              Đã TT
            </Button>
          ) : null}
          {inv.status !== 'cancelled' && inv.status !== 'paid' ? (
            <Button type="button" size="sm" variant="danger" onClick={onCancel} disabled={cancelPending}>
              Hủy
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              const nd = prompt('Số tiền mới (₫)', String(inv.amount_due));
              if (nd == null) return;
              void onAdjust({ amount_due: Number(nd), notes: note || null });
            }}
          >
            Điều chỉnh
          </Button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Ghi chú điều chỉnh"
          className="mt-2 w-full rounded-xl border border-border bg-background px-2 py-1 text-xs"
        />
      </td>
    </tr>
  );
}

export default BillingCenter;
