import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Landmark, RefreshCw, Search, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { Skeleton, Spinner } from '@/components/ui';
import { usePortalInvoiceRealtime } from '@/hooks/usePortalInvoiceRealtime';
import { supabase } from '@/lib/supabase';
import {
  buildSepayTransferContent,
  fetchInvoiceById,
  fetchInvoices,
  recordBankTransfer,
  sortInvoices,
  updateInvoiceListItem,
  type InvoiceSort,
  type PortalInvoice,
  type PortalInvoiceDetail,
  type PortalInvoiceStatus,
} from '@/services/portalInvoiceService';
import type { DbPaymentMethod } from '@/types/supabase';
import { cn, formatDate, formatDateTimeLocalValue, formatVND, toIsoFromDateTimeLocal } from '@/utils';

type PaymentFormState = {
  method: DbPaymentMethod;
  amount: string;
  transferReference: string;
  bankName: string;
  senderName: string;
  transferredAt: string;
  receivedBy: string;
  transactionId: string;
  notes: string;
};

const PAGE_SIZE = 8;

const createInitialPaymentForm = (invoice?: PortalInvoiceDetail | null): PaymentFormState => ({
  method: 'bank_transfer',
  amount: invoice ? String(invoice.balance) : '',
  transferReference: '',
  bankName: '',
  senderName: '',
  transferredAt: formatDateTimeLocalValue(),
  receivedBy: '',
  transactionId: '',
  notes: '',
});

const getStatusChip = (status: PortalInvoiceStatus) =>
  ({
    pending: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    partial: { label: 'Thanh toán một phần', className: 'bg-sky-50 text-sky-700 border border-sky-200' },
    paid: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    overdue: { label: 'Quá hạn', className: 'bg-rose-50 text-rose-700 border border-rose-200' },
    cancelled: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  })[status];

const getLineItemTypeLabel = (itemType: PortalInvoiceDetail['lineItems'][number]['itemType']) =>
  ({
    rent: 'Tiền phòng',
    utility_electric: 'Dien',
    utility_water: 'Nước',
    service: 'Dịch vụ',
    asset: 'Tài sản',
    discount: 'Giảm trừ',
    other: 'Khác',
  })[itemType];

const toIsoString = (value: string) => {
  return toIsoFromDateTimeLocal(value);
};

const filterInvoices = (
  invoices: PortalInvoice[],
  filters: { status: 'all' | PortalInvoiceStatus; search: string; from: string; to: string }
) => {
  const search = filters.search.trim().toLowerCase();

  return invoices.filter((invoice) => {
    const matchesStatus = filters.status === 'all' || invoice.status === filters.status;
    const matchesFrom = !filters.from || (!!invoice.dueDate && invoice.dueDate >= filters.from);
    const matchesTo = !filters.to || (!!invoice.dueDate && invoice.dueDate <= filters.to);
    const matchesSearch =
      !search ||
      invoice.invoiceNumber.toLowerCase().includes(search) ||
      invoice.guestName.toLowerCase().includes(search) ||
      invoice.contractCode.toLowerCase().includes(search);

    return matchesStatus && matchesFrom && matchesTo && matchesSearch;
  });
};

const SummaryCard = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{hint}</p>
  </div>
);

const InfoRow = ({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  copyValue?: string;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 px-4 py-3">
    <div>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 break-all">{value}</p>
    </div>
    {copyValue ? (
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copyValue);
            toast.success('Đã sao chép');
          } catch {
            toast.error('Không thể sao chép');
          }
        }}
        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-700"
      >
        Sao chép
      </button>
    ) : null}
  </div>
);

const buildSepayQrValue = (
  bankDetails: PortalInvoiceDetail['bankDetails'] | null | undefined,
  amount: number,
  transferContent: string
) => {
  if (!bankDetails?.accountNumber || amount <= 0) {
    return null;
  }

  const bankIdentifier = bankDetails.bankCode || bankDetails.bankName;

  return `https://img.vietqr.io/image/${encodeURIComponent(bankIdentifier)}-${encodeURIComponent(bankDetails.accountNumber)}-compact2.png?amount=${encodeURIComponent(Math.round(amount))}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankDetails.accountName)}`;
};

