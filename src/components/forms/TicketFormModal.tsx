import React, { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Building2, ImagePlus, Send, ShieldCheck, Trash2, User, X } from 'lucide-react';
import { toast } from 'sonner';

import { SelectAsync } from '@/components/ui/SelectAsync';
import {
  buildTicketAttachmentSummary,
  getTicketCategoryMeta,
  PRIORITY_HINTS_VI,
  PRIORITY_LABELS_VI,
  TICKET_CATEGORY_OPTIONS,
  TICKET_IMAGE_LIMIT,
} from '@/features/tickets/ticketMetadata';
import type { TicketPriority, TicketType } from '@/models/Ticket';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { tenantService } from '@/services/tenantService';
import { ticketService } from '@/services/ticketService';
import { ticketQueryKeys } from '@/features/tickets/ticketPresentation';
import { cn } from '@/utils';

export type TicketFormData = {
  buildingId: string;
  roomId?: string;
  tenantId?: string;
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description: string;
  assignedToId?: string;
  attachments: File[];
};

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TicketFormData) => void;
}

export const TicketFormModal = ({ isOpen, onClose, onSubmit }: TicketModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketFormData>({
    defaultValues: {
      buildingId: '',
      roomId: '',
      tenantId: '',
      type: 'Maintenance',
      priority: 'Medium',
      title: '',
      description: '',
      assignedToId: '',
      attachments: [],
    },
  });

  const selectedType = watch('type');
  const selectedBuilding = watch('buildingId');
  const categoryMeta = useMemo(() => getTicketCategoryMeta(selectedType), [selectedType]);

  const { data: staffList } = useQuery({
    queryKey: ticketQueryKeys.staffList,
    queryFn: () => ticketService.getStaff(),
    enabled: isOpen,
  });

  React.useEffect(() => {
    if (!isOpen) {
      setAttachments([]);
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleTypeChange = (type: TicketType) => {
    const meta = getTicketCategoryMeta(type);
    setValue('type', type, { shouldValidate: true });
    setValue('priority', type === 'Emergency' ? 'Critical' : meta.suggestedPriority, { shouldValidate: true });
  };

  const handleFileSelection = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const nextFiles = Array.from(incomingFiles)
      .filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      .slice(0, TICKET_IMAGE_LIMIT - attachments.length);

    if (nextFiles.length === 0) {
      toast.error(`Chỉ hỗ trợ JPG, PNG, WEBP và tối đa ${TICKET_IMAGE_LIMIT} ảnh.`);
      return;
    }

    const merged = [...attachments, ...nextFiles];
    setAttachments(merged);
    setValue('attachments', merged, { shouldValidate: true });
  };

  const handleRemoveAttachment = (fileName: string) => {
    const nextAttachments = attachments.filter((file) => file.name !== fileName);
    setAttachments(nextAttachments);
    setValue('attachments', nextAttachments, { shouldValidate: true });
  };

  const submit = (values: TicketFormData) => {
    onSubmit({ ...values, attachments });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.28)]">
        <div className={cn('border-b p-6 text-white sm:p-8', `bg-gradient-to-br ${categoryMeta.accentClassName}`)}>
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">Yêu cầu hỗ trợ nội bộ</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Tạo yêu cầu mới</h2>
              <p className="mt-3 text-sm leading-6 text-white/90">{categoryMeta.description}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 transition hover:bg-white/15"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit(submit)} className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Phân loại yêu cầu</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {TICKET_CATEGORY_OPTIONS.map((option) => {
                  const active = selectedType === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleTypeChange(option.id)}
                      className={cn(
                        'rounded-[24px] border p-4 text-left transition-all',
                        active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black">{option.shortLabel}</p>
                          <p className={cn('mt-1 text-sm leading-5', active ? 'text-white/75' : 'text-slate-500')}>
                            {option.description}
                          </p>
                        </div>
                        <div className={cn('rounded-2xl p-3', active ? 'bg-white/10' : 'bg-slate-50')}>
                          <option.icon size={18} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tòa nhà</label>
                <Controller
                  name="buildingId"
                  control={control}
                  rules={{ required: 'Vui lòng chọn tòa nhà.' }}
                  render={({ field }) => (
                    <SelectAsync
                      placeholder="Chọn tòa nhà..."
                      icon={Building2}
                      className={errors.buildingId ? 'border-red-500' : ''}
                      value={field.value}
                      onChange={field.onChange}
                      loadOptions={async (search) => {
                        const buildings = await buildingService.getBuildings({ search });
                        return buildings.map((building) => ({
                          label: building.buildingName,
                          value: String(building.id),
                        }));
                      }}
                    />
                  )}
                />
                {errors.buildingId && <p className="text-sm font-bold text-rose-600">{errors.buildingId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Phòng</label>
                <Controller
                  name="roomId"
                  control={control}
                  render={({ field }) => (
                    <SelectAsync
                      placeholder={selectedBuilding ? 'Chọn phòng...' : 'Chọn tòa nhà trước'}
                      value={field.value}
                      disabled={!selectedBuilding}
                      onChange={field.onChange}
                      loadOptions={async (search) => {
                        if (!selectedBuilding) return [];
                        const rooms = await roomService.getRooms({ buildingId: selectedBuilding, search });
                        return rooms.map((room) => ({
                          label: `Phòng ${room.roomCode}`,
                          value: String(room.id),
                        }));
                      }}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mức ưu tiên</label>
                <select
                  {...register('priority')}
                  className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white"
                  disabled={selectedType === 'Emergency'}
                >
                  {(['Low', 'Medium', 'High', 'Critical'] as TicketPriority[]).map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS_VI[priority]}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-slate-500">{PRIORITY_HINTS_VI[watch('priority') || 'Medium']}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Người phụ trách</label>
                <Controller
                  name="assignedToId"
                  control={control}
                  render={({ field }) => (
                    <SelectAsync
                      placeholder="Chọn nhân viên..."
                      icon={ShieldCheck}
                      value={field.value}
                      onChange={field.onChange}
                      loadOptions={async (search) => {
                        const list = staffList ?? (await ticketService.getStaff());
                        const filtered = search
                          ? list.filter((staff) => staff.fullName.toLowerCase().includes(search.toLowerCase()))
                          : list;

                        return filtered.map((staff) => ({
                          label: `${staff.fullName} (${staff.role})`,
                          value: staff.id,
                        }));
                      }}
                    />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Cư dân yêu cầu</label>
                <Controller
                  name="tenantId"
                  control={control}
                  rules={{ required: 'Vui lòng chọn cư dân.' }}
                  render={({ field }) => (
                    <SelectAsync
                      placeholder="Chọn cư dân..."
                      icon={User}
                      value={field.value}
                      onChange={field.onChange}
                      loadOptions={async (search) => {
                        const tenants = await tenantService.getTenants({ search });
                        return tenants.map((tenant) => ({
                          label: `${tenant.fullName} (${tenant.currentRoomCode || 'Chưa gắn phòng'})`,
                          value: String(tenant.id),
                        }));
                      }}
                    />
                  )}
                />
                {errors.tenantId && <p className="text-sm font-bold text-rose-600">{errors.tenantId.message}</p>}
              </div>
            </section>

            <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tiêu đề yêu cầu</label>
                <input
                  {...register('title', { required: 'Vui lòng nhập tiêu đề yêu cầu.' })}
                  className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
                  placeholder={categoryMeta.titlePlaceholder}
                />
                {errors.title && <p className="text-sm font-bold text-rose-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mô tả chi tiết</label>
                <textarea
                  {...register('description')}
                  className="min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
                  placeholder={categoryMeta.descriptionPlaceholder}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Hình ảnh đính kèm</label>
                  <span className="text-[11px] font-bold text-slate-400">
                    {attachments.length}/{TICKET_IMAGE_LIMIT}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-14 w-full items-center justify-between rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 text-left transition hover:border-primary hover:bg-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm">
                      <ImagePlus size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-800">Chọn ảnh minh họa</span>
                      <span className="block text-xs text-slate-500">JPG, PNG, WEBP. Tối đa 4 ảnh.</span>
                    </span>
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFileSelection(event.target.files)}
                />

                <p className="text-sm text-slate-500">{buildTicketAttachmentSummary(attachments)}</p>

                {attachments.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {attachments.map((file) => (
                      <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.name)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
              >
                <Send size={16} />
                Gửi yêu cầu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
