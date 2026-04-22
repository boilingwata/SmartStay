import React, { useEffect, useState } from 'react';
import { AlertTriangle, BellRing, Check, ChevronRight, Copy, CreditCard, FileText, Layers, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { invoiceService } from '@/services/invoiceService';
import { buildingService } from '@/services/buildingService';
import { Invoice, InvoiceStatus } from '@/models/Invoice';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatDate, formatVND } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';
import { InvoiceFilterBar } from '@/components/invoices/InvoiceFilterBar';
import { InvoiceAdvancedFilter } from '@/components/invoices/InvoiceAdvancedFilter';
import { BulkInvoiceModal } from '@/components/invoices/modals/BulkInvoiceModal';
import { CreateInvoiceModal } from '@/components/invoices/modals/CreateInvoiceModal';
import { RecordPaymentModal } from '@/components/shared/modals/RecordPaymentModal';
import { useAdminFinanceRealtime } from '@/hooks/useAdminFinanceRealtime';

const getInvoicePeriodLabel = (period: string) => {
  const [year, month] = period.split('-');
  return `Tháng ${month}/${year}`;
};

const getRemainingAmount = (invoice: Invoice) => Math.max(0, invoice.totalAmount - invoice.paidAmount);

const canRecordPayment = (invoice: Invoice) =>
  (invoice.status === 'Unpaid' || invoice.status === 'Overdue') && getRemainingAmount(invoice) > 0;

const canSendReminder = (invoice: Invoice) => invoice.status === 'Unpaid' || invoice.status === 'Overdue';

const getDueDateClassName = (invoice: Invoice) => {
  if (invoice.status === 'Overdue') return 'text-danger';
  if (invoice.status !== 'Paid' && differenceInDays(parseISO(invoice.dueDate), new Date()) < 3) return 'text-warning';
  return 'text-slate-700';
};

const stopRowClick: React.MouseEventHandler<HTMLElement> = (event) => {
  event.stopPropagation();
};