const InvoiceList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedInvoiceId = searchParams.get('invoice');

  const [statusFilter, setStatusFilter] = useState<'all' | PortalInvoiceStatus>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<InvoiceSort>('due_date');
  const [page, setPage] = useState(1);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(createInitialPaymentForm());
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTransferSupportForm, setShowTransferSupportForm] = useState(false);
  const paidInvoiceToastRef = useRef<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: () => fetchInvoices(),
    staleTime: 15_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const detailQuery = useQuery({
    queryKey: ['portal-invoice', selectedInvoiceId],
    queryFn: () => fetchInvoiceById(selectedInvoiceId!),
    enabled: !!selectedInvoiceId,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const currentInvoice = query.state.data as PortalInvoiceDetail | undefined;
      return currentInvoice && currentInvoice.balance > 0 && currentInvoice.status !== 'paid' ? 20_000 : false;
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
  const selectedInvoice = detailQuery.data ?? null;
  const watchedContractIds = useMemo(
    () =>
      (invoicesQuery.data ?? [])
        .map((invoice) => Number(invoice.contractId))
        .filter(Number.isInteger),
    [invoicesQuery.data]
  );

  const filteredInvoices = useMemo(() => {
    const filtered = filterInvoices(invoicesQuery.data ?? [], {
      status: statusFilter,
      search,
      from: dateFrom,
      to: dateTo,
    });
    return sortInvoices(filtered, sortBy);
  }, [dateFrom, dateTo, invoicesQuery.data, search, sortBy, statusFilter]);

  const summary = useMemo(() => {
    const items = invoicesQuery.data ?? [];
    return {
      total: items.length,
      pending: items.filter((item) => item.status === 'pending' || item.status === 'partial').length,
      outstanding: items.filter((item) => item.balance > 0).reduce((sum, item) => sum + item.balance, 0),
      overdue: items.filter((item) => item.status === 'overdue').length,
      paid: items.filter((item) => item.status === 'paid').length,
      revenue: items.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amountDue, 0),
    };
  }, [invoicesQuery.data]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const pagedInvoices = filteredInvoices.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, search, sortBy, statusFilter]);

  useEffect(() => {
    setPaymentForm(createInitialPaymentForm(selectedInvoice));
  }, [selectedInvoice]);

  useEffect(() => {
    setShowTransferSupportForm(false);
  }, [detailQuery.data?.id, paymentForm.method]);

  const openInvoice = (invoiceId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('invoice', invoiceId);
    setSearchParams(next);
  };

  const closeInvoice = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('invoice');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const setFormField = <K extends keyof PaymentFormState>(field: K, value: PaymentFormState[K]) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  };

  const sepayTransferCode = selectedInvoice ? buildSepayTransferContent(selectedInvoice.invoiceNumber) : '';
  const sepayAmount = Number(paymentForm.amount);
  const sepayQrValue =
    selectedInvoice && Number.isFinite(sepayAmount)
      ? buildSepayQrValue(selectedInvoice.bankDetails, sepayAmount, sepayTransferCode)
      : null;

  const applyInvoiceDetailToCache = useCallback(
    (detail: PortalInvoiceDetail) => {
      queryClient.setQueryData(['portal-invoice', detail.id], detail);
      queryClient.setQueryData<PortalInvoice[]>(['portal-invoices'], (current) =>
        current ? updateInvoiceListItem(current, detail) : current
      );
    },
    [queryClient]
  );

  const closePaidInvoice = useCallback(
    (detail: PortalInvoiceDetail) => {
      applyInvoiceDetailToCache(detail);
      setShowTransferSupportForm(false);
      closeInvoice();

      if (paidInvoiceToastRef.current !== detail.id) {
        paidInvoiceToastRef.current = detail.id;
        toast.success('Hóa đơn đã được xác nhận tự động');
      }
    },
    [applyInvoiceDetailToCache, closeInvoice]
  );

  usePortalInvoiceRealtime(selectedInvoiceId, watchedContractIds, (invoiceId) => {
    void fetchInvoiceById(invoiceId)
      .then(closePaidInvoice)
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: ['portal-invoice', invoiceId] });
        void queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      });
  });

  const simulateSepayPayment = async () => {
    if (!selectedInvoice) return;

    setIsSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sepay-webhook', {
        body: {
          id: `demo_${Date.now()}`,
          transferType: 'in',
          transferAmount: selectedInvoice.balance,
          transferContent: buildSepayTransferContent(selectedInvoice.invoiceNumber),
          referenceCode: `DEMO${Date.now()}`,
          transactionDate: new Date().toISOString(),
          gateway: selectedInvoice.bankDetails?.bankName ?? null,
          accountNumber: selectedInvoice.bankDetails?.accountNumber ?? null,
        },
        headers: {
          'x-smartstay-demo': 'true',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { success?: boolean; reason?: string; error?: string } | null;
      if (result?.success === false) {
        throw new Error(result.reason || result.error || 'Mô phỏng đối soát SePay thất bại');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể mô phỏng thanh toán');
    } finally {
      setIsSimulating(false);
    }
  };

  const paymentMutation = useMutation({
    mutationFn: async (form: PaymentFormState) => {
      const invoice = detailQuery.data;
      if (!invoice) throw new Error('Vui lòng chọn hóa đơn trước khi gửi yêu cầu thanh toán.');

      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0.');
      if (amount > invoice.balance) throw new Error('Số tiền thanh toán không được vượt quá số dư còn lại.');

      if (form.method === 'bank_transfer') {
        if (!form.transferReference.trim()) throw new Error('Vui lòng nhập mã tham chiếu chuyển khoản.');
        return recordBankTransfer(invoice.id, {
          amount,
          transfer_reference: form.transferReference.trim(),
          bank_name: form.bankName.trim() || undefined,
          bank_account_name: form.senderName.trim() || undefined,
          transferred_at: toIsoString(form.transferredAt),
          notes: form.notes.trim() || undefined,
        });
      }

      throw new Error('Tiền mặt không cần gửi yêu cầu online.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi yêu cầu thanh toán.');
    },
    onSuccess: (detail) => {
      applyInvoiceDetailToCache(detail);
      queryClient.invalidateQueries({ queryKey: ['portal-invoice', detail.id] });
      queryClient.invalidateQueries({ queryKey: ['portal-invoices'] });
      setPaymentForm(createInitialPaymentForm(detail));
      setShowTransferSupportForm(false);
      toast.success('Đã gửi thông tin đối soát. Hóa đơn sẽ cập nhật sau khi được xác nhận.');
    },
  });

  if (invoicesQuery.isLoading) {
    return (
      <div className="space-y-5 bg-slate-50/50 px-5 pb-24 pt-10 md:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-28 rounded-[28px]" />
            <Skeleton className="h-28 rounded-[28px]" />
            <Skeleton className="h-28 rounded-[28px]" />
            <Skeleton className="h-28 rounded-[28px]" />
          </div>
          <Skeleton className="h-20 rounded-[28px]" />
          <Skeleton className="h-[420px] rounded-[32px]" />
        </div>
      </div>
    );
  }

  if (invoicesQuery.isError) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <AlertCircle size={40} className="text-rose-500" />
        <div>
          <h2 className="text-xl font-black text-slate-900">Không thể tải danh sách hóa đơn</h2>
          <p className="mt-2 text-sm text-slate-500">
            {invoicesQuery.error instanceof Error ? invoicesQuery.error.message : 'Đã xảy ra lỗi không mong muốn.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => invoicesQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-widest text-white"
        >
          <RefreshCw size={14} />
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 px-5 pb-24 pt-10 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-teal-700">Cổng hóa đơn cư dân</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Hóa đơn và thanh toán</h1>
              <p className="mt-2 text-sm text-slate-500">
                Theo dõi công nợ, lịch sử thanh toán và gửi yêu cầu thanh toán ngay trên portal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => invoicesQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-700"
            >
              <RefreshCw size={14} className={cn(invoicesQuery.isFetching && 'animate-spin')} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tổng hóa đơn" value={String(summary.total)} hint="Toàn bộ hóa đơn đang hiển thị" />
          <SummaryCard label="Chờ thanh toán" value={String(summary.pending)} hint="Hóa đơn đang chờ thanh toán hoặc đối soát" />
          <SummaryCard label="Đã thanh toán" value={String(summary.paid)} hint="Hóa đơn đã được tất toán" />
          <SummaryCard label="Doanh thu đã thu" value={formatVND(summary.revenue)} hint="Tổng giá trị hóa đơn đã thanh toán" />
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr]">
            <label className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo khách thuê hoặc mã hóa đơn"
                className="input-base h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | PortalInvoiceStatus)}
              className="input-base h-12 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="paid">Đã thanh toán</option>
              <option value="overdue">Quá hạn</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="input-base h-12 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="input-base h-12 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as InvoiceSort)}
              className="input-base h-12 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm"
            >
              <option value="due_date">Sắp xếp theo hạn thanh toán</option>
              <option value="amount">Sắp xếp theo số tiền</option>
              <option value="status">Sắp xếp theo trạng thái</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500 md:grid">
            <div>Mã hóa đơn</div>
            <div>Khách thuê</div>
            <div>Mã hợp đồng</div>
            <div>Tổng tiền</div>
            <div>Đã thanh toán</div>
            <div>Còn lại</div>
            <div>Trạng thái</div>
            <div>Hạn thanh toán</div>
            <div className="text-right">Thao tác</div>
          </div>

          {pagedInvoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <AlertCircle size={28} className="mx-auto text-slate-300" />
              <h2 className="mt-4 text-lg font-black text-slate-900">Không có hóa đơn phù hợp</h2>
              <p className="mt-2 text-sm text-slate-500">
                Hãy thử thay đổi từ khóa tìm kiếm, trạng thái hoặc khoảng ngày.
              </p>
            </div>
          ) : (
            pagedInvoices.map((invoice) => {
              const chip = getStatusChip(invoice.status);
              return (
                <div key={invoice.id} className="border-b border-slate-100 px-4 py-4 last:border-b-0 md:px-5">
                  <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_0.7fr_0.8fr_auto] items-center gap-4 md:grid">
                    <div>
                      <p className="font-black text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{invoice.roomCode ?? 'Chưa gán phòng'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{invoice.guestName}</p>
                      <p className="text-xs text-slate-500">{invoice.guestPhone ?? 'Chưa có số điện thoại'}</p>
                    </div>
                    <div className="font-bold">{invoice.contractCode}</div>
                    <div className="font-bold">{formatVND(invoice.amountDue)}</div>
                    <div className="font-bold text-emerald-700">{formatVND(invoice.amountPaid)}</div>
                    <div className={cn('font-black', invoice.balance > 0 ? 'text-rose-600' : 'text-emerald-700')}>
                      {formatVND(invoice.balance)}
                    </div>
                    <div>
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest', chip.className)}>
                        {chip.label}
                      </span>
                    </div>
                    <div>{formatDate(invoice.dueDate)}</div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => openInvoice(invoice.id)}
                        className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
                      >
                        Xem
                      </button>
                    </div>
                  </div>

                  <button type="button" onClick={() => openInvoice(invoice.id)} className="flex w-full flex-col gap-3 text-left md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{invoice.invoiceNumber}</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{invoice.guestName}</p>
                        <p className="text-sm text-slate-500">{invoice.contractCode}</p>
                      </div>
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest', chip.className)}>
                        {chip.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-400">Tổng tiền</p>
                        <p className="font-bold text-slate-900">{formatVND(invoice.amountDue)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Đã thanh toán</p>
                        <p className="font-bold text-emerald-700">{formatVND(invoice.amountPaid)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Còn lại</p>
                        <p className={cn('font-black', invoice.balance > 0 ? 'text-rose-600' : 'text-emerald-700')}>
                          {formatVND(invoice.balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Hạn thanh toán</p>
                        <p className="font-bold text-slate-900">{formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row">
          <p className="text-sm text-slate-500">
            Hiển thị {filteredInvoices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} đến {Math.min(page * PAGE_SIZE, filteredInvoices.length)} trên tổng {filteredInvoices.length} hóa đơn
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black uppercase tracking-widest text-slate-700 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-2 text-sm font-black text-slate-900">{page}/{totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black uppercase tracking-widest text-slate-700 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <BottomSheet isOpen={!!selectedInvoiceId} onClose={closeInvoice} title={detailQuery.data?.invoiceNumber ?? 'Chi tiết hóa đơn'} height="h-[92vh]">
        {detailQuery.isLoading ? (
          <div className="flex h-full items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : detailQuery.isError ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {detailQuery.error instanceof Error ? detailQuery.error.message : 'Không thể tải chi tiết hóa đơn.'}
          </div>
        ) : detailQuery.data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard label="Còn lại" value={formatVND(detailQuery.data.balance)} hint="Số dư hiện tại của hóa đơn" />
              <SummaryCard label="Tổng tiền" value={formatVND(detailQuery.data.amountDue)} hint="Tổng giá trị hóa đơn" />
              <SummaryCard label="Đã thanh toán" value={formatVND(detailQuery.data.amountPaid)} hint="Các khoản đã được xác nhận" />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Khách thuê</p>
                  <p className="mt-2 font-black text-slate-900">{detailQuery.data.guestName}</p>
                  <p className="text-sm text-slate-500">{detailQuery.data.guestPhone ?? 'Chưa có số điện thoại'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Hợp đồng</p>
                  <p className="mt-2 font-black text-slate-900">{detailQuery.data.contractCode}</p>
                  <p className="text-sm text-slate-500">
                    {detailQuery.data.buildingName ?? 'Chưa gán tòa nhà'}
                    {detailQuery.data.roomCode ? ` • ${detailQuery.data.roomCode}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Hạn thanh toán</p>
                  <p className="mt-2 font-bold text-slate-900">{formatDate(detailQuery.data.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Trạng thái</p>
                  <span className={cn('mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest', getStatusChip(detailQuery.data.status).className)}>
                    {getStatusChip(detailQuery.data.status).label}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-900">Chi tiết các dòng phí</h3>
              <div className="mt-4 space-y-3">
                {detailQuery.data.lineItems.length === 0 ? (
                  <p className="text-sm text-slate-500">Hóa đơn này chưa có dòng phí nào.</p>
                ) : (
                  detailQuery.data.lineItems.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="space-y-1.5">
                        <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                          {getLineItemTypeLabel(item.itemType)}
                        </span>
                        <p className="font-bold text-slate-900">{item.description}</p>
                        <p className="text-sm text-slate-500">{item.quantity} × {formatVND(item.unitPrice)}</p>
                      </div>
                      <p className="font-black text-slate-900">{formatVND(item.lineTotal)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-900">Lịch sử thanh toán</h3>
              <div className="mt-4 space-y-3">
                {detailQuery.data.paymentHistory.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có khoản thanh toán nào được ghi nhận.</p>
                ) : (
                  detailQuery.data.paymentHistory.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-black text-slate-900">{payment.methodLabel}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(payment.paymentDate, 'dd/MM/yyyy HH:mm')} • {payment.paymentCode}
                          </p>
                          {payment.referenceNumber ? <p className="text-sm text-slate-600">Mã tham chiếu: {payment.referenceNumber}</p> : null}
                          {payment.transactionId && payment.transactionId !== payment.referenceNumber ? (
                            <p className="text-sm text-slate-600">Mã giao dịch: {payment.transactionId}</p>
                          ) : null}
                          {payment.receivedBy ? <p className="text-sm text-slate-600">Người nhận: {payment.receivedBy}</p> : null}
                          {payment.senderName ? <p className="text-sm text-slate-600">Người chuyển: {payment.senderName}</p> : null}
                          {payment.notes ? <p className="text-sm text-slate-600">Ghi chú: {payment.notes}</p> : null}
                        </div>
                        <p className="text-lg font-black text-slate-900">{formatVND(payment.amount)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {detailQuery.data.balance > 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-black text-slate-900">Thanh toán hóa đơn</h3>
                <p className="mt-1 text-sm text-slate-500">Số dư còn lại: {formatVND(detailQuery.data.balance)}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {([
                    { value: 'bank_transfer', label: 'Chuyển khoản', icon: Landmark },
                    { value: 'cash', label: 'Tiền mặt', icon: Wallet },
                  ] as const).map((option) => {
                    const Icon = option.icon;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormField('method', option.value as DbPaymentMethod)}
                        className={cn(
                          'flex items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition',
                          paymentForm.method === option.value
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 bg-slate-50/70 text-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-2xl',
                            paymentForm.method === option.value ? 'bg-white/15' : 'bg-white'
                          )}
                        >
                          <Icon size={18} />
                        </span>
                        <span>
                          <span className="block text-sm font-black uppercase tracking-[0.16em]">{option.label}</span>
                          <span
                            className={cn(
                              'mt-1 block text-xs',
                              paymentForm.method === option.value ? 'text-white/75' : 'text-slate-500'
                            )}
                          >
                            {option.value === 'bank_transfer'
                              ? 'Quét QR hoặc chuyển khoản đúng nội dung để hệ thống tự duyệt.'
                              : 'Thanh toán trực tiếp tại ban quản lý, không cần gửi yêu cầu online.'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {paymentForm.method === 'bank_transfer' ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-700">Chuyển khoản tự động qua SePay</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Quét QR hoặc chuyển khoản thủ công đúng số tiền và đúng nội dung <span className="font-black">{sepayTransferCode}</span>.
                        Khi SePay nhận giao dịch hợp lệ, hóa đơn sẽ tự cập nhật và bảng này sẽ tự động.
                      </p>
                      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
                        <div className="rounded-2xl bg-white p-3">
                          {sepayQrValue ? (
                            <>
                              <img
                                src={sepayQrValue}
                                alt="QR thanh toán SePay"
                                className="h-[196px] w-[196px] rounded-xl object-contain"
                              />
                              <p className="mt-3 text-xs text-slate-500">
                                Ưu tiên quét QR để tránh sai nội dung chuyển khoản.
                              </p>
                            </>
                          ) : (
                            <div className="flex h-[196px] items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-500">
                              Cần cấu hình ngân hàng và số tài khoản để tạo VietQR.
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 rounded-2xl bg-white p-4">
                          <InfoRow
                            label="Ngân hàng"
                            value={detailQuery.data.bankDetails?.bankName || 'Chưa cấu hình'}
                            copyValue={detailQuery.data.bankDetails?.bankName || undefined}
                          />
                          <InfoRow
                            label="Số tài khoản"
                            value={detailQuery.data.bankDetails?.accountNumber || 'Chưa cấu hình'}
                            copyValue={detailQuery.data.bankDetails?.accountNumber || undefined}
                          />
                          <InfoRow
                            label="Chủ tài khoản"
                            value={detailQuery.data.bankDetails?.accountName || 'Chưa cấu hình'}
                            copyValue={detailQuery.data.bankDetails?.accountName || undefined}
                          />
                          <InfoRow label="Nội dung chuyển khoản" value={sepayTransferCode} copyValue={sepayTransferCode} />
                          <InfoRow
                            label="Số tiền cần chuyển"
                            value={formatVND(Number.isFinite(sepayAmount) ? sepayAmount : 0)}
                          />
                          {import.meta.env.VITE_DEMO_MODE === 'true' ? (
                            <button
                              type="button"
                              onClick={simulateSepayPayment}
                              disabled={isSimulating}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60"
                            >
                              {isSimulating ? <Spinner size="sm" className="text-white" /> : null}
                              {isSimulating ? 'Đang mô phỏng SePay...' : '[DEMO] Mô phỏng SePay xác nhận'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900">Đã chuyển nhưng chưa tự cập nhật?</p>
                          <p className="mt-1 text-sm text-slate-500">
                            Chỉ dùng khi bạn đã chuyển khoản thành công nhưng hệ thống chưa tự duyệt.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowTransferSupportForm((current) => !current)}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-widest text-slate-700"
                        >
                          {showTransferSupportForm ? 'Ẩn biểu mẫu' : 'Gửi thông tin đối soát'}
                        </button>
                      </div>

                      {showTransferSupportForm ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentForm.amount}
                            onChange={(event) => setFormField('amount', event.target.value)}
                            className="input-base h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                            placeholder="Số tiền đã chuyển"
                          />
                          <input
                            value={paymentForm.transferReference}
                            onChange={(event) => setFormField('transferReference', event.target.value)}
                            className="input-base h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                            placeholder="Mã tham chiếu chuyển khoản"
                          />
                          <input
                            value={paymentForm.bankName}
                            onChange={(event) => setFormField('bankName', event.target.value)}
                            className="input-base h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                            placeholder="Ngân hàng chuyển"
                          />
                          <input
                            value={paymentForm.senderName}
                            onChange={(event) => setFormField('senderName', event.target.value)}
                            className="input-base h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                            placeholder="Tên người chuyển"
                          />
                          <input
                            type="datetime-local"
                            value={paymentForm.transferredAt}
                            onChange={(event) => setFormField('transferredAt', event.target.value)}
                            className="input-base h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm"
                          />
                          <textarea
                            value={paymentForm.notes}
                            onChange={(event) => setFormField('notes', event.target.value)}
                            rows={4}
                            className="input-base rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                            placeholder="Ghi chú thêm"
                          />
                          <div className="flex justify-end md:col-span-2">
                            <button
                              type="button"
                              disabled={paymentMutation.isPending}
                              onClick={() => paymentMutation.mutate(paymentForm)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-60"
                            >
                              {paymentMutation.isPending ? <Spinner size="sm" className="text-white" /> : <Landmark size={14} />}
                              Gửi thông tin đối soát
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                    Thanh toán tiền mặt nên thực hiện trực tiếp với ban quản lý hoặc lễ tân. Sau khi thu tiền, hệ thống nội bộ sẽ cập nhật hóa đơn, nên portal này không cần gửi thêm yêu cầu.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
                Hóa đơn này đã được tất toán. Hệ thống tạm khóa yêu cầu thanh toán bổ sung.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
};

export default InvoiceList;
