import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, CheckCheck, Inbox, Link2, User } from 'lucide-react';

import { Spinner } from '@/components/ui/Feedback';
import notificationService from '@/services/notificationService';
import type { NotificationLogItem } from '@/types/notification';
import { cn, formatDate } from '@/utils';
import { getNotificationStyle, getNotificationTypeLabel } from '@/utils/notificationUtils';

type NotificationFilter = 'all' | 'unread' | 'read';

const FILTER_OPTIONS: Array<{ value: NotificationFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
];

function matchesFilter(item: NotificationLogItem, filter: NotificationFilter) {
  if (filter === 'all') return true;
  if (filter === 'unread') return !item.isRead;
  return item.isRead;
}

function getLinkLabel(link?: string) {
  if (!link) {
    return 'Không có liên kết';
  }

  if (link.startsWith('/portal/invoices')) {
    return 'Mở trang hóa đơn';
  }

  if (link.startsWith('/portal/tickets')) {
    return 'Mở trang yêu cầu hỗ trợ';
  }

  if (link.startsWith('/portal/announcements')) {
    return 'Mở trang thông báo';
  }

  if (link.startsWith('/portal/profile')) {
    return 'Mở hồ sơ cư dân';
  }

  return 'Mở màn hình liên quan';
}

const NotificationPage = () => {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [search, setSearch] = useState('');

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-notification-log'],
    queryFn: () => notificationService.getNotificationLog(),
  });

  const filteredNotifications = notifications.filter((item) => {
    if (!matchesFilter(item, activeFilter)) {
      return false;
    }

    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return true;
    }

    return [item.title, item.message, item.recipientName, item.createdByName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const totalCount = notifications.length;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const recipientCount = new Set(notifications.map((item) => item.profileId)).size;
  const linkedCount = notifications.filter((item) => Boolean(item.link)).length;

  return (
    <div className="space-y-6 pb-16">
      <div className="space-y-2 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3 text-secondary">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nhật ký thông báo</h1>
            <p className="text-sm text-slate-500">
              Theo dõi các thông báo trong ứng dụng đã gửi tới người dùng và trạng thái đã đọc của họ.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng thông báo', value: totalCount, tone: 'bg-primary/10 text-primary' },
          { label: 'Chưa đọc', value: unreadCount, tone: 'bg-amber-100 text-amber-700' },
          { label: 'Người nhận', value: recipientCount, tone: 'bg-sky-100 text-sky-700' },
          { label: 'Có liên kết', value: linkedCount, tone: 'bg-emerald-100 text-emerald-700' },
        ].map((item) => (
          <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={cn('mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold', item.tone)}>
              {item.label}
            </div>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeFilter === filter.value
                  ? 'border-secondary bg-secondary text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tiêu đề, nội dung hoặc người nhận"
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10 lg:max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error instanceof Error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error.message || 'Không thể tải nhật ký thông báo.'}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <Inbox className="mx-auto mb-4 text-slate-300" size={40} />
          <h3 className="text-lg font-semibold text-slate-900">Chưa có thông báo phù hợp</h3>
          <p className="mt-2 text-sm text-slate-500">
            {notifications.length === 0
              ? 'Hiện chưa có thông báo nào được ghi nhận tại đây.'
              : 'Không có thông báo khớp với bộ lọc hoặc từ khóa đang chọn.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((item) => {
            const style = getNotificationStyle(item.type);
            const Icon = style.icon;

            return (
              <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className={cn('mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', style.color)}>
                      <Icon size={20} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {getNotificationTypeLabel(item.type)}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-semibold',
                            item.isRead ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
                        <p className="text-sm leading-6 text-slate-600">{item.message}</p>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-slate-400" />
                          <span>Người nhận: {item.recipientName || 'Không rõ'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCheck size={16} className="text-slate-400" />
                          <span>Nguồn gửi: {item.createdByName || 'Hệ thống'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-slate-400" />
                          <span>Thời gian: {formatDate(item.createdAt, 'HH:mm - dd/MM/yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link2 size={16} className="text-slate-400" />
                          <span>{getLinkLabel(item.link)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
