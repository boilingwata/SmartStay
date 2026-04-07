import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ImagePlus,
  Send,
  ShieldCheck,
  Trash2,
  User,
  X,
} from 'lucide-react';

import { SelectAsync } from '@/components/ui/SelectAsync';
import { buildingService } from '@/services/buildingService';
import { roomService } from '@/services/roomService';
import { tenantService } from '@/services/tenantService';
import { ticketService } from '@/services/ticketService';
import { cn } from '@/utils';
import { toast } from 'sonner';
import type { TicketPriority, TicketStatus, TicketType } from '@/models/Ticket';
import {
  buildTicketAttachmentSummary,
  getTicketCategoryMeta,
  PRIORITY_HINTS_VI,
  PRIORITY_LABELS_VI,
  TICKET_CATEGORY_OPTIONS,
  TICKET_IMAGE_LIMIT,
} from '@/features/tickets/ticketMetadata';

type TicketFormData = {
  buildingId: string;
  roomId?: string;
  tenantId?: string;
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description: string;
  assignedToId?: string;
  slaDeadline?: string;
  status?: TicketStatus;
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
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TicketFormData>({
    defaultValues: {
      type: 'Maintenance',
      priority: 'Medium',
      status: 'Open',
      attachments: [],
    },
  });

  const { data: staffList } = useQuery({
    queryKey: ['staff-list'],
    queryFn: () => ticketService.getStaff(),
    enabled: isOpen,
  });

  const selectedType = watch('type');
  const selectedBuilding = watch('buildingId');
  const categoryMeta = useMemo(() => getTicketCategoryMeta(selectedType), [selectedType]);
  const imagePreviewUrls = useMemo(
    () => attachments.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [attachments]
  );

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  useEffect(() => {
    if (!isOpen) {
      setAttachments([]);
      reset({
        buildingId: '',
        roomId: '',
        tenantId: '',
        type: 'Maintenance',
        priority: 'Medium',
        title: '',
        description: '',
        assignedToId: '',
        slaDeadline: '',
        status: 'Open',
        attachments: [],
      });
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

  const handleRemoveAttachment = (targetName: string) => {
    const nextAttachments = attachments.filter((file) => file.name !== targetName);
    setAttachments(nextAttachments);
    setValue('attachments', nextAttachments, { shouldValidate: true });
  };

  const submitForm = (data: TicketFormData) => {
    onSubmit({ ...data, attachments });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.28)]">
        <div className={cn('relative overflow-hidden border-b border-white/10 p-6 text-white sm:p-8', `bg-gradient-to-br ${categoryMeta.accentClassName}`)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_42%)]" />
          <div className="relative z-10 flex items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/65">Phiếu hỗ trợ nội bộ</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Tạo ticket hỗ trợ mới</h2>
              <p className="mt-3 text-sm leading-6 text-white/85">{categoryMeta.description}</p>
            </div>

            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-all hover:bg-white/15"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-y-auto border-r border-slate-200 bg-[#f8fafc] p-6 sm:p-8">
            <form onSubmit={handleSubmit(submitForm)} className="space-y-8">
              <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Phân loại</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {TICKET_CATEGORY_OPTIONS.map((option) => {
                    const active = selectedType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleTypeChange(option.id)}
                        className={cn(
                          'rounded-[24px] border p-4 text-left transition-all',
                          active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 hover:bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-black">{option.shortLabel}</p>
                            <p className={cn('mt-1 text-sm leading-5', active ? 'text-white/75' : 'text-slate-500')}>
                              {option.description}
                            </p>
                          </div>
                          <div className={cn('rounded-2xl p-3', active ? 'bg-white/10' : 'bg-white')}>
                            <option.icon size={18} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="grid gap-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
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
                        placeholder={selectedBuilding ? 'Chọn phòng...' : 'Hãy chọn tòa nhà trước'}
                        value={field.value}
                        onChange={field.onChange}
                        loadOptions={async (search) => {
                          if (!selectedBuilding) return [];
                          const rooms = await roomService.getRooms({
                            buildingId: selectedBuilding,
                            search: search || undefined,
                          });
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
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Ưu tiên</label>
                  <select
                    {...register('priority')}
                    className={cn(
                      'h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-slate-900 focus:bg-white',
                      selectedType === 'Emergency' && 'bg-rose-50 text-rose-700'
                    )}
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
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Hạn xử lý (SLA)</label>
                  <input
                    type="datetime-local"
                    {...register('slaDeadline')}
                    className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </section>

              <section className="grid gap-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Cư dân yêu cầu</label>
                  <Controller
                    name="tenantId"
                    control={control}
                    render={({ field }) => (
                      <SelectAsync
                        placeholder="Chọn cư dân..."
                        icon={User}
                        value={field.value}
                        onChange={field.onChange}
                        loadOptions={async (search) => {
                          const tenants = await tenantService.getTenants({ search });
                          return tenants.map((tenant) => ({
                            label: `${tenant.fullName} (${tenant.currentRoomCode || 'N/A'})`,
                            value: String(tenant.id),
                          }));
                        }}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Nhân viên phụ trách</label>
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
                          const list = staffList || await ticketService.getStaff();
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
              </section>

              <section className="space-y-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tiêu đề ticket</label>
                  <input
                    {...register('title', { required: 'Vui lòng nhập tiêu đề ticket.' })}
                    className="h-12 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
                    placeholder={categoryMeta.titlePlaceholder}
                  />
                  {errors.title && <p className="text-sm font-bold text-rose-600">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Mô tả chi tiết</label>
                  <textarea
                    {...register('description')}
                    className="min-h-[150px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
                    placeholder={categoryMeta.descriptionPlaceholder}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Hình ảnh đính kèm</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-14 w-full items-center justify-between rounded-[20px] border border-dashed border-slate-300 bg-slate-50 px-4 text-left transition-all hover:border-slate-900 hover:bg-white"
                  >
                    <span className="flex items-center gap-3">
                      <span className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm">
                        <ImagePlus size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-slate-800">Thêm hình ảnh mô tả</span>
                        <span className="block text-xs text-slate-500">JPG, PNG, WEBP. Tối đa 4 ảnh.</span>
                      </span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                      {attachments.length}/{TICKET_IMAGE_LIMIT}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelection(e.target.files)}
                  />
                  <p className="text-sm text-slate-500">{buildTicketAttachmentSummary(attachments)}</p>
                </div>

                {attachments.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {imagePreviewUrls.map(({ file, url }) => (
                      <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                        <div className="relative aspect-[1.1] overflow-hidden bg-slate-100">
                          <img src={url} alt={file.name} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.name)}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/75 text-white backdrop-blur"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="px-4 py-3">
                          <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </form>
          </div>

          <aside className="overflow-y-auto bg-white p-6 sm:p-8">
            <div className="space-y-6">
              <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">Gợi ý xử lý</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight">{categoryMeta.label}</h3>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-white/85">
                  {categoryMeta.helperPoints.map((point) => (
                    <li key={point} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-white/90" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                <img src={categoryMeta.illustration} alt={categoryMeta.label} className="h-56 w-full object-cover" />
                <div className="space-y-4 p-6">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tóm tắt</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Phân loại</span>
                      <span className="font-bold text-slate-900">{categoryMeta.shortLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Ưu tiên</span>
                      <span className="font-bold text-slate-900">{PRIORITY_LABELS_VI[watch('priority') || 'Medium']}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">Số ảnh</span>
                      <span className="font-bold text-slate-900">{attachments.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit(submitForm)}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-[22px] bg-slate-950 text-sm font-black uppercase tracking-[0.28em] text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)] transition-all active:scale-[0.99]"
              >
                <span>Lưu ticket</span>
                <Send size={18} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
