import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarClock,
  Edit,
  Globe2,
  Layers3,
  Megaphone,
  Pin,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/ui/StatusBadge';
import { Spinner } from '@/components/ui/Feedback';
import { buildingService } from '@/services/buildingService';
import { announcementService } from '@/services/announcementService';
import type { Announcement, AnnouncementInput, AnnouncementStatus, AnnouncementType } from '@/types/announcement';
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_TARGET_GROUP_LABELS,
  ANNOUNCEMENT_TYPE_LABELS,
  getAnnouncementSummary,
} from '@/types/announcement';
import { cn, formatDate } from '@/utils';

import { AnnouncementModal } from './components/AnnouncementModal';

const STATUS_FILTERS: Array<{ value: AnnouncementStatus | 'All'; label: string }> = [
  { value: 'All', label: 'Tất cả' },
  { value: 'Published', label: ANNOUNCEMENT_STATUS_LABELS.Published },
  { value: 'Scheduled', label: ANNOUNCEMENT_STATUS_LABELS.Scheduled },
  { value: 'Draft', label: ANNOUNCEMENT_STATUS_LABELS.Draft },
  { value: 'Archived', label: ANNOUNCEMENT_STATUS_LABELS.Archived },
];

function getTypeIcon(type: AnnouncementType) {
  switch (type) {
    case 'Urgent':
      return <AlertTriangle className="text-rose-600" size={18} />;
    case 'Maintenance':
      return <Layers3 className="text-amber-600" size={18} />;
    case 'Security':
      return <ShieldCheck className="text-slate-700" size={18} />;
    case 'Event':
      return <Megaphone className="text-sky-600" size={18} />;
    case 'Holiday':
      return <Globe2 className="text-emerald-600" size={18} />;
    default:
      return <Bell className="text-primary" size={18} />;
  }
}

function getDisplayTime(announcement: Announcement): string {
  if (announcement.status === 'Draft') {
    return 'Chưa lên lịch';
  }

  if (announcement.status === 'Archived') {
    return 'Đã lưu, không còn hiển thị';
  }

  const value = announcement.publishAt || announcement.createdAt;
  return formatDate(value, 'HH:mm - dd/MM/yyyy');
}

const AnnouncementPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AnnouncementStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const {
    data: announcements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAnnouncements(),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings-simple'],
    queryFn: () => buildingService.getBuildings(),
  });

  const createMutation = useMutation({
    mutationFn: (data: AnnouncementInput) => announcementService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Đã tạo thông báo.');
      handleCloseModal();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Không thể tạo thông báo.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AnnouncementInput }) =>
      announcementService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Đã cập nhật thông báo.');
      handleCloseModal();
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Không thể cập nhật thông báo.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Đã xóa thông báo.');
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Không thể xóa thông báo.');
    },
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: AnnouncementInput) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data });
      return;
    }

    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này không?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesStatus = activeTab === 'All' || announcement.status === activeTab;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      announcement.title.toLowerCase().includes(normalizedSearch) ||
      announcement.content.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const totalCount = announcements.length;
  const publishedCount = announcements.filter((item) => item.status === 'Published').length;
  const scheduledCount = announcements.filter((item) => item.status === 'Scheduled').length;
  const draftCount = announcements.filter((item) => item.status === 'Draft').length;

  const getBuildingLabel = (buildingIds: string[]) => {
    if (buildingIds.length === 0) {
      return 'Tất cả tòa nhà';
    }

    return buildingIds
      .map((buildingId) => buildings.find((building) => building.id === buildingId)?.buildingName || `Tòa nhà #${buildingId}`)
      .join(', ');
  };

  const getTargetGroupLabel = (announcement: Announcement) =>
    announcement.targetGroups.map((group) => ANNOUNCEMENT_TARGET_GROUP_LABELS[group] || group).join(', ');

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Megaphone size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Thông báo nội bộ</h1>
              <p className="text-sm text-slate-500">
                Quản lý thông báo nội bộ theo đúng nhóm nhận và tòa nhà áp dụng.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          Tạo thông báo mới
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tổng thông báo', value: totalCount, tone: 'bg-primary/10 text-primary' },
          { label: 'Đang hiển thị', value: publishedCount, tone: 'bg-emerald-100 text-emerald-700' },
          { label: 'Hẹn giờ', value: scheduledCount, tone: 'bg-sky-100 text-sky-700' },
          { label: 'Bản nháp', value: draftCount, tone: 'bg-amber-100 text-amber-700' },
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
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveTab(filter.value)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeTab === filter.value
                  ? 'border-primary bg-primary text-white'
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
          placeholder="Tìm theo tiêu đề hoặc nội dung"
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 lg:max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error instanceof Error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error.message || 'Không thể tải danh sách thông báo.'}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <Megaphone className="mx-auto mb-4 text-slate-300" size={40} />
          <h3 className="text-lg font-semibold text-slate-900">Chưa có thông báo phù hợp</h3>
          <p className="mt-2 text-sm text-slate-500">
            {announcements.length === 0
              ? 'Hiện chưa có thông báo nào trong mục này.'
              : 'Không có thông báo khớp với bộ lọc hoặc từ khóa đang chọn.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4">
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50">
                    {getTypeIcon(announcement.type)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                      </span>
                      <StatusBadge
                        status={announcement.status}
                        size="sm"
                        label={ANNOUNCEMENT_STATUS_LABELS[announcement.status]}
                      />
                      {announcement.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          <Pin size={12} />
                          Ghim đầu mục
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-900">{announcement.title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{getAnnouncementSummary(announcement.content)}</p>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-500 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock size={16} className="text-slate-400" />
                        <span>{getDisplayTime(announcement)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span>{getTargetGroupLabel(announcement)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        <span>{getBuildingLabel(announcement.buildingIds)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2 lg:pl-4">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(announcement)}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <Edit size={16} />
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(announcement.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingAnnouncement}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default AnnouncementPage;
