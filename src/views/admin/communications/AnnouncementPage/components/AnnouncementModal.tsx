import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Building2, CalendarClock, Megaphone, Pin, Users, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { buildingService } from '@/services/buildingService';
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementStatus,
  AnnouncementTargetGroup,
  AnnouncementType,
} from '@/types/announcement';
import {
  ANNOUNCEMENT_STATUS_LABELS,
  ANNOUNCEMENT_STATUS_OPTIONS,
  ANNOUNCEMENT_TARGET_GROUP_LABELS,
  ANNOUNCEMENT_TARGET_GROUP_OPTIONS,
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_OPTIONS,
} from '@/types/announcement';
import { cn } from '@/utils';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Announcement | null;
  onSubmit: (data: AnnouncementInput) => void;
  isSubmitting?: boolean;
}

interface AnnouncementFormValues {
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  publishAt: string;
  targetGroups: AnnouncementTargetGroup[];
  buildingIds: string[];
  isPinned: boolean;
}

function toDateTimeInput(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function getDefaultValues(initialData?: Announcement | null): AnnouncementFormValues {
  return {
    title: initialData?.title ?? '',
    content: initialData?.content ?? '',
    type: initialData?.type ?? 'General',
    status: initialData?.status ?? 'Published',
    publishAt: toDateTimeInput(initialData?.publishAt),
    targetGroups: initialData?.targetGroups?.length ? initialData.targetGroups : ['Resident'],
    buildingIds: initialData?.buildingIds?.length ? initialData.buildingIds : ['All'],
    isPinned: initialData?.isPinned ?? false,
  };
}

export const AnnouncementModal = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
}: AnnouncementModalProps) => {
  const { data: buildings } = useQuery({
    queryKey: ['buildings-simple'],
    queryFn: () => buildingService.getBuildings(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    defaultValues: getDefaultValues(initialData),
  });

  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(initialData));
    }
  }, [initialData, isOpen, reset]);

  const selectedStatus = watch('status');
  const selectedGroups = watch('targetGroups') || [];
  const selectedBuildings = watch('buildingIds') || [];
  const isPinned = watch('isPinned');

  if (!isOpen) return null;

  const toggleGroup = (group: AnnouncementTargetGroup) => {
    const nextValue = selectedGroups.includes(group)
      ? selectedGroups.filter((item) => item !== group)
      : [...selectedGroups, group];

    setValue('targetGroups', nextValue, { shouldDirty: true });
    if (nextValue.length > 0) {
      clearErrors('targetGroups');
    }
  };

  const toggleBuilding = (buildingId: string) => {
    if (buildingId === 'All') {
      setValue('buildingIds', ['All'], { shouldDirty: true });
      return;
    }

    const currentValues = selectedBuildings.filter((item) => item !== 'All');
    const nextValue = currentValues.includes(buildingId)
      ? currentValues.filter((item) => item !== buildingId)
      : [...currentValues, buildingId];

    setValue('buildingIds', nextValue.length > 0 ? nextValue : ['All'], { shouldDirty: true });
  };

  const onFormSubmit = (values: AnnouncementFormValues) => {
    if (values.targetGroups.length === 0) {
      setError('targetGroups', {
        type: 'manual',
        message: 'Vui lòng chọn ít nhất một nhóm nhận.',
      });
      return;
    }

    if (values.status === 'Scheduled' && !values.publishAt) {
      setError('publishAt', {
        type: 'manual',
        message: 'Vui lòng chọn ngày giờ phát.',
      });
      return;
    }

    clearErrors('publishAt');

    onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
      type: values.type,
      status: values.status,
      publishAt: values.publishAt || null,
      targetGroups: values.targetGroups,
      buildingIds: values.buildingIds.includes('All') ? [] : values.buildingIds,
      isPinned: values.isPinned,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center py-4">
        <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 md:px-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Megaphone size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.24em]">Thông báo</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {initialData ? 'Cập nhật thông báo' : 'Tạo thông báo mới'}
            </h2>
            <p className="text-sm text-slate-500">
              Điền nội dung cần gửi, chọn nhóm nhận và phạm vi tòa nhà áp dụng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="min-h-0 space-y-8 overflow-y-auto px-6 py-6 md:px-8 md:py-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('title', {
                    required: 'Vui lòng nhập tiêu đề thông báo.',
                    validate: (value) => value.trim().length > 0 || 'Vui lòng nhập tiêu đề thông báo.',
                  })}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Ví dụ: Thông báo bảo trì hệ thống điện"
                />
                {errors.title && <p className="text-sm text-rose-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Nội dung thông báo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  {...register('content', {
                    required: 'Vui lòng nhập nội dung thông báo.',
                    validate: (value) => value.trim().length > 0 || 'Vui lòng nhập nội dung thông báo.',
                  })}
                  className="min-h-[220px] w-full rounded-[28px] border border-slate-200 px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Nhập nội dung cần gửi tới người nhận."
                />
                {errors.content && <p className="text-sm text-rose-600">{errors.content.message}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Megaphone size={16} />
                  Phân loại
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ANNOUNCEMENT_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('type', type, { shouldDirty: true })}
                      className={cn(
                        'rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition',
                        watch('type') === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                      )}
                    >
                      {ANNOUNCEMENT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarClock size={16} />
                  Trạng thái và thời điểm hiển thị
                </div>
                <div className="space-y-4">
                  <select
                    {...register('status')}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    {ANNOUNCEMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {ANNOUNCEMENT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>

                  {selectedStatus === 'Scheduled' && (
                    <div className="space-y-2">
                      <input
                        type="datetime-local"
                        {...register('publishAt')}
                        className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                      {errors.publishAt && <p className="text-sm text-rose-600">{errors.publishAt.message}</p>}
                    </div>
                  )}

                  {selectedStatus !== 'Scheduled' && (
                    <p className="text-sm text-slate-500">
                      {selectedStatus === 'Published'
                        ? 'Thông báo sẽ hiển thị ngay sau khi lưu.'
                        : selectedStatus === 'Draft'
                          ? 'Bản nháp sẽ được lưu nhưng chưa hiển thị ra ngoài.'
                          : 'Thông báo đã lưu sẽ không còn hiển thị cho cư dân.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Pin size={16} />
                  Tùy chọn hiển thị
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <span>Ghim lên đầu danh sách</span>
                  <input
                    type="checkbox"
                    {...register('isPinned')}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                  />
                </label>
                {isPinned && (
                  <p className="mt-3 text-sm text-slate-500">
                    Thông báo ghim sẽ được ưu tiên hiển thị trước các thông báo khác.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users size={16} />
                Nhóm nhận thông báo
              </div>
              <div className="flex flex-wrap gap-2">
                {ANNOUNCEMENT_TARGET_GROUP_OPTIONS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleGroup(group)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition',
                      selectedGroups.includes(group)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {ANNOUNCEMENT_TARGET_GROUP_LABELS[group]}
                  </button>
                ))}
              </div>
              {errors.targetGroups && <p className="mt-3 text-sm text-rose-600">{errors.targetGroups.message}</p>}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Building2 size={16} />
                Tòa nhà áp dụng
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleBuilding('All')}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition',
                    selectedBuildings.includes('All')
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                  )}
                >
                  Tất cả tòa nhà
                </button>

                {buildings?.map((building) => (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => toggleBuilding(building.id)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition',
                      selectedBuildings.includes(building.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300',
                    )}
                  >
                    {building.buildingName}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Không chọn tòa nhà cụ thể sẽ được hiểu là áp dụng cho toàn bộ hệ thống.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật thông báo' : 'Lưu thông báo'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