const InvoiceList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<InvoiceStatus | 'All'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterBuildingId, setFilterBuildingId] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any>({
    minAmount: undefined,
    maxAmount: undefined,
    dueDateFrom: '',
    dueDateTo: '',
    roomCode: '',
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  useAdminFinanceRealtime();

  const isAdvancedActive = !!(
    advancedFilters.minAmount ||
    advancedFilters.maxAmount ||
    advancedFilters.dueDateFrom ||
    advancedFilters.dueDateTo ||
    advancedFilters.roomCode
  );

  useEffect(() => {
    setPage(1);
  }, [searchText, filterBuildingId, filterPeriod, advancedFilters]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices', activeTab, searchText, filterBuildingId, filterPeriod, page, advancedFilters],
    queryFn: () =>
      invoiceService.getInvoices({
        status: activeTab === 'All' ? undefined : activeTab,
        search: searchText || undefined,
        buildingId: filterBuildingId || undefined,
        period: filterPeriod || undefined,
        ...advancedFilters,
        page,
        limit,
      }),
  });

  const invoices = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const { data: counts } = useQuery<Record<InvoiceStatus | 'All', number>>({
    queryKey: ['invoiceCounts'],
    queryFn: () => invoiceService.getInvoiceCounts(),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings(),
  });

  const overdueInvoices = invoices.filter((invoice) => invoice.status === 'Overdue');
  const totalOverdueAmount = overdueInvoices.reduce((sum, invoice) => sum + getRemainingAmount(invoice), 0);

  const tabs: { id: InvoiceStatus | 'All'; labelKey: string }[] = [
    { id: 'All', labelKey: 'pages.invoices.tabs.all' },
    { id: 'Unpaid', labelKey: 'pages.invoices.tabs.unpaid' },
    { id: 'Overdue', labelKey: 'pages.invoices.tabs.overdue' },
    { id: 'Paid', labelKey: 'pages.invoices.tabs.paid' },
    { id: 'Cancelled', labelKey: 'pages.invoices.tabs.cancelled' },
  ];

  const handleCopyInvoiceCode = (invoiceId: string, invoiceCode: string) => {
    navigator.clipboard.writeText(invoiceCode);
    setCopiedInvoiceId(invoiceId);
    toast.success(t('pages.invoices.copiedCode'));
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  const handleSendReminder = async (invoiceId: string) => {
    await invoiceService.sendNotification(invoiceId);
    toast.success('Đã gửi nhắc thanh toán');
  };

  const handleResetFilters = () => {
    setSearchText('');
    setFilterBuildingId('');
    setFilterPeriod('');
    setAdvancedFilters({
      minAmount: undefined,
      maxAmount: undefined,
      dueDateFrom: '',
      dueDateTo: '',
      roomCode: '',
    });
    setPage(1);
  };

  return (
    <div className="animate-in space-y-8 fade-in font-sans duration-700">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl font-black leading-tight tracking-tight text-primary">
            {t('pages.invoices.title')}
          </h1>
          <p className="max-w-2xl text-lg font-medium text-muted-foreground">{t('pages.invoices.description')}</p>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-end">
          <button
            className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Layers size={18} className="text-secondary transition-transform group-hover:rotate-12" />
            {t('pages.invoices.createBulk')}
          </button>
          <button
            className="group flex items-center gap-2 rounded-2xl bg-primary px-6 py-2.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={20} className="transition-transform group-hover:scale-125" />
            {t('pages.invoices.create')}
          </button>
        </div>
      </div>

      {overdueInvoices.length > 0 && (
        <div className="sticky top-4 z-20 flex flex-col items-center justify-between gap-4 overflow-hidden rounded-[2rem] border border-destructive/20 bg-white/40 p-4 shadow-xl backdrop-blur-xl animate-in slide-in-from-top duration-500 sm:flex-row">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-danger/5 to-transparent" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger shadow-inner">
              <AlertTriangle size={24} className="animate-bounce" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold leading-none text-danger">
                {overdueInvoices.length} {t('pages.invoices.overdueBannerTitle') || 'hóa đơn quá hạn'}
              </p>
              <p className="text-sm font-medium text-danger/80">
                {t('pages.invoices.overdueTotal') || 'Tổng nợ'}: <span className="font-bold">{formatVND(totalOverdueAmount)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('Overdue');
              setPage(1);
            }}
            className="relative z-10 rounded-xl bg-danger px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-danger/20 transition-all hover:bg-danger/90 active:scale-95"
          >
            {t('pages.invoices.filterOverdue') || 'Lọc quá hạn ngay'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex w-fit flex-wrap items-center gap-1.5 rounded-2xl border border-white/40 bg-slate-200/50 p-1.5 shadow-inner backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={cn(
                'relative flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-white/50 hover:text-foreground'
              )}
            >
              {t(tab.labelKey)}
              {counts && (
                <span
                  className={cn(
                    'min-w-[20px] rounded-full px-2 py-0.5 text-[10px] font-black tracking-tighter',
                    activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-300/50 text-muted-foreground'
                  )}
                >
                  {counts[tab.id as keyof typeof counts] || 0}
                </span>
              )}
            </button>
          ))}
        </div>

        <InvoiceFilterBar
          searchText={searchText}
          setSearchText={setSearchText}
          buildingId={filterBuildingId}
          setBuildingId={setFilterBuildingId}
          period={filterPeriod}
          setPeriod={setFilterPeriod}
          buildings={buildings}
          onReset={handleResetFilters}
          isAdvancedExpanded={isAdvancedExpanded}
          onToggleAdvanced={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
          isAdvancedActive={isAdvancedActive}
        />

        <InvoiceAdvancedFilter
          isExpanded={isAdvancedExpanded}
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onReset={() =>
            setAdvancedFilters({
              minAmount: undefined,
              maxAmount: undefined,
              dueDateFrom: '',
              dueDateTo: '',
              roomCode: '',
            })
          }
        />
      </div>

      {isError && (
        <ErrorBanner
          message="Không tải được danh sách hóa đơn theo bộ lọc hiện tại. Vui lòng thử lại hoặc đặt lại bộ lọc."
          onRetry={() => refetch()}
        />
      )}

      <div className="group relative">
        <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 blur opacity-25 transition duration-1000 group-hover:opacity-50" />
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 shadow-premium backdrop-blur-md">
          <div className="hidden gap-4 border-b border-slate-100 bg-slate-50/60 px-8 py-5 xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.55fr)_minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(240px,1fr)]">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Mã hóa đơn</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Đối tượng / Phòng</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Kỳ</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Số tiền</div>
            <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Hạn TT</div>
            <div className="text-right text-[11px] font-black uppercase tracking-wider text-muted-foreground">Thao tác</div>
          </div>

          {isLoading ? (
            <div className="py-32 text-center text-muted-foreground">
              <Spinner />
              <p className="mt-4 animate-pulse font-medium">Đang tải dữ liệu hóa đơn...</p>
            </div>
          ) : !invoices.length ? (
            <div className="py-24">
              <EmptyState
                icon={FileText}
                title={t('pages.invoices.emptyTitle')}
                message={t('pages.invoices.emptyMessage')}
                actionLabel={t('pages.invoices.create')}
                onAction={() => setIsCreateModalOpen(true)}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100/70">
              {invoices.map((invoice) => {
                const remainingAmount = getRemainingAmount(invoice);
                const paymentEnabled = canRecordPayment(invoice);
                const reminderEnabled = canSendReminder(invoice);
                const goToDetail = () => navigate(`/owner/invoices/${invoice.id}`);

                return (
                  <div
                    key={invoice.id}
                    className="group/row cursor-pointer px-5 py-5 transition-all duration-300 hover:bg-slate-50/80 sm:px-6 xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.55fr)_minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(240px,1fr)] xl:items-center xl:gap-4 xl:px-8"
                    onClick={goToDetail}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        goToDetail();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Xem chi tiết hóa đơn ${invoice.invoiceCode}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary transition-transform group-hover/row:scale-110">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-serif text-base font-black tracking-tight text-primary">{invoice.invoiceCode}</span>
                            <ChevronRight size={16} className="shrink-0 text-slate-300 transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-primary" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={invoice.status} className="max-w-full shadow-sm" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 min-w-0 space-y-1 xl:mt-0">
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground xl:hidden">Đối tượng / Phòng</p>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="shrink-0 rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-black uppercase text-secondary">
                          {invoice.roomCode}
                        </span>
                        <span className="truncate text-sm font-bold text-slate-800">{invoice.tenantName}</span>
                      </div>
                      <p className="truncate text-[11px] font-medium italic text-muted-foreground">
                        Hợp đồng: <span className="font-mono not-italic">{invoice.contractCode}</span>
                      </p>
                      <p className="truncate text-[11px] font-medium text-muted-foreground">Tòa nhà: {invoice.buildingName}</p>
                    </div>

                    <div className="mt-4 space-y-1 xl:mt-0">
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground xl:hidden">Kỳ</p>
                      <p className="text-sm font-bold text-slate-700">{getInvoicePeriodLabel(invoice.period)}</p>
                      <p className="text-[11px] font-medium uppercase text-muted-foreground">
                        {t('pages.invoices.periodLabel') || 'Kỳ thanh toán'}
                      </p>
                    </div>

                    <div className="mt-4 min-w-0 space-y-1 xl:mt-0">
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground xl:hidden">Số tiền</p>
                      <p className="truncate font-serif text-base font-black tracking-tight text-primary">
                        {formatVND(invoice.totalAmount)}
                      </p>
                      {remainingAmount > 0 ? (
                        <p className="truncate text-[11px] font-bold text-danger/80">Còn nợ: {formatVND(remainingAmount)}</p>
                      ) : (
                        <p className="text-[11px] font-semibold text-success">Đã thanh toán đủ</p>
                      )}
                    </div>

                    <div className="mt-4 space-y-1 xl:mt-0">
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground xl:hidden">Hạn TT</p>
                      <p className={cn('text-sm font-bold', getDueDateClassName(invoice))}>{formatDate(invoice.dueDate)}</p>
                      <p className="text-[11px] font-medium uppercase text-muted-foreground">
                        {invoice.status === 'Paid' ? 'Đã hoàn tất' : 'Hạn thanh toán'}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row xl:mt-0 xl:justify-end">
                      {reminderEnabled && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-bold text-amber-700 shadow-sm transition-all hover:bg-amber-50 active:scale-95"
                          onClick={async (event) => {
                            stopRowClick(event);
                            await handleSendReminder(invoice.id);
                          }}
                        >
                          <BellRing size={15} />
                          Nhắc nợ
                        </button>
                      )}
                      {paymentEnabled ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-success/20 transition-all hover:bg-success/90 active:scale-95"
                          onClick={(event) => {
                            stopRowClick(event);
                            setSelectedInvoice(invoice);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard size={16} />
                          Thu tiền
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-secondary/20 hover:bg-secondary/5 hover:text-secondary active:scale-95"
                          onClick={(event) => {
                            stopRowClick(event);
                            handleCopyInvoiceCode(invoice.id, invoice.invoiceCode);
                          }}
                        >
                          {copiedInvoiceId === invoice.id ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                          Sao chép mã
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Hiển thị <span className="font-bold text-foreground">{invoices.length}</span> / <span className="font-bold text-foreground">{total}</span> hóa đơn
              </p>
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  Trước
                </button>
                <div className="flex flex-wrap items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPage(index + 1)}
                      className={cn(
                        'h-9 w-9 rounded-xl text-sm font-black shadow-sm transition-all active:scale-90',
                        page === index + 1
                          ? 'bg-primary text-white'
                          : 'border border-slate-200 bg-white text-muted-foreground hover:bg-slate-50'
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });
        }}
      />

      <BulkInvoiceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });
        }}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoiceList;
