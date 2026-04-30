import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertCircle, Code2, Copy, RefreshCw, Server, X } from 'lucide-react';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';
import { ChannelHealth, WebhookLog } from '@/models/Payment';
import { Spinner } from '@/components/ui/Feedback';
import { ErrorBanner, EmptyState } from '@/components/ui/StatusStates';
import { cn, formatDate, formatVND } from '@/utils';

const getHealthLabel = (status: ChannelHealth['status']) => {
  switch (status) {
    case 'Down':
      return 'Ngưng nhận';
    case 'Degraded':
      return 'Giảm chất lượng';
    case 'OK':
    default:
      return 'Ổn định';
  }
};

const getHealthClassName = (status: ChannelHealth['status']) => {
  switch (status) {
    case 'Down':
      return 'bg-danger/10 text-danger';
    case 'Degraded':
      return 'bg-warning/10 text-warning';
    case 'OK':
    default:
      return 'bg-success/10 text-success';
  }
};

const getStatusClassName = (status: WebhookLog['status']) => {
  switch (status) {
    case 'Success':
      return 'bg-success/10 text-success border-success/20';
    case 'Failed':
      return 'bg-danger/10 text-danger border-danger/20';
    case 'Retry':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'Processing':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'Received':
    default:
      return 'bg-bg text-muted border-border';
  }
};

const WebhookLogs = () => {
  const queryClient = useQueryClient();
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  const { data: logs = [], isLoading, isError, refetch } = useQuery<WebhookLog[]>({
    queryKey: ['webhookLogs'],
    queryFn: () => paymentService.getWebhookLogs(),
  });

  const { data: health = [] } = useQuery<ChannelHealth[]>({
    queryKey: ['channelHealth'],
    queryFn: () => paymentService.getChannelHealth(),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-display text-primary">Nhật ký kết nối thanh toán</h1>
          <p className="text-muted">Theo dõi tín hiệu thanh toán tự động và kiểm tra trạng thái xử lý thực tế.</p>
        </div>

        <button type="button" className="btn-outline self-start" onClick={() => queryClient.invalidateQueries({ queryKey: ['webhookLogs'] })}>
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {health.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {health.map((item) => (
            <div key={item.provider} className="card-container p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted">Kênh nhận</p>
                  <h2 className="mt-2 text-h3 text-primary">{paymentService.getWebhookProviderLabel(item.provider)}</h2>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider', getHealthClassName(item.status))}>
                  {getHealthLabel(item.status)}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl bg-bg/20 p-3">
                  <p className="text-muted">Tổng 24h</p>
                  <p className="mt-2 font-black text-primary">{item.total24h}</p>
                </div>
                <div className="rounded-2xl bg-success/5 p-3">
                  <p className="text-muted">Thành công</p>
                  <p className="mt-2 font-black text-success">{item.successRate24h}%</p>
                </div>
                <div className="rounded-2xl bg-danger/5 p-3">
                  <p className="text-muted">Lỗi</p>
                  <p className="mt-2 font-black text-danger">{item.failed24h}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted">Nhận gần nhất: {item.lastReceivedAt ? formatDate(item.lastReceivedAt, 'dd/MM/yyyy HH:mm') : '--'}</p>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <ErrorBanner
          message="Không tải được nhật ký kết nối thanh toán. Vui lòng thử lại."
          onRetry={() => refetch()}
        />
      )}

      <div className="card-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-bg/40">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Kênh</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Mã tham chiếu</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Số tiền</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Nhận lúc</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Xử lý lúc</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-muted">Lỗi</th>
                <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-wider text-muted">Dữ liệu nhận</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <Spinner />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16">
                    <EmptyState
                      icon={Activity}
                      title="Chưa có tín hiệu thanh toán nào"
                      message="Hiện chưa có bản ghi kết nối thanh toán trong phạm vi dữ liệu đang xem."
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg/10">
                    <td className="px-6 py-4 font-bold text-primary">{paymentService.getWebhookProviderLabel(log.provider)}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-primary">{log.transactionCode}</p>
                        <p className="text-xs text-muted">Thử lại: {log.retryCount}/{log.maxRetries}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-primary">{formatVND(log.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={cn('rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider', getStatusClassName(log.status))}>
                        {paymentService.getWebhookStatusLabel(log.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{formatDate(log.receivedAt, 'dd/MM/yyyy HH:mm')}</td>
                    <td className="px-6 py-4 text-sm text-muted">{log.processedAt ? formatDate(log.processedAt, 'dd/MM/yyyy HH:mm') : '--'}</td>
                    <td className="px-6 py-4 text-sm text-muted">{log.errorMessage || '--'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-xl border border-border px-3 py-2 text-sm font-bold"
                        onClick={() => setSelectedPayload(log.payloadJson)}
                      >
                        <Code2 size={14} className="inline" /> Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-info/20 bg-info/5 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-info" />
          <div className="space-y-1 text-sm text-info/80">
            <p className="font-bold text-info">Màn hình này chỉ theo dõi tín hiệu thanh toán theo dữ liệu thật.</p>
            <p>Chức năng chạy lại tín hiệu chưa có luồng xử lý an toàn trong phạm vi hiện tại nên đã được ẩn để tránh thao tác giả làm sai lệch vận hành.</p>
          </div>
        </div>
      </div>

      {selectedPayload && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setSelectedPayload(null)} />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-8 py-6 text-white">
              <div className="flex items-center gap-3">
                <Server size={22} className="text-success" />
                <h3 className="text-h3">Dữ liệu kết nối thanh toán</h3>
              </div>
              <button type="button" className="rounded-full p-2 transition-all hover:bg-white/10" onClick={() => setSelectedPayload(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="p-8">
              <pre className="max-h-[60vh] overflow-auto rounded-3xl bg-black/30 p-6 text-sm text-success">{selectedPayload}</pre>
            </div>

            <div className="flex justify-end border-t border-white/10 px-8 py-6">
              <button
                type="button"
                className="btn-primary bg-success hover:bg-success/90"
                onClick={() => {
                  navigator.clipboard.writeText(selectedPayload);
                  toast.success('Đã sao chép dữ liệu kết nối.');
                }}
              >
                <Copy size={16} />
                Sao chép
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookLogs;
