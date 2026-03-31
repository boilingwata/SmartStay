import React, { useState } from 'react';
import { 
  FileText, Plus, AlertTriangle, Eye as EyeIcon, Layers,
  Copy, Check, MoreVertical, CreditCard, Search
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '@/services/invoiceService';
import { buildingService } from '@/services/buildingService';
import { Invoice, InvoiceStatus } from '@/models/Invoice';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { InvoiceFilterBar } from '@/components/invoices/InvoiceFilterBar';
import { InvoiceAdvancedFilter } from '@/components/invoices/InvoiceAdvancedFilter';
import { BulkInvoiceModal } from '@/components/invoices/modals/BulkInvoiceModal';
import { CreateInvoiceModal } from '@/components/invoices/modals/CreateInvoiceModal';
import { RecordPaymentModal } from '@/components/shared/modals/RecordPaymentModal';

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

  // Filters State
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


  const isAdvancedActive = !!(
    advancedFilters.minAmount || 
    advancedFilters.maxAmount || 
    advancedFilters.dueDateFrom || 
    advancedFilters.dueDateTo || 
    advancedFilters.roomCode
  );
  const [page, setPage] = useState(1);
  const limit = 10;

  // Queries
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices', activeTab, searchText, filterBuildingId, filterPeriod, page, advancedFilters],
    queryFn: () => invoiceService.getInvoices({ 
      status: activeTab === 'All' ? undefined : activeTab,
      search: searchText || undefined,
      buildingId: filterBuildingId || undefined,
      period: filterPeriod || undefined,
      ...advancedFilters,
      page,
      limit,
    })
  });

  const invoices = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const { data: counts } = useQuery<Record<InvoiceStatus | 'All', number>>({
    queryKey: ['invoiceCounts'],
    queryFn: () => invoiceService.getInvoiceCounts()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-summary'],
    queryFn: () => buildingService.getBuildings()
  });

  const overdueInvoices = invoices?.filter(i => i.status === 'Overdue') || [];
  const totalOverdueAmount = overdueInvoices.reduce((sum: number, i: Invoice) => sum + (i.totalAmount - i.paidAmount), 0);

  const tabs: { id: InvoiceStatus | 'All'; labelKey: string; color: string }[] = [
    { id: 'All', labelKey: 'pages.invoices.tabs.all', color: 'primary' },
    { id: 'Unpaid', labelKey: 'pages.invoices.tabs.unpaid', color: 'warning' },
    { id: 'Overdue', labelKey: 'pages.invoices.tabs.overdue', color: 'danger' },
    { id: 'Paid', labelKey: 'pages.invoices.tabs.paid', color: 'success' },
    { id: 'Cancelled', labelKey: 'pages.invoices.tabs.cancelled', color: 'muted' },
  ];

  const handleCopyInvoiceCode = (invoiceId: string, invoiceCode: string) => {
    navigator.clipboard.writeText(invoiceCode);
    setCopiedInvoiceId(invoiceId);
    toast.success(t('pages.invoices.copiedCode'));
    setTimeout(() => setCopiedInvoiceId(null), 2000);
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
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-serif font-black tracking-tight text-primary leading-tight">
            {t('pages.invoices.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium">
            {t('pages.invoices.description')}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start lg:self-end">
          <button 
            className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95" 
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Layers size={18} className="text-secondary transition-transform group-hover:rotate-12" /> 
            {t('pages.invoices.createBulk')}
          </button>
          <button 
            className="group flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={20} className="transition-transform group-hover:scale-125" /> 
            {t('pages.invoices.create')}
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner */}
      {overdueInvoices.length > 0 && (
        <div className="sticky top-4 z-20 overflow-hidden bg-white/40 backdrop-blur-xl border border-destructive/20 p-4 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-in slide-in-from-top duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-danger/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center shadow-inner">
              <AlertTriangle size={24} className="animate-bounce" />
            </div>
            <div>
              <p className="text-lg font-serif font-bold text-danger leading-none">
                {overdueInvoices.length} {t('pages.invoices.overdueBannerTitle') || "hóa đơn quá hạn"}
              </p>
              <p className="text-sm text-danger/80 font-medium">
                {t('pages.invoices.overdueTotal') || "Tổng nợ"}: <span className="font-bold">{formatVND(totalOverdueAmount)}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('Overdue')}
            className="relative z-10 px-6 py-2.5 bg-danger text-white text-sm font-bold rounded-xl shadow-lg shadow-danger/20 hover:bg-danger/90 transition-all active:scale-95"
          >
            {t('pages.invoices.filterOverdue') || "Lọc quá hạn ngay"}
          </button>
        </div>
      )}

      {/* Tabs & Filters Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl w-fit border border-white/40 shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2 text-sm font-bold transition-all rounded-xl",
                activeTab === tab.id 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              )}
            >
              {t(tab.labelKey)}
              {counts && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] min-w-[20px] font-black tracking-tighter",
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary" 
                    : "bg-slate-300/50 text-muted-foreground"
                )}>
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
          onReset={() => setAdvancedFilters({
            minAmount: undefined,
            maxAmount: undefined,
            dueDateFrom: '',
            dueDateTo: '',
            roomCode: '',
          })}
        />
      </div>

      {isError && <ErrorBanner message={t('toasts.error.generic')} onRetry={() => refetch()} />}

      {/* DataTable Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-premium">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">{t('pages.invoices.table.invoiceCode')}</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">{t('pages.invoices.table.target')}</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">{t('pages.invoices.table.period')}</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">{t('pages.invoices.table.amount')}</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground text-center">{t('pages.invoices.table.status')}</th>
                  <th className="px-6 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">{t('pages.invoices.table.dueDate')}</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-wider text-muted-foreground text-right">{t('pages.invoices.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-32 text-center text-muted-foreground">
                      <Spinner />
                      <p className="mt-4 font-medium animate-pulse">Đang tải dữ liệu hóa đơn...</p>
                    </td>
                  </tr>
                ) : !invoices.length ? (
                  <tr>
                    <td colSpan={7} className="py-24">
                      <EmptyState
                        icon={FileText}
                        title={t('pages.invoices.emptyTitle')}
                        message={t('pages.invoices.emptyMessage')}
                        actionLabel={t('pages.invoices.create')}
                        onAction={() => setIsCreateModalOpen(true)}
                      />
                    </td>
                  </tr>
                ) : invoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="group/row hover:bg-slate-50/80 transition-all duration-300"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3 group/code">
                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary transition-transform group-hover/row:scale-110">
                          <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span 
                            className="font-serif font-black text-primary hover:underline cursor-pointer tracking-tight" 
                            onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                          >
                            {invoice.invoiceCode}
                          </span>
                          <button 
                            onClick={() => handleCopyInvoiceCode(invoice.id, invoice.invoiceCode)}
                            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-secondary transition-colors uppercase text-left"
                          >
                            {copiedInvoiceId === invoice.id ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                            Sao chép
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-black rounded-md uppercase">
                             {invoice.roomCode}
                           </span>
                           <span className="text-sm font-bold text-slate-800">{invoice.tenantName}</span>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 leading-none italic">
                          Hợp đồng: <span className="font-mono">{invoice.contractCode}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-bold text-slate-700">T{invoice.period.split('-')[1]} • {invoice.period.split('-')[0]}</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{t('pages.invoices.periodLabel') || "Kỳ thanh toán"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col leading-none gap-1">
                        <span className="text-base font-serif font-black text-primary tracking-tight">
                          {formatVND(invoice.totalAmount)}
                        </span>
                        {(invoice.totalAmount - invoice.paidAmount) > 0 && (
                          <span className="text-[10px] font-bold text-danger/80">
                            Còn nợ: {formatVND(invoice.totalAmount - invoice.paidAmount)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge status={invoice.status} className="scale-110 shadow-sm" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col leading-tight">
                        <span className={cn(
                          "text-sm font-bold",
                          invoice.status === 'Overdue' ? "text-danger" : 
                          differenceInDays(parseISO(invoice.dueDate), new Date()) < 3 && invoice.status !== 'Paid' ? "text-warning" : "text-slate-700"
                        )}>
                          {formatDate(invoice.dueDate)}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">{t('pages.invoices.dueDateLabel') || "Hạn chót"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm active:scale-90" 
                          title="Xem chi tiết" 
                          onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                        >
                          <EyeIcon size={18} />
                        </button>
                        <button 
                          className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-muted-foreground hover:bg-success/5 hover:text-success hover:border-success/20 transition-all shadow-sm active:scale-90" 
                          title="Thu tiền"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard size={18} />
                        </button>
                        <button 
                          className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-muted-foreground hover:bg-slate-50 transition-all shadow-sm active:scale-90" 
                          title="Tùy chọn"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Hiển thị <span className="font-bold text-foreground">{invoices.length}</span> / <span className="font-bold text-foreground">{total}</span> hóa đơn
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl disabled:opacity-50 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={cn(
                        "w-9 h-9 text-sm font-black rounded-xl transition-all active:scale-90 shadow-sm",
                        page === i + 1 ? "bg-primary text-white" : "bg-white text-muted-foreground border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl disabled:opacity-50 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
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
