import React from 'react';
import { 
  CheckCircle2, 
  Landmark, 
  Wallet, 
  FileText, 
  User, 
  Calendar, 
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import { Skeleton, Spinner } from '@/components/ui';
import { 
  formatDate, 
  formatVND, 
  cn 
} from '@/utils';
import type { PortalInvoiceDetail, PortalInvoiceStatus } from '@/services/portalInvoiceService';
import type { DbPaymentMethod } from '@/types/supabase';

type PaymentFormFields = {
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

interface InvoiceDetailContentProps {
  invoice: PortalInvoiceDetail | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  paymentForm: PaymentFormFields;
  setFormField: <K extends keyof PaymentFormFields>(field: K, value: PaymentFormFields[K]) => void;
  sepayTransferCode: string;
  sepayAmount: number;
  sepayQrValue: string | null;
  isSimulating: boolean;
  showTransferSupportForm: boolean;
  setShowTransferSupportForm: (show: boolean) => void;
  simulateSepayPayment: () => Promise<void>;
  onSubmitPayment: () => void;
  isSubmittingPayment: boolean;
}

const SummaryCard = ({ label, value, hint, variant = 'default' }: { 
  label: string; 
  value: string; 
  hint: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const variantStyles = {
    default: 'border-slate-200 bg-white text-slate-900',
    success: 'border-success/30 bg-success/5 text-success',
    warning: 'border-warning/30 bg-warning/5 text-warning',
    danger: 'border-destructive/30 bg-destructive/5 text-destructive',
  };

  return (
    <div className={cn("rounded-[28px] border p-5 shadow-sm transition-all duration-300", variantStyles[variant])}>
      <p className="text-[11px] font-black uppercase leading-tight tracking-[0.22em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs opacity-60">{hint}</p>
    </div>
  );
};

const InfoRow = ({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 px-4 py-3 border border-slate-100/50">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 break-all">{value}</p>
    </div>
    {copyValue && (
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copyValue);
            // toast is handled by caller or we can import it
          } catch { /* ignore */ }
        }}
        className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
      >
        Sao chép
      </button>
    )}
  </div>
);

export const InvoiceDetailSkeleton = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid gap-4 md:grid-cols-3">
      <Skeleton className="h-28 rounded-[28px]" />
      <Skeleton className="h-28 rounded-[28px]" />
      <Skeleton className="h-28 rounded-[28px]" />
    </div>
    <div className="rounded-[28px] border border-slate-100 bg-white p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 rounded-[28px]" />
      <Skeleton className="h-32 rounded-[28px]" />
    </div>
  </div>
);

const getStatusChip = (status: PortalInvoiceStatus) =>
  ({
    pending: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    partial: { label: 'Thanh toán một phần', className: 'bg-sky-50 text-sky-700 border-sky-200' },
    paid: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    overdue: { label: 'Quá hạn', className: 'bg-rose-50 text-rose-700 border-rose-200' },
    cancelled: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  })[status];

