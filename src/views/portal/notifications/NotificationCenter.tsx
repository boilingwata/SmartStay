import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import notificationService from '@/services/notificationService';
import useAuthStore from '@/stores/authStore';
import { cn, formatDate } from '@/utils';
import { getNotificationStyle, getNotificationTypeLabel, normalizeNotificationType } from '@/utils/notificationUtils';

type NotificationTab = 'all' | 'unread';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const profileId = user?.id ?? '';
  const [activeTab, setActiveTab] = useState<NotificationTab>('unread');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['portal-notifications', profileId],
    queryFn: () => notificationService.getNotifications(profileId),
    enabled: !!profileId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-notifications', profileId] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-notifications', profileId] });
      toast.success('Đã đánh dấu tất cả là đã đọc.');
    },
  });

  const handleNotificationClick = (item: (typeof notifications)[number]) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id);
    }

    if (item.link) {
      navigate(item.link);
      return;
    }

    const normalizedType = normalizeNotificationType(item.type);
    if (normalizedType === 'invoice_new' || normalizedType === 'invoice_due' || normalizedType === 'payment_confirmed') {
      navigate('/portal/invoices');
    } else if (normalizedType === 'ticket') {
      navigate('/portal/tickets');
    } else if (normalizedType === 'announcement') {
      navigate('/portal/announcements');
    } else if (normalizedType === 'contract_renew') {
      navigate('/portal/profile');
    }
  };

  const filteredNotifications =
    activeTab === 'all' ? notifications : notifications.filter((item) => !item.isRead);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="min-h-full bg-transparent pb-10">
      <div className="space-y-6 px-4 pt-4 sm:px-5">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <h2 className="text-[20px] font-bold tracking-tight text-slate-900">Thông báo</h2>
            <p className="text-sm text-slate-500">Bạn có {unreadCount} thông báo chưa đọc.</p>
          </div>
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-primary shadow-sm"
            title="Đánh dấu tất cả là đã đọc"
          >
            <CheckCircle2 size={18} />
          </button>
        </div>

        <div className="flex gap-2 rounded-2xl border border-slate-100 bg-slate-100/70 p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={cn(
              'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition',
              activeTab === 'unread' ? 'bg-white text-primary shadow-sm' : 'text-slate-500',
            )}
          >
            Chưa đọc {unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition',
              activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-500',
            )}
          >
            Tất cả
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-[28px] border border-slate-100 bg-white animate-pulse" />
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[32px] bg-emerald-50">
                <Sparkles size={32} className="text-emerald-500/60" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Mọi thứ đều ổn</h3>
              <p className="mt-2 text-sm text-slate-500">Bạn đã xem hết toàn bộ thông báo trong mục này.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const style = getNotificationStyle(item.type);
              const Icon = style.icon;

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleNotificationClick(item);
                    }
                  }}
                  className={cn(
                    'w-full rounded-[28px] border bg-white p-5 text-left shadow-sm transition active:scale-[0.99]',
                    item.isRead ? 'border-slate-200' : 'border-primary/20 shadow-primary/5',
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn('mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', style.color)}>
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                          {getNotificationTypeLabel(item.type)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDate(item.createdAt, 'HH:mm - dd/MM/yyyy')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className={cn('text-base leading-snug', item.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900')}>
                          {item.title}
                        </h3>
                        <p className="text-sm leading-6 text-slate-500">{item.message}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Bell size={14} />
                          {item.isRead ? 'Đã đọc' : 'Nhấn để xem chi tiết'}
                        </div>

                        {!item.isRead ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              markAsReadMutation.mutate(item.id);
                            }}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                          >
                            Đánh dấu đã đọc
                          </button>
                        ) : (
                          <ChevronRight size={16} className="text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
