import React, { useState } from 'react';
import { 
  FileText, Plus, Download, Search, Filter, 
  MoreVertical, Eye, CreditCard, Send, Printer, 
  Trash2, AlertTriangle, Building2, Calendar, 
  History, CheckCircle2, XCircle, Clock, Eye as EyeIcon, Layers,
  Copy, Check
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '@/services/invoiceService';
import { Invoice, InvoiceStatus } from '@/models/Invoice';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { EmptyState, ErrorBanner } from '@/components/ui/StatusStates';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { CreateInvoiceModal } from '@/components/invoices/modals/CreateInvoiceModal';
import { BulkInvoiceModal } from '@/components/invoices/modals/BulkInvoiceModal';
import { RecordPaymentModal } from '@/components/shared/modals/RecordPaymentModal';

const InvoiceList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<InvoiceStatus | 'All'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Queries
  const { data: invoices, isLoading, isError, refetch } = useQuery<Invoice[]>({
    queryKey: ['invoices', activeTab],
    queryFn: () => invoiceService.getInvoices({ 
      status: activeTab === 'All' ? undefined : activeTab 
    })
  });

  const { data: counts } = useQuery<Record<InvoiceStatus | 'All', number>>({
    queryKey: ['invoiceCounts'],
    queryFn: () => invoiceService.getInvoiceCounts()
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

  const getRowStyle = (invoice: any) => {
    if (invoice.status === 'Overdue') return 'bg-danger/5';
    if (invoice.status === 'Unpaid' && differenceInDays(parseISO(invoice.dueDate), new Date()) <= 3) return 'bg-warning/5';
    if (invoice.status === 'Paid') return 'opacity-80';
    if (invoice.status === 'Cancelled') return 'opacity-60 grayscale line-through';
    return '';
  };

  const handleCopyInvoiceCode = (invoiceId: string, invoiceCode: string) => {
    navigator.clipboard.writeText(invoiceCode);
    setCopiedInvoiceId(invoiceId);
    toast.success(t('pages.invoices.copiedCode'));
    setTimeout(() => setCopiedInvoiceId(null), 2000); // Reset after 2 seconds
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-primary">{t('pages.invoices.title')}</h1>
          <p className="text-body text-muted">{t('pages.invoices.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2" onClick={() => setIsBulkModalOpen(true)}>
            <Layers size={18} /> {t('pages.invoices.createBulk')}
          </button>
          <button className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} /> {t('pages.invoices.create')}
          </button>
        </div>
      </div>

      {/* 3.1.2 Sticky Overdue Alert Bar */}
      {overdueInvoices.length > 0 && (
        <div className="sticky top-4 z-10 bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-500 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-danger/10 text-danger rounded-full flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-body font-bold text-danger">
                {overdueInvoices.length} hóa đơn quá hạn — Tổng nợ: {formatVND(totalOverdueAmount)}
              </p>
              <p className="text-small text-danger/70">Yêu cầu nhắc nhở thanh toán để đảm bảo dòng tiền.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('Overdue')}
            className="text-small font-bold text-destructive hover:underline px-4 py-2 bg-card rounded-xl shadow-sm border border-destructive/10 transition-all"
          >
            Lọc quá hạn
          </button>
        </div>
      )}

      {/* 3.1.1 Tab Bar with badges */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-6 py-3 text-small font-bold transition-all rounded-t-xl",
              activeTab === tab.id 
                ? "text-primary bg-card border-b-2 border-primary shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.1)]" 
                : "text-muted hover:text-foreground hover:bg-muted/10"
            )}
          >
            {t(tab.labelKey)}
            {counts && (
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-full text-[10px] min-w-[18px] inline-block text-center",
                tab.id === 'Overdue' && counts.Overdue > 0 ? "bg-danger text-white animate-pulse" : "bg-bg text-muted"
              )}>
                {counts[tab.id as keyof typeof counts] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3.1.3 Filter Panel */}
      <div className="card-container p-4 bg-card/60 backdrop-blur-md">
         <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="col-span-1 md:col-span-2 relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
               <input type="text" placeholder="Tìm theo mã HĐ, tên cư dân..." className="input-base w-full pl-10" />
            </div>
            <select className="input-base">
               <option>Tất cả tòa nhà</option>
            </select>
            <input type="month" className="input-base" />
            <div className="flex items-center gap-2">
               <button className="btn-outline flex-1"><Filter size={16} /> Lọc</button>
               <button className="btn-outline p-2"><History size={16} /></button>
            </div>
         </div>
      </div>

      {isError && <ErrorBanner message={t('toasts.error.generic')} onRetry={() => refetch()} />}

      {/* 3.1.4 DataTable */}
      <div className="card-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/10 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.invoiceCode')}</th>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.contractRoom')}</th>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.tenant')}</th>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.period')}</th>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.totalAmount')}</th>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.remaining')}</th>
                <th className="px-6 py-4 text-label text-muted text-center">{t('pages.invoices.table.status')}</th>
                <th className="px-6 py-4 text-label text-muted">{t('pages.invoices.table.dueDate')}</th>
                <th className="px-6 py-4 text-label text-muted text-center">{t('pages.invoices.table.viewed')}</th>
                <th className="px-6 py-4 text-label text-muted text-right">{t('pages.invoices.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center"><Spinner /></td>
                </tr>
              ) : !invoices?.length ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={FileText}
                      title={t('pages.invoices.emptyTitle')}
                      message={t('pages.invoices.emptyMessage')}
                      actionLabel={t('pages.invoices.create')}
                      onAction={() => setIsCreateModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : invoices?.map((invoice) => (
                <tr key={invoice.id} className={cn("group transition-colors", getRowStyle(invoice))}>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2 group/code">
                        <span 
                          className="font-mono font-bold text-primary group-hover/code:underline cursor-pointer" 
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                        >
                          {invoice.invoiceCode}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyInvoiceCode(invoice.id, invoice.invoiceCode);
                          }}
                          className="opacity-0 group-hover/code:opacity-100 p-1 hover:bg-muted/20 rounded transition-all"
                          title="Copy"
                        >
                          {copiedInvoiceId === invoice.id ? (
                            <Check size={12} className="text-success" />
                          ) : (
                            <Copy size={12} className="text-muted" />
                          )}
                        </button>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-body font-bold text-text">{invoice.roomCode}</span>
                        <span className="text-[10px] text-muted">{invoice.contractCode}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {invoice.tenantName.charAt(0)}
                        </div>
                        <span className="text-body font-medium">{invoice.tenantName}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-body text-text">Tháng {invoice.period.split('-')[1]}/{invoice.period.split('-')[0]}</td>
                   <td className="px-6 py-4 font-display font-bold text-primary">{formatVND(invoice.totalAmount)}</td>
                   <td className="px-6 py-4">
                      <span className={cn(
                        "font-display font-bold",
                        (invoice.totalAmount - invoice.paidAmount) > 0 ? "text-danger" : "text-success"
                      )}>
                        {formatVND(invoice.totalAmount - invoice.paidAmount)}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <StatusBadge status={invoice.status} />
                   </td>
                   <td className="px-6 py-4 text-body">
                      <span className={cn(
                        invoice.status === 'Overdue' ? "text-danger font-bold" : 
                        differenceInDays(parseISO(invoice.dueDate), new Date()) < 3 ? "text-warning font-bold" : "text-text"
                      )}>
                        {formatDate(invoice.dueDate)}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-center">
                     <div className="flex flex-col items-center gap-0.5">
                       {invoice.hasViewed ? (
                         <>
                           <EyeIcon size={16} className="text-success" />
                           <span className="text-[9px] text-muted">{invoice.viewCount} lần</span>
                         </>
                       ) : <Clock size={16} className="text-muted/30" />}
                     </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 hover:bg-bg rounded-lg text-muted hover:text-primary transition-all" title="Xem chi tiết" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                          <Eye size={18} />
                        </button>
                        <button 
                          className="p-2 hover:bg-bg rounded-lg text-muted hover:text-success transition-all" 
                          title="Thu tiền"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <CreditCard size={18} />
                        </button>
                        <div className="w-px h-4 bg-border/50 mx-1"></div>
                        <button className="p-2 hover:bg-bg rounded-lg text-muted hover:text-accent transition-all" title="Thêm">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateInvoiceModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <BulkInvoiceModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
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
