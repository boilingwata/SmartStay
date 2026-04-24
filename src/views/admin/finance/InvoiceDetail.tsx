import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Droplets,
  History,
  Info,
  Landmark,
  Receipt,
  ShieldCheck,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { InvoiceDetail as InvoiceDetailType } from '@/models/Invoice';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatVND } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { RecordPaymentModal } from '@/components/shared/modals/RecordPaymentModal';
import { useAdminFinanceRealtime } from '@/hooks/useAdminFinanceRealtime';

const getInvoicePeriodLabel = (period?: string) => {
  if (!period) return '--';
  const [year, month] = period.split('-');
  return month && year ? `${month}/${year}` : period;
};

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'BankTransfer':
      return <Landmark size={16} className="text-primary" />;
    case 'Cash':
      return <Wallet size={16} className="text-orange-500" />;
    case 'Momo':
      return <Zap size={16} className="text-pink-500" />;
    default:
      return <CreditCard size={16} className="text-secondary" />;
  }
};

const getInvoiceItemTypeLabel = (type: InvoiceDetailType['items'][number]['type']) => {
  switch (type) {
    case 'Electricity':
      return 'Điện';
    case 'Water':
      return 'Nước';
    case 'Rent':
      return 'Tiền thuê';
    case 'Service':
      return 'Dịch vụ';
    case 'Asset':
      return 'Tài sản';
    case 'Discount':
      return 'Giảm trừ';
    default:
      return 'Khác';
  }
};

const getPolicySourceLabel = (value?: string) => {
  switch ((value ?? '').toLowerCase()) {
    case 'contract':
      return 'Theo hợp đồng';
    case 'room':
      return 'Theo phòng';
    case 'building':
      return 'Theo tòa nhà';
    case 'system':
    case 'global':
      return 'Mặc định hệ thống';
    default:
      return value || '--';
  }
};

