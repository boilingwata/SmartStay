import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Search, FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { Skeleton, Badge, Button, Input, Select } from '@/components/ui';
import { InvoiceDetailContent } from '@/components/portal/finance/InvoiceDetailContent';
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
    pending: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border border-amber-200', variant: 'warning' as const },
    partial: { label: 'Thanh toán một phần', className: 'bg-sky-50 text-sky-700 border border-sky-200', variant: 'default' as const },
    paid: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', variant: 'success' as const },
    overdue: { label: 'Quá hạn', className: 'bg-rose-50 text-rose-700 border border-rose-200', variant: 'destructive' as const },
    cancelled: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border border-slate-200', variant: 'default' as const },
  })[status];

// getLineItemTypeLabel is now handled within InvoiceDetailContent

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

const SummaryCard: React.FC<{ label: string; value: string | number; hint: string; icon: React.ReactNode }> = ({
  label,
  value,
  hint,
  icon,
}) => (
  <div className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="mt-1 text-[11px] text-slate-400 font-medium">{hint}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 transition-colors group-hover:bg-teal-50">
        {icon}
      </div>
    </div>
  </div>
);

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
      .catch((err: unknown) => {
        // W-02: log để không swallow lỗi realtime silently
        console.warn('[portal-realtime] fetch failed for invoice', invoiceId, err);
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
        <Button
          variant="outline"
          onClick={() => invoicesQuery.refetch()}
          className="rounded-2xl"
          leftIcon={<RefreshCw size={14} />}
        >
          Tải lại
        </Button>
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
            <Button
              variant="outline"
              onClick={() => invoicesQuery.refetch()}
              className="rounded-2xl"
              leftIcon={<RefreshCw size={14} className={cn(invoicesQuery.isFetching && 'animate-spin')} />}
            >
              Làm mới
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Hóa đơn của tôi"
            value={summary.total}
            hint="Toàn bộ hóa đơn hiện tại"
            icon={<FileText className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" strokeWidth={1.75} />}
          />
          <SummaryCard
            label="Chờ thanh toán"
            value={summary.pending}
            hint="Hóa đơn chưa hoàn tất"
            icon={<Clock className="h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors" strokeWidth={1.75} />}
          />
          <SummaryCard
            label="Tôi đã thanh toán"
            value={formatVND(summary.revenue)}
            hint="Tổng tiền đã chi trả"
            icon={<CheckCircle2 className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" strokeWidth={1.75} />}
          />
          <SummaryCard
            label="Còn nợ quản lý"
            value={formatVND(summary.outstanding)}
            hint="Tổng công nợ hiện tại"
            icon={<AlertTriangle className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" strokeWidth={1.75} />}
          />
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.8fr]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã hóa đơn"
              icon={<Search size={16} />}
              className="h-12"
            />
            <Select
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as 'all' | PortalInvoiceStatus)}
              options={[
                { label: 'Tất cả trạng thái', value: 'all' },
                { label: 'Chờ thanh toán', value: 'pending' },
                { label: 'Thanh toán một phần', value: 'partial' },
                { label: 'Đã thanh toán', value: 'paid' },
                { label: 'Quá hạn', value: 'overdue' },
                { label: 'Đã hủy', value: 'cancelled' },
              ]}
              className="h-12"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-12"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-12"
            />
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value as InvoiceSort)}
              options={[
                { label: 'Hạn thanh toán', value: 'due_date' },
                { label: 'Số tiền', value: 'amount' },
                { label: 'Trạng thái', value: 'status' },
              ]}
              className="h-12"
            />
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
                      <Badge variant={chip.variant} className="uppercase tracking-widest text-[10px]">
                        {chip.label}
                      </Badge>
                    </div>
                    <div>{formatDate(invoice.dueDate)}</div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => openInvoice(invoice.id)}
                        className="rounded-2xl"
                      >
                        Xem
                      </Button>
                    </div>
                  </div>

                  <button type="button" onClick={() => openInvoice(invoice.id)} className="flex w-full flex-col gap-3 text-left md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{invoice.invoiceNumber}</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{invoice.guestName}</p>
                        <p className="text-sm text-slate-500">{invoice.contractCode}</p>
                      </div>
                      <Badge variant={chip.variant} className="uppercase tracking-widest text-[10px]">
                        {chip.label}
                      </Badge>
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
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-2xl"
            >
              Trước
            </Button>
            <span className="px-3 text-sm font-black text-slate-900">{page}/{totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-2xl"
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      <BottomSheet isOpen={!!selectedInvoiceId} onClose={closeInvoice} title={detailQuery.data?.invoiceNumber ?? 'Chi tiết hóa đơn'} height="h-[92vh]">
        <InvoiceDetailContent
          invoice={selectedInvoice}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          error={detailQuery.error as Error | null}
          paymentForm={paymentForm}
          setFormField={setFormField}
          sepayTransferCode={sepayTransferCode}
          sepayAmount={sepayAmount}
          sepayQrValue={sepayQrValue}
          isSimulating={isSimulating}
          showTransferSupportForm={showTransferSupportForm}
          setShowTransferSupportForm={setShowTransferSupportForm}
          simulateSepayPayment={simulateSepayPayment}
          onSubmitPayment={() => paymentMutation.mutate(paymentForm)}
          isSubmittingPayment={paymentMutation.isPending}
        />
      </BottomSheet>
    </div>
  );
};

export default InvoiceList;