export const InvoiceDetailContent: React.FC<InvoiceDetailContentProps> = ({
  invoice,
  isLoading,
  isError,
  error,
  paymentForm,
  setFormField,
  sepayTransferCode,
  sepayAmount,
  sepayQrValue,
  isSimulating,
  showTransferSupportForm,
  setShowTransferSupportForm,
  simulateSepayPayment,
  onSubmitPayment,
  isSubmittingPayment,
}) => {
  if (isLoading) return <InvoiceDetailSkeleton />;

  if (isError || !invoice) {
    return (
      <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="mx-auto text-destructive" size={40} strokeWidth={1.5} />
        <h3 className="mt-4 text-lg font-black text-slate-900">Không thể tải chi tiết hóa đơn</h3>
        <p className="mt-2 text-sm text-muted">
          {error?.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.'}
        </p>
      </div>
    );
  }

  const statusInfo = getStatusChip(invoice.status);

  return (
    <div className="space-y-6 pb-12 animate-in slide-in-from-bottom-4 duration-500">
      {/* 1. Header Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard 
          label="Còn lại" 
          value={formatVND(invoice.balance)} 
          hint="Số dư hiện tại"
          variant={invoice.balance > 0 ? (invoice.status === 'overdue' ? 'danger' : 'warning') : 'success'}
        />
        <SummaryCard label="Tổng tiền" value={formatVND(invoice.amountDue)} hint="Tổng giá trị hóa đơn" />
        <SummaryCard label="Đã thanh toán" value={formatVND(invoice.amountPaid)} hint="Khoản đã xác nhận" />
      </div>

      {/* 2. Customer & Contract Info */}
      <div className="group rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <User size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Khách thuê</p>
              <p className="mt-1 font-black text-slate-900 leading-tight">{invoice.guestName}</p>
              <p className="text-xs text-slate-500 mt-1">{invoice.guestPhone || 'Chưa có số điện thoại'}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <ClipboardCheck size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Hợp đồng</p>
              <p className="mt-1 font-black text-slate-900 leading-tight">{invoice.contractCode}</p>
              <p className="text-xs text-slate-500 mt-1">
                {invoice.buildingName} {invoice.roomCode ? `• Phòng ${invoice.roomCode}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Calendar size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Hạn thanh toán</p>
              <p className="mt-1 font-bold text-slate-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <FileText size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Trạng thái</p>
              <span className={cn('mt-1 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border', statusInfo.className)}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Line Items */}
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          Chi tiết dòng phí
        </h3>
        <div className="space-y-3">
          {invoice.lineItems.length === 0 ? (
            <p className="text-sm text-muted py-4 italic">Hóa đơn này chưa có dòng phí nào.</p>
          ) : (
            invoice.lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{item.description}</p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {item.quantity} x {formatVND(item.unitPrice)}
                  </p>
                </div>
                <p className="font-black text-slate-900">{formatVND(item.lineTotal)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Payment Options or Success Banner */}
      {invoice.balance > 0 ? (
        <section className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">Thanh toán ngay</h3>
              <p className="text-sm text-slate-500">Vui lòng chọn phương thức phù hợp</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cần thanh toán</p>
              <p className="text-xl font-black text-primary tracking-tight">{formatVND(invoice.balance)}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {( [
              { value: 'bank_transfer', label: 'Chuyển khoản', icon: Landmark, desc: 'Tự động duyệt qua SePay' },
              { value: 'cash', label: 'Tiền mặt', icon: Wallet, desc: 'Nộp tại ban quản lý' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormField('method', opt.value)}
                className={cn(
                  'flex items-center gap-4 rounded-[24px] border p-4 text-left transition-all duration-300 active:scale-[0.98]',
                  paymentForm.method === opt.value
                    ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                    : 'border-white bg-white text-slate-700 hover:border-slate-200'
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors",
                  paymentForm.method === opt.value ? 'bg-white/20' : 'bg-slate-100'
                )}>
                  <opt.icon size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <span className="block text-xs font-black uppercase tracking-[0.16em]">{opt.label}</span>
                  <span className={cn('mt-0.5 block text-[11px] opacity-70 font-medium')}>{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {paymentForm.method === 'bank_transfer' && (
            <div className="space-y-4 animate-in zoom-in-95 duration-300">
              <div className="rounded-[28px] border border-teal-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
                    <CheckCircle2 size={16} />
                  </div>
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Chuyển khoản tự động (SePay)</h4>
                </div>

                <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-2xl border-4 border-slate-50 bg-white p-3 shadow-inner">
                      {sepayQrValue ? (
                        <img src={sepayQrValue} alt="VietQR" className="w-[180px] h-[180px] object-contain" />
                      ) : (
                        <div className="flex h-[180px] w-[180px] items-center justify-center text-center text-[11px] text-slate-400 p-4 leading-relaxed">
                          Chưa cấu hình ngân hàng.
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-center text-slate-500 max-w-[180px] font-medium leading-relaxed">
                      Ưu tiên quét mã để tránh sai sót thông tin.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <InfoRow label="Ngân hàng" value={invoice.bankDetails?.bankName || '---'} copyValue={invoice.bankDetails?.bankName} />
                    <InfoRow label="Số tài khoản" value={invoice.bankDetails?.accountNumber || '---'} copyValue={invoice.bankDetails?.accountNumber} />
                    <InfoRow label="Chủ tài khoản" value={invoice.bankDetails?.accountName || '---'} copyValue={invoice.bankDetails?.accountName} />
                    <InfoRow label="Số tiền" value={formatVND(sepayAmount)} />
                    <InfoRow label="Nội dung" value={sepayTransferCode} copyValue={sepayTransferCode} />
                    
                    {import.meta.env.VITE_DEMO_MODE === 'true' && (
                      <button
                        type="button"
                        onClick={simulateSepayPayment}
                        disabled={isSimulating}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50 transition-all active:scale-[0.98]"
                      >
                        {isSimulating ? <Spinner size="sm" className="text-white" /> : null}
                        {isSimulating ? 'Đang xử lý...' : '[DEMO] Giả lập thanh toán SePay'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual Confirmation Toggle */}
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm">Đối soát thủ công</h4>
                    <p className="text-xs text-slate-500">Chỉ dùng khi đã chuyển khoản nhưng hệ thống chưa tự duyệt.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTransferSupportForm(!showTransferSupportForm)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
                  >
                    {showTransferSupportForm ? 'Đóng' : 'Nhập thông tin'}
                  </button>
                </div>

                {showTransferSupportForm && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Số tiền đã chuyển</label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setFormField('amount', e.target.value)}
                        className="input-base h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mã tham chiếu / Transaction ID</label>
                      <input
                        value={paymentForm.transferReference}
                        onChange={(e) => setFormField('transferReference', e.target.value)}
                        className="input-base h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                    {/* Additional fields hidden in summary but can be expanded */}
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        disabled={isSubmittingPayment}
                        onClick={onSubmitPayment}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                      >
                        {isSubmittingPayment ? <Spinner size="sm" className="text-white" /> : <Landmark size={14} />}
                        Gửi thông tin xác nhận
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentForm.method === 'cash' && (
            <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 animate-in zoom-in-95 duration-300">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-amber-200/50 flex items-center justify-center text-amber-700">
                  <Wallet size={20} strokeWidth={1.75} />
                </div>
                <div className="space-y-2">
                  <p className="font-black uppercase tracking-widest text-xs">Hướng dẫn thanh toán tiền mặt</p>
                  <p className="leading-relaxed opacity-90">
                    Vui lòng mang theo mã hóa đơn <span className="font-bold">#{invoice.invoiceNumber}</span> đến trực tiếp ban quản lý tòa nhà để nộp tiền. 
                    Nhân viên sẽ thu tiền và tất toán hóa đơn trực tiếp cho bạn trên hệ thống.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[32px] border border-emerald-200 bg-emerald-50/50 p-10 text-center space-y-4 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-100 p-5 text-emerald-600 shadow-sm">
              <CheckCircle2 size={56} strokeWidth={1.5} />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-emerald-800 uppercase tracking-tight">Hóa đơn đã tất toán</h3>
            <p className="mt-3 text-emerald-700/70 max-w-[340px] mx-auto leading-relaxed text-sm">
              Hệ thống đã xác nhận thanh toán đầy đủ cho hóa đơn này. Cảm ơn bạn đã hoàn thành nghĩa vụ đúng hạn!
            </p>
          </div>
        </section>
      )}

      {/* 5. Payment History */}
      {invoice.paymentHistory.length > 0 && (
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success" />
            Lịch sử thanh toán
          </h3>
          <div className="space-y-3">
            {invoice.paymentHistory.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-100 bg-slate-50/30 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-black text-slate-900 text-sm">{payment.methodLabel}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {formatDate(payment.paymentDate, 'dd/MM/yyyy HH:mm')} • {payment.paymentCode}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-black text-slate-900">{formatVND(payment.amount)}</p>
                    <p className={cn(
                      'text-[10px] font-bold uppercase tracking-widest',
                      payment.status === 'confirmed' ? 'text-success' : 'text-amber-600'
                    )}>
                      {payment.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
