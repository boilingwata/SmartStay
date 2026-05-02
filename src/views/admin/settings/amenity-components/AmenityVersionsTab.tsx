import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, History, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import amenityAdminService, { type AmenityPolicyRecord } from '@/services/amenityAdminService';
import { statusClass, statusLabel } from './utils';

interface Props {
  selectedPolicy: AmenityPolicyRecord | null;
}

export default function AmenityVersionsTab({ selectedPolicy }: Props) {
  const queryClient = useQueryClient();
  const [notificationTitle, setNotificationTitle] = useState('Cập nhật chính sách tiện ích');
  const [notificationMessage, setNotificationMessage] = useState('Ban quản lý vừa cập nhật quy định sử dụng tiện ích. Vui lòng xem lại điều kiện đặt chỗ trước khi sử dụng.');

  const versionsQuery = useQuery({
    queryKey: ['amenity-policy-versions', selectedPolicy?.id],
    queryFn: () => amenityAdminService.listPolicyVersions(selectedPolicy?.id as number),
    enabled: Boolean(selectedPolicy?.id),
  });
  
  const notificationsQuery = useQuery({ 
    queryKey: ['amenity-policy-notifications'], 
    queryFn: () => amenityAdminService.listNotifications(6) 
  });

  const reviewVersionMutation = useMutation({
    mutationFn: (versionId: number) => amenityAdminService.reviewVersion(versionId, 'approved', 'Duyệt từ trang quản trị'),
    onSuccess: () => {
      toast.success('Đã duyệt phiên bản chính sách.');
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-versions'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-policies'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
  });

  const queueNotificationMutation = useMutation({
    mutationFn: () =>
      amenityAdminService.queuePolicyNotification({
        policyId: selectedPolicy?.id as number,
        versionId: versionsQuery.data?.[0]?.id ?? null,
        title: notificationTitle,
        message: notificationMessage,
        channel: 'in_app',
        audienceScope: 'active_residents',
      }),
    onSuccess: () => {
      toast.success('Đã đưa thông báo vào hàng đợi.');
      queryClient.invalidateQueries({ queryKey: ['amenity-policy-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['amenity-dashboard'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Không thể tạo thông báo.'),
  });

  return (
    <section className="grid min-w-0 gap-6 xl:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground"><History size={16} />Lịch sử và xét duyệt</div>
        
        {selectedPolicy ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Đang theo dõi chính sách: {selectedPolicy.code}</p>
            <h3 className="mt-1 text-xl font-bold text-foreground">{selectedPolicy.name}</h3>
            <p className="text-sm font-medium text-muted-foreground">{selectedPolicy.amenityName}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-300">Vui lòng chọn một chính sách ở mục &ldquo;Chính sách và nội quy&rdquo; để xem lịch sử phiên bản.</div>
        )}

        <div className="space-y-3">
          {versionsQuery.isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm font-medium text-muted-foreground">
              Đang tải lịch sử phiên bản...
            </div>
          ) : null}
          {selectedPolicy && !versionsQuery.isLoading && versionsQuery.data?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm font-medium text-muted-foreground">
              Chưa có lịch sử phiên bản cho chính sách này.
            </div>
          ) : null}
          {versionsQuery.data?.map((version) => (
            <div key={version.id} className="rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-background sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-bold text-foreground">Phiên bản {version.versionNo}</p>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusClass(version.status)}`}>{statusLabel(version.status)}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed bg-background p-3 rounded-xl border border-border">{version.changeSummary ?? 'Không có ghi chú'}</p>
              {version.status === 'pending_approval' ? <button disabled={reviewVersionMutation.isPending} onClick={() => reviewVersionMutation.mutate(version.id)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-transform active:scale-[0.98] shadow-md shadow-primary/20"><ShieldCheck size={16} />Duyệt phiên bản ngay</button> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground"><BellRing size={16} />Chiến dịch thông báo</div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tiêu đề thông báo</label>
            <input className="input-base w-full" value={notificationTitle} onChange={(event) => setNotificationTitle(event.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Nội dung chi tiết</label>
            <textarea className="input-base min-h-[120px] w-full leading-relaxed resize-none" value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} />
          </div>
          <button disabled={!selectedPolicy || queueNotificationMutation.isPending} onClick={() => queueNotificationMutation.mutate()} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-transform active:scale-[0.98] shadow-lg shadow-primary/20"><BellRing size={16} />Phát thông báo cho tòa nhà</button>
        </div>
        
        <div className="space-y-3 mt-6 pt-6 border-t border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Thông báo gần đây</p>
          {notificationsQuery.isLoading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm font-medium text-muted-foreground">
              Đang tải thông báo gần đây...
            </div>
          ) : null}
          {!notificationsQuery.isLoading && notificationsQuery.data?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm font-medium text-muted-foreground">
              Chưa có thông báo tiện ích nào.
            </div>
          ) : null}
          {notificationsQuery.data?.map((item) => (
            <div key={item.id} className="relative overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/80"></div>
              <div className="flex items-center justify-between gap-3 pl-2">
                <p className="text-sm font-bold text-foreground truncate">{item.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] shrink-0 border ${statusClass(item.status)}`}>{item.status === 'queued' ? 'Chưa gửi' : statusLabel(item.status)}</span>
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed pl-2">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