const getInvoiceItemIcon = (type: InvoiceDetailType['items'][number]['type']) => {
  switch (type) {
    case 'Electricity':
      return <Zap size={16} className="text-warning" />;
    case 'Water':
      return <Droplets size={16} className="text-secondary" />;
    case 'Rent':
      return <Receipt size={16} className="text-primary" />;
    case 'Asset':
      return <ShieldCheck size={16} className="text-primary" />;
    default:
      return <Info size={16} className="text-muted" />;
  }
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useAdminFinanceRealtime(id);

  const { data: invoice, isLoading } = useQuery<InvoiceDetailType>({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getInvoiceDetail(id!),
  });

  useEffect(() => {
    if (!invoice || !id) return;

    const sessionKey = `viewed_inv_${id}`;
    if (!sessionStorage.getItem(sessionKey)) {
      void invoiceService.logInvoiceView(id);
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [id, invoice]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!invoice) {
    return <div className="rounded-3xl bg-white p-8 text-center shadow-lg">Không tìm thấy hóa đơn.</div>;
  }

  const remainingAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
  const canRecordPayment = remainingAmount > 0 && (invoice.status === 'Unpaid' || invoice.status === 'Overdue');

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-all hover:bg-bg">
              <ArrowLeft size={20} />
            </button>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-display text-primary">{invoice.invoiceCode}</h1>
                <StatusBadge status={invoice.status} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-2">
                  <Building2 size={14} />
                  {invoice.buildingName}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={14} />
                  Kỳ {getInvoicePeriodLabel(invoice.period)}
                </span>
                <span className="flex items-center gap-2">
                  <User size={14} />
                  {invoice.tenantName}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary flex items-center gap-2 self-start"
            disabled={!canRecordPayment}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            <CreditCard size={18} />
            Ghi nhận thanh toán
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <section className="card-container space-y-6 p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-border/50 bg-bg/20 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Thông tin hóa đơn</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Hợp đồng</span>
                      <span className="font-bold text-primary">{invoice.contractCode}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Phòng</span>
                      <span className="font-bold text-primary">{invoice.roomCode}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Hạn thanh toán</span>
                      <span className="font-bold text-primary">{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Ngày tạo</span>
                      <span className="font-bold text-primary">{formatDate(invoice.createdAt, 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/50 bg-bg/20 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Tóm tắt công nợ</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm text-muted">Tổng phải thu</p>
                      <p className="text-3xl font-black text-primary">{formatVND(invoice.totalAmount)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-success/5 p-4">
                        <p className="text-muted">Đã thu</p>
                        <p className="mt-2 font-black text-success">{formatVND(invoice.paidAmount)}</p>
                      </div>
                      <div className="rounded-2xl bg-danger/5 p-4">
                        <p className="text-muted">Còn nợ</p>
                        <p className="mt-2 font-black text-danger">{formatVND(remainingAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/50">
                <table className="w-full text-left">
                  <thead className="bg-bg/40">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Khoản thu</th>
                      <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-wider text-muted">Số lượng</th>
                      <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted">Đơn giá</th>
                      <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-bg/10">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getInvoiceItemIcon(item.type)}
                            <div>
                              <p className="font-bold text-primary">{item.description}</p>
                              <p className="text-xs text-muted">Loại: {getInvoiceItemTypeLabel(item.type)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-medium text-muted">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-muted">
                          {formatVND(item.unitPriceSnapshot)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-primary">{formatVND(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-bg/20">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-muted">
                        Tạm tính
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-primary">{formatVND(invoice.subTotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-muted">
                        Thuế
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-primary">{formatVND(invoice.taxAmount)}</td>
                    </tr>
                    {invoice.overdueFee > 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-right text-sm font-bold text-danger">
                          Phí quá hạn
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-danger">{formatVND(invoice.overdueFee)}</td>
                      </tr>
                    )}
                    <tr className="border-t border-primary/10 bg-primary/5">
                      <td colSpan={3} className="px-6 py-5 text-right text-base font-black text-primary">
                        Tổng thanh toán
                      </td>
                      <td className="px-6 py-5 text-right text-base font-black text-primary">{formatVND(invoice.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {invoice.utilitySnapshot ? (
              <section className="card-container space-y-6 p-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Snapshot tiện ích</p>
                  <h2 className="mt-2 text-h3 text-primary">Công thức đã chốt tại thời điểm lập hóa đơn</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border/40 bg-bg/20 p-5">
                    <p className="text-sm font-bold text-primary">Thông tin nguồn tính</p>
                    <div className="mt-4 space-y-2 text-sm text-muted">
                      <p>Nguồn tính: <span className="font-bold text-primary">{getPolicySourceLabel(invoice.utilitySnapshot.policySourceType)}</span></p>
                      <p>Số người tính tiền: <span className="font-bold text-primary">{invoice.utilitySnapshot.occupantsForBilling}</span></p>
                      <p>Ngày ở trong kỳ: <span className="font-bold text-primary">{invoice.utilitySnapshot.occupiedDays}/{invoice.utilitySnapshot.daysInPeriod}</span></p>
                      <p>Tỷ lệ phân bổ: <span className="font-bold text-primary">{invoice.utilitySnapshot.prorateRatio.toFixed(4)}</span></p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/40 bg-bg/20 p-5">
                    <p className="text-sm font-bold text-primary">Quy tắc làm tròn</p>
                    <div className="mt-4 space-y-2 text-sm text-muted">
                      <p>Bước làm tròn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.roundingIncrement)}</span></p>
                      <p>Mã policy: <span className="font-bold text-primary">{invoice.utilitySnapshot.resolvedPolicyId ?? '--'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-warning/20 bg-warning/5 p-5">
                    <p className="text-sm font-bold text-warning">Điện</p>
                    <div className="mt-4 space-y-2 text-sm text-muted">
                      <p>Giá gốc: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.electricBaseAmount)}</span></p>
                      <p>Phụ thu thiết bị: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.electricDeviceSurcharge)}</span></p>
                      <p>Tạm tính: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.electricSubtotal)}</span></p>
                      <p>Hệ số mùa: <span className="font-bold text-primary">{invoice.utilitySnapshot.electricSeasonMultiplier}x</span></p>
                      <p>Hệ số vị trí: <span className="font-bold text-primary">{invoice.utilitySnapshot.electricLocationMultiplier}x</span></p>
                      <p>Giá trị trước làm tròn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.electricRawAmount)}</span></p>
                      <p>Giá trị sau làm tròn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.electricRoundedAmount)}</span></p>
                      <p>Mức sàn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.minElectricFloor)}</span></p>
                      <p className="pt-2 text-base font-black text-primary">Tiền điện chốt: {formatVND(invoice.utilitySnapshot.electricFinalAmount)}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-secondary/20 bg-secondary/5 p-5">
                    <p className="text-sm font-bold text-secondary">Nước</p>
                    <div className="mt-4 space-y-2 text-sm text-muted">
                      <p>Giá gốc: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.waterBaseAmount)}</span></p>
                      <p>Đơn giá đầu người: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.waterPerPersonAmount)}</span></p>
                      <p>Tiền theo đầu người: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.waterPersonCharge)}</span></p>
                      <p>Tạm tính: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.waterSubtotal)}</span></p>
                      <p>Hệ số vị trí: <span className="font-bold text-primary">{invoice.utilitySnapshot.waterLocationMultiplier}x</span></p>
                      <p>Giá trị trước làm tròn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.waterRawAmount)}</span></p>
                      <p>Giá trị sau làm tròn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.waterRoundedAmount)}</span></p>
                      <p>Mức sàn: <span className="font-bold text-primary">{formatVND(invoice.utilitySnapshot.minWaterFloor)}</span></p>
                      <p className="pt-2 text-base font-black text-primary">Tiền nước chốt: {formatVND(invoice.utilitySnapshot.waterFinalAmount)}</p>
                    </div>
                  </div>
                </div>

                {invoice.utilitySnapshot.resolvedDeviceSurcharges.length > 0 && (
                  <div className="rounded-3xl border border-border/40 bg-bg/20 p-5">
                    <p className="text-sm font-bold text-primary">Phụ thu thiết bị đã áp</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {invoice.utilitySnapshot.resolvedDeviceSurcharges.map((item) => (
                        <span
                          key={`${item.deviceCode}-${item.chargeAmount}`}
                          className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white"
                        >
                          {item.deviceCode}: {formatVND(item.chargeAmount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {invoice.utilitySnapshot.warnings.length > 0 && (
                  <div className="rounded-3xl border border-warning/20 bg-warning/5 p-5">
                    <p className="text-sm font-bold text-warning">Cảnh báo snapshot</p>
                    <div className="mt-4 space-y-2 text-sm text-muted">
                      {invoice.utilitySnapshot.warnings.map((warning) => (
                        <p key={`${warning.code}-${warning.message}`}>
                          <span className="font-bold text-primary">{warning.code}</span>: {warning.message}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-3xl border border-warning/20 bg-warning/5 p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-warning" />
                  <div className="space-y-1">
                    <p className="font-bold text-warning">Hóa đơn này chưa có snapshot tiện ích.</p>
                    <p className="text-sm text-warning/80">
                      Đây là dữ liệu cũ trước khi snapshot trở thành bắt buộc. Màn hình chỉ hiển thị số tiền đã chốt, không tự tính lại theo policy hiện tại.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8 lg:col-span-4">
            <section className="card-container space-y-6 p-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Lịch sử thanh toán</p>
                <h2 className="mt-2 text-h3 text-primary">Các lần thu tiền liên quan</h2>
              </div>

              {invoice.payments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted">
                  Chưa có giao dịch hoặc yêu cầu thanh toán nào cho hóa đơn này.
                </div>
              ) : (
                <div className="space-y-3">
                  {invoice.payments.map((payment) => (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() => navigate(`/owner/payments/${payment.id}`)}
                      className="w-full rounded-3xl border border-border/40 bg-bg/20 p-4 text-left transition-all hover:border-primary/30 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getPaymentIcon(payment.method)}
                            <span className="font-bold text-primary">{payment.transactionCode}</span>
                          </div>
                          <p className="text-sm text-muted">
                            {paymentService.getPaymentMethodLabel(payment.method)} • {formatDate(payment.paidAt, 'dd/MM/yyyy HH:mm')}
                          </p>
                          {payment.referenceNumber && (
                            <p className="text-xs text-muted">Mã tham chiếu: {payment.referenceNumber}</p>
                          )}
                          {payment.rejectionReason && (
                            <p className="text-xs font-medium text-danger">Lý do từ chối: {payment.rejectionReason}</p>
                          )}
                        </div>

                        <div className="space-y-2 text-right">
                          <p className="font-black text-primary">{formatVND(payment.amount)}</p>
                          <StatusBadge status={payment.status} label={paymentService.getPaymentStatusLabel(payment.status)} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="card-container space-y-4 p-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Thông tin chuyển khoản</p>
                <h2 className="mt-2 text-h3 text-primary">Tài khoản nhận tiền</h2>
              </div>

              {invoice.bankInfo ? (
                <div className="rounded-3xl border border-border/40 bg-bg/20 p-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">Ngân hàng</span>
                    <span className="font-bold text-primary">{invoice.bankInfo.bankName}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-muted">Số tài khoản</span>
                    <span className="font-bold text-primary">{invoice.bankInfo.accountNumber}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-muted">Chủ tài khoản</span>
                    <span className="font-bold text-primary">{invoice.bankInfo.accountName}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border p-5 text-sm text-muted">
                  Chưa có thông tin tài khoản nhận tiền trong cấu hình hiện tại của dự án.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-info/20 bg-info/5 p-6">
              <div className="flex items-start gap-3">
                <History size={20} className="mt-0.5 shrink-0 text-info" />
                <div className="space-y-1 text-sm text-info/80">
                  <p className="font-bold text-info">Ghi chú vận hành</p>
                  <p>Màn hình này chỉ hiển thị dữ liệu đã chốt trong schema hiện tại. Các thao tác xuất PDF, gửi lại thông báo và thanh toán online chưa được backend hỗ trợ ổn định nên đã được ẩn khỏi phase này.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
      />
    </>
  );
};

export default InvoiceDetail;
