import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  Megaphone,
  Pin,
  Share2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { BottomSheet } from '@/components/portal/BottomSheet';
import portalAnnouncementService from '@/services/portalAnnouncementService';
import type { PortalAnnouncement } from '@/types/announcement';
import { ANNOUNCEMENT_TYPE_LABELS } from '@/types/announcement';
import { cn, formatDate, formatRelativeTime } from '@/utils';

const FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pinned', label: 'Đã ghim' },
  { id: 'Urgent', label: 'Khẩn cấp' },
  { id: 'Maintenance', label: 'Bảo trì' },
];

const Announcements = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<PortalAnnouncement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal-announcements', activeFilter],
    queryFn: () => portalAnnouncementService.getAnnouncements({ type: activeFilter }),
  });

  const items = data?.items || [];

  const handleShare = async (announcement: PortalAnnouncement) => {
    const shareText = `${announcement.title}\n${announcement.summary}`;
    const shareData = {
      title: announcement.title,
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (shareError) {
        if ((shareError as Error).name === 'AbortError') {
          return;
        }
      }
    }

    await navigator.clipboard.writeText(shareText);
    toast.success('Đã sao chép nội dung thông báo.');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-32">
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold uppercase tracking-wide text-slate-900">Thông báo cư dân</h1>
              <p className="text-xs text-slate-500">Danh sách bản tin hiển thị theo tòa nhà của bạn.</p>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BellRing size={18} />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition',
                activeFilter === filter.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 rounded-[28px] bg-white animate-pulse" />
            ))}
          </div>
        ) : error instanceof Error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {error.message || 'Không thể tải thông báo cư dân.'}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Megaphone className="mx-auto mb-4 text-slate-300" size={40} />
            <h3 className="text-lg font-semibold text-slate-900">Chưa có thông báo nào</h3>
            <p className="mt-2 text-sm text-slate-500">
              Khi có bản tin phù hợp với tòa nhà của bạn, hệ thống sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          items.map((announcement) => {
            const isUrgent = announcement.type === 'Urgent';

            return (
              <button
                key={announcement.id}
                type="button"
                onClick={() => setSelectedAnnouncement(announcement)}
                className={cn(
                  'w-full rounded-[28px] border p-5 text-left shadow-sm transition active:scale-[0.99]',
                  announcement.isPinned
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                    : isUrgent
                      ? 'border-rose-200 bg-white'
                      : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                        <Pin size={12} />
                        Đã ghim
                      </span>
                    )}
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide',
                        announcement.isPinned
                          ? 'bg-white/10 text-white'
                          : isUrgent
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-700',
                      )}
                    >
                      {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                    </span>
                  </div>

                  <span className={cn('text-xs', announcement.isPinned ? 'text-slate-300' : 'text-slate-400')}>
                    {formatRelativeTime(announcement.publishAt || announcement.createdAt)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className={cn('text-lg font-semibold leading-snug', announcement.isPinned ? 'text-white' : 'text-slate-900')}>
                    {announcement.title}
                  </h3>
                  <p className={cn('text-sm leading-6', announcement.isPinned ? 'text-slate-200' : 'text-slate-600')}>
                    {announcement.summary}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Megaphone size={14} />
                  Xem chi tiết
                </div>
              </button>
            );
          })
        )}
      </div>

      <BottomSheet
        isOpen={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        title="Chi tiết thông báo"
      >
        {selectedAnnouncement && (
          <div className="space-y-6 py-2 pb-10">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {ANNOUNCEMENT_TYPE_LABELS[selectedAnnouncement.type]}
                </span>
                {selectedAnnouncement.isPinned && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    Đã ghim
                  </span>
                )}
                <span className="text-sm text-slate-500">
                  {formatDate(selectedAnnouncement.publishAt || selectedAnnouncement.createdAt, 'HH:mm - dd/MM/yyyy')}
                </span>
              </div>

              <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900">
                {selectedAnnouncement.title}
              </h2>
            </div>

            {selectedAnnouncement.type === 'Urgent' && (
              <div className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <p>Đây là thông báo khẩn. Bạn nên đọc kỹ nội dung và thực hiện theo hướng dẫn nếu có.</p>
              </div>
            )}

            <div className="rounded-[28px] bg-slate-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selectedAnnouncement.content}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleShare(selectedAnnouncement)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                <Share2 size={16} />
                Chia sẻ
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="h-12 flex-[1.4] rounded-2xl bg-slate-900 text-sm font-semibold text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Announcements;
