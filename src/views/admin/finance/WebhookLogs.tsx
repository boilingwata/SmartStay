import React, { useState } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle2, 
  RefreshCw, Eye, Search, Filter, 
  ExternalLink, Code, Server, Smartphone, 
  CloudLightning, Layers, X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';
import { WebhookLog, ChannelHealth } from '@/models/Payment';
import { cn, formatVND, formatDate } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { toast } from 'sonner';

const WebhookLogs = () => {
  const queryClient = useQueryClient();
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  // Queries
  const { data: logs, isLoading } = useQuery<WebhookLog[]>({
    queryKey: ['webhookLogs'],
    queryFn: () => paymentService.getWebhookLogs()
  });

  const { data: health } = useQuery<ChannelHealth[]>({
    queryKey: ['channelHealth'],
    queryFn: () => paymentService.getChannelHealth()
  });

  // Mutations
  const retryMutation = useMutation({
    mutationFn: (id: string) => paymentService.retryWebhook(id),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu thủ công');
      queryClient.invalidateQueries({ queryKey: ['webhookLogs'] });
    }
  });

  const getStatusColor = (status: WebhookLog['status']) => {
    switch (status) {
      case 'Processed': return 'bg-success/10 text-success border-success/20';
      case 'Failed': return 'bg-danger/10 text-danger border-danger/20';
      case 'Duplicate': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-bg text-muted border-border';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 4.6.1 Channel Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {health?.map((h) => (
          <div key={h.provider} className="card-container p-6 bg-white/60 backdrop-blur-md relative overflow-hidden group">
            <div className={cn(
               "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-110",
               h.status === 'OK' ? "text-success" : "text-danger"
            )}>
               <Activity size={96} />
            </div>
            
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                    h.provider === 'VNPay' ? "bg-blue-600" : h.provider === 'Momo' ? "bg-pink-500" : "bg-blue-400"
                  )}>
                     <span className="text-white font-black text-xs">{h.provider.substring(0, 2)}</span>
                  </div>
                  <div>
                    <h4 className="text-body font-bold text-primary">{h.provider}</h4>
                    <p className="text-[10px] text-muted font-medium flex items-center gap-1">
                       <CheckCircle2 size={10} /> {h.successRate24h}% Thành công
                    </p>
                  </div>
               </div>
               <span className={cn(
                 "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                 h.status === 'OK' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
               )}>
                 {h.status}
               </span>
            </div>
            <div className="pt-4 border-t flex items-center justify-between">
               <span className="text-[9px] text-muted font-bold uppercase">Nhận lần cuối:</span>
               <span className="text-[10px] text-text font-mono font-bold">{formatDate(h.lastReceivedAt)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-h2 text-primary">Webhook Logs</h2>
              <p className="text-small text-muted">Lịch sử tín hiệu từ các cổng thanh toán trực tuyến.</p>
           </div>
           <button className="btn-primary flex items-center gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['webhookLogs'] })}>
              <RefreshCw size={18} /> Refresh
           </button>
        </div>

        {/* 4.6.2 Webhook DataTable */}
        <div className="card-container overflow-hidden bg-white shadow-xl shadow-primary/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-bg/40 border-b">
                   <tr>
                     <th className="px-6 py-4 text-label text-muted">Cổng</th>
                     <th className="px-6 py-4 text-label text-muted">Mã Giao Dịch</th>
                     <th className="px-6 py-4 text-label text-muted">Số tiền</th>
                     <th className="px-6 py-4 text-label text-muted">Trạng thái</th>
                     <th className="px-6 py-4 text-label text-muted">Thời điểm nhận</th>
                     <th className="px-6 py-4 text-label text-muted text-right">Phòng / Retry</th>
                     <th className="px-6 py-4 text-label text-muted text-right">Hành động</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/10">
                   {isLoading ? (
                     <tr><td colSpan={7} className="py-20 text-center"><Spinner /></td></tr>
                   ) : logs?.map((l) => (
                     <tr key={l.id} className="group hover:bg-bg/10 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <div className={cn(
                               "w-6 h-6 rounded flex items-center justify-center text-[10px] text-white font-bold",
                               l.provider === 'VNPay' ? "bg-blue-600" : l.provider === 'Momo' ? "bg-pink-500" : "bg-blue-400"
                             )}>
                               {l.provider.charAt(0)}
                             </div>
                             <span className="text-small font-bold">{l.provider}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2 group/code">
                              <span className="text-small font-mono font-bold text-primary">{l.transactionCode}</span>
                              <button onClick={() => {
                                navigator.clipboard.writeText(l.transactionCode);
                                toast.success('Đã sao chép mã GD');
                              }} className="opacity-0 group-hover/code:opacity-100 p-1 hover:bg-bg rounded transition-all">
                                <ExternalLink size={10} className="text-muted" />
                              </button>
                           </div>
                        </td>
                        <td className="px-6 py-4 font-display font-black text-secondary">{formatVND(l.amount)}</td>
                        <td className="px-6 py-4">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                             getStatusColor(l.status)
                           )}>
                             {l.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-small text-muted font-medium">{formatDate(l.receivedAt)}</td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex flex-col items-end">
                              <span className="text-small font-bold text-text">{"A-101"}</span> {/** Placeholder room */}
                              <span className="text-[10px] text-muted">Retry: {l.retryCount}/{l.maxRetries}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              {/* 4.6.2 Actions */}
                              <button 
                                onClick={() => setSelectedPayload(l.payloadJson)}
                                className="p-2 hover:bg-white rounded-xl shadow-sm border border-border/50 text-muted hover:text-primary transition-all"
                                title="Xem payload"
                              >
                                 <Code size={18} />
                              </button>
                              {l.status === 'Failed' && (
                                <button 
                                  onClick={() => retryMutation.mutate(l.id)}
                                  disabled={retryMutation.isPending}
                                  className="p-2 hover:bg-white rounded-xl shadow-sm border border-border/50 text-muted hover:text-success transition-all disabled:opacity-50"
                                  title="Retry thủ công"
                                >
                                   {retryMutation.isPending ? <Spinner /> : <RefreshCw size={18} />}
                                </button>
                              )}
                           </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* JSON Payload Viewer Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setSelectedPayload(null)}></div>
          <div className="relative w-full max-w-2xl bg-[#1e293b] rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                   <Server className="text-success" size={24} />
                   <h3 className="text-h3 font-black tracking-widest uppercase">Raw Payload JSON</h3>
                </div>
                <button onClick={() => setSelectedPayload(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                   <X size={20} />
                </button>
             </div>
             <div className="p-8">
                <pre className="bg-[#0f172a] p-6 rounded-2xl text-success font-mono text-small overflow-x-auto max-h-[50vh]">
                   {selectedPayload}
                </pre>
             </div>
             <div className="px-8 py-6 border-t border-white/10 bg-white/5 flex items-center justify-end">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPayload);
                    toast.success('Đã sao chép JSON');
                  }}
                  className="btn-primary bg-success hover:bg-success/90 border-none px-12"
                >
                   Copy Payload
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookLogs;
