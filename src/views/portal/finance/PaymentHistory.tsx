import React, { useDeferredValue, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Search,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Feedback';
import portalFinanceService, { type PortalPaymentHistoryItem } from '@/services/portalFinanceService';
import { cn, formatDate, formatVND } from '@/utils';

type PaymentStatusFilter = 'all' | PortalPaymentHistoryItem['status'];

const STATUS_OPTIONS: Array<{ value: PaymentStatusFilter; label: string }> = [
  { value: 'all', label: 'Tat ca trang thai' },
  { value: 'Pending', label: 'Dang xu ly' },
  { value: 'Confirmed', label: 'Da xac nhan' },
  { value: 'Rejected', label: 'Bi tu choi' },
  { value: 'Cancelled', label: 'Da huy' },
];

const getStatusConfig = (status: PortalPaymentHistoryItem['status']) => {
  if (status === 'Confirmed') {
    return {
      icon: CheckCircle2,
      label: 'Da xac nhan',
      badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      iconClassName: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (status === 'Rejected') {
    return {
      icon: AlertCircle,
      label: 'Bi tu choi',
      badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
      iconClassName: 'bg-rose-50 text-rose-600',
    };
  }

  if (status === 'Cancelled') {
    return {
      icon: XCircle,
      label: 'Da huy',
      badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
      iconClassName: 'bg-slate-100 text-slate-600',
    };
  }

  return {
    icon: Clock3,
    label: 'Dang xu ly',
    badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
    iconClassName: 'bg-amber-50 text-amber-600',
  };
};

const SummaryCard = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 tabular-nums">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{hint}</p>
  </div>
);

const PaymentCard = ({ payment }: { payment: PortalPaymentHistoryItem }) => {
  const status = getStatusConfig(payment.status);
  const StatusIcon = status.icon;

  return (
    <Link
      to={`/portal/invoices/${payment.invoiceId}`}
      className="group flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner', status.iconClassName)}>
          <CreditCard size={22} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{payment.code}</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]', status.badgeClassName)}>
              <StatusIcon size={12} />
              {status.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">
              {payment.source === 'attempt' ? 'Yeu cau' : 'Da ghi nhan'}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-black tracking-tight text-slate-900">{payment.invoiceCode}</h2>
          <p className="mt-1 break-words text-sm text-slate-600">{payment.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
            <span>{formatDate(payment.createdAt, 'dd/MM/yyyy HH:mm')}</span>
            <span>{payment.method}</span>
            {payment.referenceNumber ? <span>Ref: {payment.referenceNumber}</span> : null}
            {payment.bankName ? <span>{payment.bankName}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">So tien</p>
          <p className="mt-1 text-lg font-black tracking-tight text-teal-700 tabular-nums">{formatVND(payment.amount)}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
          <ChevronRight size={18} />
        </div>
      </div>
    </Link>
  );
};

const PaymentHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const rawStatus = searchParams.get('status');
  const statusFilter: PaymentStatusFilter =
    rawStatus === 'Pending' || rawStatus === 'Confirmed' || rawStatus === 'Rejected' || rawStatus === 'Cancelled'
      ? rawStatus
      : 'all';
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['portal-payments-history'],
    queryFn: () => portalFinanceService.getPaymentHistory(),
  });

  const payments = data?.items ?? [];

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      if (!matchesStatus) return false;
      if (!deferredSearch) return true;

      const haystack = [
        payment.code,
        payment.invoiceCode,
        payment.description,
        payment.method,
        payment.referenceNumber ?? '',
        payment.bankName ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(deferredSearch);
    });
  }, [deferredSearch, payments, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: payments.length,
      confirmed: payments.filter((payment) => payment.status === 'Confirmed').length,
      pending: payments.filter((payment) => payment.status === 'Pending').length,
      attention: payments.filter((payment) => payment.status === 'Rejected' || payment.status === 'Cancelled').length,
    };
  }, [payments]);

  const updateSearchParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <AlertCircle size={40} className="text-rose-500" />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Khong the tai lich su thanh toan</h1>
          <p className="mt-2 text-sm text-slate-500">
            {error instanceof Error ? error.message : 'Da xay ra loi khong mong muon.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-black uppercase tracking-[0.18em] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          Thu lai
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 px-5 pb-24 pt-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-teal-700">Tai chinh cu dan</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Lich su thanh toan</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Theo doi ca giao dich da xac nhan va cac yeu cau thanh toan dang doi soat trong cung mot timeline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black uppercase tracking-[0.16em] text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20"
            >
              <Clock3 size={16} className={cn(isFetching && 'animate-spin')} />
              Lam moi
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tong giao dich" value={String(summary.total)} hint="Tat ca giao dich va yeu cau" />
          <SummaryCard label="Da xac nhan" value={String(summary.confirmed)} hint="Khoan thu da duoc ghi nhan" />
          <SummaryCard label="Dang xu ly" value={String(summary.pending)} hint="Dang cho doi soat hoac xu ly" />
          <SummaryCard label="Can xu ly" value={String(summary.attention)} hint="Bi tu choi hoac da huy" />
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Tim kiem</span>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  name="payment-search"
                  value={search}
                  onChange={(event) => updateSearchParam('q', event.target.value || null)}
                  placeholder="Ma giao dich, hoa don, ngan hang..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 transition-colors focus:border-teal-500/40 focus:bg-white focus-visible:outline-none"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Trang thai</span>
              <div className="relative">
                <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  name="payment-status"
                  value={statusFilter}
                  onChange={(event) => updateSearchParam('status', event.target.value === 'all' ? null : event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 transition-colors focus:border-teal-500/40 focus:bg-white focus-visible:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!search && statusFilter === 'all'}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black uppercase tracking-[0.16em] text-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20"
            >
              Xoa loc
            </button>
          </div>
        </section>

        {filteredPayments.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <CreditCard size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Khong co giao dich phu hop</h2>
            <p className="mt-2 text-sm text-slate-500">
              Thu doi bo loc hoac quay lai trang hoa don de tao yeu cau thanh toan moi.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {filteredPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
