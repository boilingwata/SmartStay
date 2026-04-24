import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Check, Clock3, CreditCard, Landmark, Search, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';
import { PaymentMethod, PaymentStatus, PaymentTransaction } from '@/models/Payment';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Feedback';
import { ErrorBanner, EmptyState } from '@/components/ui/StatusStates';
import { formatDate, formatVND } from '@/utils';
import { useAdminFinanceRealtime } from '@/hooks/useAdminFinanceRealtime';

const METHOD_OPTIONS: Array<{ value: 'All' | PaymentMethod; label: string }> = [
  { value: 'All', label: 'Tất cả phương thức' },
  { value: 'Cash', label: 'Tiền mặt' },
  { value: 'BankTransfer', label: 'Chuyển khoản' },
  { value: 'VNPay', label: 'VNPay' },
  { value: 'Momo', label: 'MoMo' },
  { value: 'ZaloPay', label: 'ZaloPay' },
  { value: 'Other', label: 'Khác' },
];

const STATUS_OPTIONS: Array<{ value: 'All' | PaymentStatus; label: string }> = [
  { value: 'All', label: 'Tất cả trạng thái' },
  { value: 'Pending', label: 'Chờ xử lý' },
  { value: 'Submitted', label: 'Đã gửi' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Rejected', label: 'Bị từ chối' },
  { value: 'Failed', label: 'Thất bại' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'Refunded', label: 'Đã hoàn tiền' },
];

const getMethodIcon = (method: PaymentMethod) => {
  switch (method) {
    case 'Cash':
      return <Wallet size={16} className="text-orange-500" />;
    case 'BankTransfer':
      return <Landmark size={16} className="text-primary" />;
    default:
      return <CreditCard size={16} className="text-secondary" />;
  }
};

const PaymentList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'All' | PaymentStatus>('All');
  const [method, setMethod] = useState<'All' | PaymentMethod>('All');
  const [rejectingRouteId, setRejectingRouteId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useAdminFinanceRealtime();

  const { data: payments = [], isLoading, isError, refetch } = useQuery<PaymentTransaction[]>({
    queryKey: ['payments', status, method, search],
    queryFn: () =>
      paymentService.getPayments({
        status,
        method,
        search,
      }),
  });

  const { data: pendingInfo } = useQuery({
    queryKey: ['pendingPayments'],
    queryFn: () => paymentService.getPendingCount(),
  });

  const approveMutation = useMutation({
    mutationFn: (routeId: string) => paymentService.approvePayment(routeId),
    onSuccess: () => {
      toast.success('Đã duyệt thanh toán.');
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể duyệt thanh toán.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ routeId, reason }: { routeId: string; reason: string }) => paymentService.rejectPayment(routeId, reason),
    onSuccess: () => {
      toast.success('Đã từ chối thanh toán.');
      setRejectingRouteId(null);
      setRejectionReason('');
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['pendingPayments'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['invoiceCounts'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Không thể từ chối thanh toán.');
    },
  });

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const reviewableCount = payments.filter((payment) => paymentService.canReviewPayment(payment)).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-display text-primary">Quản lý thanh toán</h1>
          <p className="text-muted">Theo dõi giao dịch, duyệt yêu cầu chờ xử lý và đối chiếu với hóa đơn liên quan.</p>
        </div>

        <button type="button" className="btn-outline self-start" onClick={() => navigate('/owner/payments/webhooks')}>
          Xem nhật ký webhook
        </button>
      </div>

      {pendingInfo && pendingInfo.count > 0 && (
        <div className="rounded-3xl border border-warning/20 bg-warning/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-warning/10 p-3 text-warning">
                <Clock3 size={20} />
              </div>
              <div>
                <p className="font-black text-warning">{pendingInfo.count} giao dịch hoặc yêu cầu đang chờ xử lý</p>
                <p className="text-sm text-warning/80">Tổng số tiền đang chờ xử lý: {formatVND(pendingInfo.total)}</p>
              </div>
            </div>
            <div className="text-sm text-warning/80">Chỉ duyệt khi đã kiểm tra đủ minh chứng và hóa đơn liên quan.</div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-container p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Tổng giao dịch hiển thị</p>
          <p className="mt-3 text-3xl font-black text-primary">{payments.length}</p>
        </div>
        <div className="card-container p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Cần duyệt</p>
          <p className="mt-3 text-3xl font-black text-warning">{reviewableCount}</p>
        </div>
        <div className="card-container p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Tổng số tiền</p>
          <p className="mt-3 text-3xl font-black text-primary">{formatVND(totalAmount)}</p>
        </div>
      </div>

      <div className="card-container grid gap-4 p-6 lg:grid-cols-[1.7fr_1fr_1fr]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            className="input-base h-12 w-full pl-12"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã giao dịch, mã hóa đơn, cư dân hoặc mã tham chiếu..."
          />
        </label>

        <select
          className="input-base h-12 w-full"
          value={method}
          onChange={(event) => setMethod(event.target.value as 'All' | PaymentMethod)}
        >
          {METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="input-base h-12 w-full"
          value={status}
          onChange={(event) => setStatus(event.target.value as 'All' | PaymentStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <ErrorBanner
          message="Không tải được danh sách thanh toán. Vui lòng thử lại."
          onRetry={() => refetch()}
        />
      )}

      <div className="card-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-bg/40">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Mã giao dịch</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Hóa đơn / Cư dân</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Số tiền</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Phương thức</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Thời gian</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không có giao dịch phù hợp"
                      message="Bộ lọc hiện tại không trả về giao dịch hoặc yêu cầu thanh toán nào."
                    />
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const canApprove = paymentService.canApprovePayment(payment);
                  const canReject = paymentService.canRejectPayment(payment);
                  const canReview = canApprove || canReject;

                  return (
                    <tr key={payment.routeId} className="hover:bg-bg/10">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/owner/payments/${payment.routeId}`)}
                          className="font-bold text-primary hover:underline"
                        >
                          {payment.transactionCode}
                        </button>
                        <p className="text-xs text-muted">{paymentService.getPaymentSourceLabel(payment.source)}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="font-bold text-primary">
                          {payment.invoiceId ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/owner/invoices/${payment.invoiceId}`)}
                              className="hover:underline"
                            >
                              {payment.invoiceCode ?? `Hóa đơn #${payment.invoiceId}`}
                            </button>
                          ) : (
                            '--'
                          )}
                        </div>
                        <p className="text-sm text-muted">{payment.tenantName || 'Chưa gắn cư dân'}</p>
                        {payment.referenceNumber && <p className="text-xs text-muted">Mã tham chiếu: {payment.referenceNumber}</p>}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-black text-primary">{formatVND(payment.amount)}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        <span>{paymentService.getPaymentMethodLabel(payment.method)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={payment.status} label={paymentService.getPaymentStatusLabel(payment.status)} />
                    </td>

                    <td className="px-6 py-4 text-sm text-muted">
                      <div>{formatDate(payment.paidAt, 'dd/MM/yyyy HH:mm')}</div>
                      {payment.confirmedAt && <div className="text-xs">Xác nhận: {formatDate(payment.confirmedAt, 'dd/MM/yyyy HH:mm')}</div>}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {canReview ? (
                        <div className="space-y-2">
                          {rejectingRouteId === payment.routeId && canReject ? (
                            <div className="flex flex-col items-end gap-2">
                              <input
                                className="input-base h-10 w-64"
                                value={rejectionReason}
                                onChange={(event) => setRejectionReason(event.target.value)}
                                placeholder="Nhập lý do từ chối..."
                              />
                              <div className="flex items-center gap-2">
                                {canApprove && (
                                  <button
                                    type="button"
                                    className="rounded-xl border border-border px-3 py-2 text-sm font-bold"
                                    disabled={approveMutation.isPending}
                                    onClick={() => approveMutation.mutate(payment.routeId)}
                                  >
                                    <Check size={14} className="inline" /> Duyệt
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="rounded-xl border border-border px-3 py-2 text-sm"
                                  onClick={() => {
                                    setRejectingRouteId(null);
                                    setRejectionReason('');
                                  }}
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary bg-danger hover:bg-danger/90"
                                  disabled={rejectMutation.isPending || rejectionReason.trim().length < 3}
                                  onClick={() =>
                                    rejectMutation.mutate({
                                      routeId: payment.routeId,
                                      reason: rejectionReason,
                                    })
                                  }
                                >
                                  <X size={14} />
                                  Từ chối
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {canReject && (
                                <button
                                  type="button"
                                  className="rounded-xl border border-border px-3 py-2 text-sm font-bold"
                                  onClick={() => setRejectingRouteId(payment.routeId)}
                                >
                                  <X size={14} className="inline" /> Từ chối
                                </button>
                              )}
                              {canApprove && (
                                <button
                                  type="button"
                                  className="btn-primary bg-success hover:bg-success/90"
                                  disabled={approveMutation.isPending}
                                  onClick={() => approveMutation.mutate(payment.routeId)}
                                >
                                  <Check size={14} />
                                  Duyệt
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded-xl border border-border px-3 py-2 text-sm font-bold"
                          onClick={() => navigate(`/owner/payments/${payment.routeId}`)}
                        >
                          Xem chi tiết
                        </button>
                      )}
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentList;
