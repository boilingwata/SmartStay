import { AlertCircle, CheckCircle2, Clock, Receipt } from 'lucide-react';
import type { ContractDetail as ContractDetailModel } from '@/models/Contract';
import { getInvoiceStatusMeta } from '@/lib/contractPresentation';
import { cn, formatVND } from '@/utils';

interface InvoicesTabProps {
  contract: ContractDetailModel;
}

export function InvoicesTab({ contract }: InvoicesTabProps) {
  if (!contract.invoices?.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        Hợp đồng này chưa phát sinh hóa đơn.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-bold text-slate-950">Hóa đơn đã phát sinh</h3>
        <p className="text-sm text-slate-500">{contract.invoices.length} hóa đơn đang gắn với hợp đồng này</p>
      </div>

      <div className="divide-y divide-slate-100">
        {contract.invoices.map((invoice) => (
          <div key={invoice.id} className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold text-slate-950">{invoice.invoiceCode}</p>
              <p className="mt-1 text-xs text-slate-500">{invoice.billingPeriod || 'Chưa xác định kỳ thanh toán'}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tổng hóa đơn</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">{formatVND(invoice.totalAmount)}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Còn nợ</p>
              <p className={cn('mt-1 text-sm font-semibold', invoice.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700')}>
                {formatVND(invoice.balanceDue)}
              </p>
            </div>

            <InvoiceStatusBadge status={invoice.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const meta = getInvoiceStatusMeta(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
        meta.tone === 'emerald' && 'bg-emerald-50 text-emerald-700',
        meta.tone === 'amber' && 'bg-amber-50 text-amber-700',
        meta.tone === 'rose' && 'bg-rose-50 text-rose-700',
        meta.tone === 'slate' && 'bg-slate-100 text-slate-600'
      )}
    >
      {meta.tone === 'emerald' ? (
        <CheckCircle2 size={14} />
      ) : meta.tone === 'rose' ? (
        <AlertCircle size={14} />
      ) : meta.tone === 'amber' ? (
        <Clock size={14} />
      ) : (
        <Receipt size={14} />
      )}
      {meta.label}
    </span>
  );
}
