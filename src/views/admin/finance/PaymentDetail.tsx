import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  History,
  Landmark,
  StickyNote,
  User,
  Wallet,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { PaymentTransaction } from '@/models/Payment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Feedback';
import { formatDate, formatVND } from '@/utils';
import { useAdminFinanceRealtime } from '@/hooks/useAdminFinanceRealtime';

const getMethodIcon = (method: PaymentTransaction['method']) => {
  switch (method) {
    case 'Cash':
      return <Wallet size={18} className="text-orange-500" />;
    case 'BankTransfer':
      return <Landmark size={18} className="text-primary" />;
    default:
      return <CreditCard size={18} className="text-secondary" />;
  }
};

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: payment, isLoading } = useQuery<PaymentTransaction>({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getPaymentDetail(id!),
  });

  useAdminFinanceRealtime({
    invoiceId: payment?.invoiceId,
    paymentRouteId: id,
  });

  const { data: invoice } = useQuery({
    queryKey: ['paymentInvoice', payment?.invoiceId],
    queryFn: () => invoiceService.getInvoiceDetail(payment!.invoiceId!),
    enabled: !!payment?.invoiceId,
  });

  const approveMutation = useMutation({
    mutationFn: (routeId: string) => paymentService.approvePayment(routeId),
    onSuccess: async () => {
      toast.success('Đã duyệt thanh toán.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payment', id] }),
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['pendingPayments'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice', payment?.invoiceId] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể duyệt thanh toán.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ routeId, reason }: { routeId: string; reason: string }) => paymentService.rejectPayment(routeId, reason),
    onSuccess: async () => {
      toast.success('Đã từ chối thanh toán.');
      setRejectionReason('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payment', id] }),
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['pendingPayments'] }),
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice', payment?.invoiceId] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể từ chối thanh toán.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!payment) {
    return <div className="rounded-3xl bg-white p-8 text-center shadow-lg">Không tìm thấy thanh toán.</div>;
  }

  const canApprove = paymentService.canApprovePayment(payment);
  const canReject = paymentService.canRejectPayment(payment);
  const canReview = canApprove || canReject;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 transition-all hover:bg-bg">
            <ArrowLeft size={20} />
          </button>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-display text-primary">{payment.transactionCode}</h1>
              <StatusBadge status={payment.status} label={paymentService.getPaymentStatusLabel(payment.status)} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-2">
                <User size={14} />
                {payment.tenantName || 'Chưa gắn cư dân'}
              </span>
              <span className="flex items-center gap-2">
                <History size={14} />
                {formatDate(payment.createdAt, 'dd/MM/yyyy HH:mm')}
              </span>
            </div>
          </div>
        </div>

        {canReview && (
          <div className="flex flex-wrap items-center gap-3">
            {canReject && (
              <button
                type="button"
                className="btn-outline border-danger text-danger hover:bg-danger/5"
                disabled={rejectMutation.isPending || rejectionReason.trim().length < 3}
                onClick={() =>
                  rejectMutation.mutate({
                    routeId: payment.routeId,
                    reason: rejectionReason,
                  })
                }
              >
                <XCircle size={16} />
                Từ chối
              </button>
            )}
            {canApprove && (
              <button
                type="button"
                className="btn-primary bg-success hover:bg-success/90"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(payment.routeId)}
              >
                <CheckCircle2 size={16} />
                Duyệt
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section className="card-container grid gap-6 p-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Số tiền</p>
                <p className="mt-3 text-4xl font-black text-primary">{formatVND(payment.amount)}</p>
              </div>

              <div className="rounded-3xl border border-border/50 bg-bg/20 p-5">
                <div className="flex items-center gap-3">
                  {getMethodIcon(payment.method)}
                  <div>
                    <p className="font-bold text-primary">{paymentService.getPaymentMethodLabel(payment.method)}</p>
                    <p className="text-sm text-muted">{paymentService.getPaymentSourceLabel(payment.source)}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">Thời điểm nộp</span>
                    <span className="font-bold text-primary">{formatDate(payment.paidAt, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted">Ngày tạo</span>
                    <span className="font-bold text-primary">{formatDate(payment.createdAt, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                  {payment.confirmedAt && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Ngày xác nhận</span>
                      <span className="font-bold text-primary">{formatDate(payment.confirmedAt, 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                  )}
                  {payment.referenceNumber && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Mã tham chiếu</span>
                      <span className="font-bold text-primary">{payment.referenceNumber}</span>
                    </div>
                  )}
                  {payment.bankName && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Ngân hàng</span>
                      <span className="font-bold text-primary">{payment.bankName}</span>
                    </div>
                  )}
                  {payment.confirmationSource && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted">Nguồn xác nhận</span>
                      <span className="font-bold text-primary">{paymentService.getConfirmationSourceLabel(payment.confirmationSource)}</span>
                    </div>
                  )}
                </div>
              </div>

              {(payment.note || payment.rejectionReason) && (
                <div className="rounded-3xl border border-border/50 bg-bg/20 p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-primary">
                    <StickyNote size={16} />
                    Ghi chú nghiệp vụ
                  </p>
                  {payment.note && <p className="mt-3 text-sm text-muted">{payment.note}</p>}
                  {payment.rejectionReason && (
                    <p className="mt-3 text-sm font-medium text-danger">Lý do từ chối: {payment.rejectionReason}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Minh chứng</p>
              {payment.evidenceImage ? (
                <div className="overflow-hidden rounded-3xl border border-border/50 bg-white">
                  {payment.evidenceImage.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex aspect-square flex-col items-center justify-center gap-3 bg-bg/20 text-center">
                      <FileText size={48} className="text-primary" />
                      <p className="text-sm text-muted">Minh chứng là tệp PDF.</p>
                      <a
                        href={payment.evidenceImage}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline inline-flex items-center gap-2"
                      >
                        <ExternalLink size={16} />
                        Mở tệp
                      </a>
                    </div>
                  ) : (
                    <a href={payment.evidenceImage} target="_blank" rel="noreferrer" className="block">
                      <img src={payment.evidenceImage} alt="Minh chứng thanh toán" className="aspect-square w-full object-cover" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-bg/20 text-center text-sm text-muted">
                  Chưa có minh chứng đính kèm.
                </div>
              )}
            </div>
          </section>

          {invoice && (
            <section className="card-container space-y-5 p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Hóa đơn liên quan</p>
                  <h2 className="mt-2 text-h3 text-primary">{invoice.invoiceCode}</h2>
                </div>
                <button type="button" className="btn-outline self-start" onClick={() => navigate(`/owner/invoices/${invoice.id}`)}>
                  Xem chi tiết hóa đơn
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl bg-bg/20 p-4">
                  <p className="text-sm text-muted">Tổng tiền</p>
                  <p className="mt-2 font-black text-primary">{formatVND(invoice.totalAmount)}</p>
                </div>
                <div className="rounded-3xl bg-success/5 p-4">
                  <p className="text-sm text-muted">Đã thu</p>
                  <p className="mt-2 font-black text-success">{formatVND(invoice.paidAmount)}</p>
                </div>
                <div className="rounded-3xl bg-danger/5 p-4">
                  <p className="text-sm text-muted">Còn nợ</p>
                  <p className="mt-2 font-black text-danger">{formatVND(Math.max(0, invoice.totalAmount - invoice.paidAmount))}</p>
                </div>
                <div className="rounded-3xl bg-bg/20 p-4">
                  <p className="text-sm text-muted">Phòng</p>
                  <p className="mt-2 font-black text-primary">{invoice.roomCode}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8 lg:col-span-4">
          <section className="card-container space-y-5 p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Nhật ký xử lý</p>
              <h2 className="mt-2 text-h3 text-primary">Các mốc quan trọng</h2>
            </div>

            <div className="space-y-5">
              <div className="border-l border-border pl-4">
                <p className="font-bold text-primary">Tạo yêu cầu / giao dịch</p>
                <p className="text-sm text-muted">{formatDate(payment.createdAt, 'dd/MM/yyyy HH:mm')}</p>
              </div>

              {payment.confirmedAt && (
                <div className="border-l border-success pl-4">
                  <p className="font-bold text-success">Xác nhận thanh toán</p>
                  <p className="text-sm text-muted">{formatDate(payment.confirmedAt, 'dd/MM/yyyy HH:mm')}</p>
                </div>
              )}

              {payment.rejectionReason && (
                <div className="border-l border-danger pl-4">
                  <p className="font-bold text-danger">Từ chối giao dịch</p>
                  <p className="text-sm text-muted">{payment.rejectionReason}</p>
                </div>
              )}
            </div>
          </section>

          {canReject && (
            <section className="rounded-3xl border border-warning/20 bg-warning/5 p-6">
              <div className="space-y-3">
                <p className="font-bold text-warning">Nhập lý do nếu cần từ chối</p>
                <textarea
                  className="input-base min-h-[120px] w-full"
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  placeholder="Ví dụ: minh chứng không hợp lệ, số tiền không khớp hoặc đã hủy giao dịch..."
                />
              </div>
            </section>
          )}

          {!canReview && (
            <section className="rounded-3xl border border-info/20 bg-info/5 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-info" />
                <div className="space-y-1 text-sm text-info/80">
                  <p className="font-bold text-info">Màn hình này đang hiển thị đúng trạng thái thanh toán đã ghi nhận.</p>
                  <p>Không có thao tác chỉnh tay bổ sung ngoài duyệt / từ chối để tránh làm lệch dữ liệu giữa giao diện và hệ thống lưu trữ.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
