import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  FileImage,
  ImagePlus,
  Info,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { TicketPriority, TicketType } from '@/models/Ticket';
import { ticketService, type CreateTicketInput } from '@/services/ticketService';
import { cn } from '@/utils';
import { toast } from 'sonner';
import {
  buildTicketAttachmentSummary,
  getTicketCategoryMeta,
  PRIORITY_HINTS_VI,
  PRIORITY_LABELS_VI,
  TICKET_CATEGORY_OPTIONS,
  TICKET_IMAGE_LIMIT,
} from '@/features/tickets/ticketMetadata';

type TicketFormState = {
  category: TicketType | '';
  priority: TicketPriority | '';
  title: string;
  description: string;
  attachments: File[];
};

type TicketFormErrors = Partial<Record<'category' | 'priority' | 'title' | 'attachments' | 'form', string>>;

type TicketCreateContext = {
  tenantId: number | null;
  roomId: number | null;
  roomCode: string | null;
};

function validateForm(values: TicketFormState): TicketFormErrors {
  const nextErrors: TicketFormErrors = {};

  if (!values.category) nextErrors.category = 'Vui lòng chọn phân loại yêu cầu.';
  if (!values.priority) nextErrors.priority = 'Vui lòng chọn mức ưu tiên.';

  const trimmedTitle = values.title.trim();
  if (!trimmedTitle) {
    nextErrors.title = 'Vui lòng nhập tiêu đề yêu cầu.';
  } else if (trimmedTitle.length < 6) {
    nextErrors.title = 'Tiêu đề cần ít nhất 6 ký tự để ban quản lý dễ tiếp nhận.';
  }

  if (values.attachments.length > TICKET_IMAGE_LIMIT) {
    nextErrors.attachments = `Chỉ được đính kèm tối đa ${TICKET_IMAGE_LIMIT} hình ảnh.`;
  }

  return nextErrors;
}

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<TicketFormState>({
    category: 'Maintenance',
    priority: 'Medium',
    title: '',
    description: '',
    attachments: [],
  });
  const [errors, setErrors] = useState<TicketFormErrors>({});

  const categoryMeta = useMemo(() => getTicketCategoryMeta(form.category), [form.category]);
  const imagePreviewUrls = useMemo(
    () => form.attachments.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.attachments]
  );

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [imagePreviewUrls]);

  const { data: createContext, isLoading: contextLoading } = useQuery<TicketCreateContext>({
    queryKey: ['portal-ticket-create-context'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { tenantId: null, roomId: null, roomCode: null };
      }

      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('profile_id', user.id)
        .eq('is_deleted', false)
        .limit(1);

      if (tenantError) throw tenantError;

      const tenantId = tenants?.[0]?.id ?? null;
      if (!tenantId) {
        return { tenantId: null, roomId: null, roomCode: null };
      }

      const { data: contractLinks, error: contractLinkError } = await supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', tenantId)
        .limit(10);

      if (contractLinkError) throw contractLinkError;

      const contractIds = (contractLinks ?? []).map((row) => row.contract_id);
      if (contractIds.length === 0) {
        return { tenantId, roomId: null, roomCode: null };
      }

      const { data: contractRow, error: contractError } = await supabase
        .from('contracts')
        .select('room_id')
        .in('id', contractIds)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();

      if (contractError) throw contractError;

      let roomCode: string | null = null;
      if (contractRow?.room_id) {
        const { data: roomRow, error: roomError } = await supabase
          .from('rooms')
          .select('room_code')
          .eq('id', contractRow.room_id)
          .maybeSingle();

        if (roomError) throw roomError;
        roomCode = roomRow?.room_code ?? null;
      }

      return {
        tenantId,
        roomId: contractRow?.room_id ?? null,
        roomCode,
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const tenantId = createContext?.tenantId ?? null;
      if (!tenantId) {
        throw new Error('Không tìm thấy hồ sơ cư dân đang hoạt động.');
      }

      const payload: CreateTicketInput = {
        tenantId,
        roomId: createContext?.roomId ?? null,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.category,
        priority: form.priority || categoryMeta.suggestedPriority,
        status: 'Open',
        assignedToId: null,
        attachments: form.attachments,
      };

      return ticketService.createTicket(payload);
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['portal-ticket', ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['portal-ticket-comments', ticket.id] });
      toast.success('Đã gửi yêu cầu thành công.');
      navigate('/portal/tickets');
    },
    onError: (error: Error) => {
      setErrors((current) => ({
        ...current,
        form: error.message || 'Không thể tạo ticket lúc này. Vui lòng thử lại.',
      }));
    },
  });

  const canSubmit = useMemo(() => {
    return !contextLoading && !createMutation.isPending && !!createContext?.tenantId;
  }, [contextLoading, createMutation.isPending, createContext?.tenantId]);

  const handleCategoryChange = (category: TicketType) => {
    const meta = getTicketCategoryMeta(category);
    setForm((current) => ({
      ...current,
      category,
      priority: category === 'Emergency' ? 'Critical' : current.priority || meta.suggestedPriority,
      title: current.title || '',
    }));
    setErrors((current) => ({ ...current, category: undefined, priority: undefined, form: undefined }));
  };

  const handleFileSelection = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const nextFiles = Array.from(incomingFiles)
      .filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
      .slice(0, TICKET_IMAGE_LIMIT - form.attachments.length);

    if (nextFiles.length === 0) {
      setErrors((current) => ({
        ...current,
        attachments: `Chỉ hỗ trợ JPG, PNG, WEBP và tối đa ${TICKET_IMAGE_LIMIT} ảnh.`,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      attachments: [...current.attachments, ...nextFiles],
    }));
    setErrors((current) => ({ ...current, attachments: undefined, form: undefined }));
  };

  const handleRemoveAttachment = (targetName: string) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((file) => file.name !== targetName),
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateForm(form);
    if (!createContext?.tenantId) {
      nextErrors.form = 'Không tìm thấy hồ sơ cư dân để tạo ticket.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createMutation.mutate();
  };

  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#f7f7f2_0%,#ffffff_28%,#f8fbfd_100%)] pb-24 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Hỗ trợ cư dân</p>
            <h1 className="text-lg font-black tracking-tight text-slate-900">Tạo yêu cầu mới</h1>
          </div>
          <div className="w-11" />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
          <div className={cn('relative overflow-hidden p-6 text-white sm:p-8', `bg-gradient-to-br ${categoryMeta.accentClassName}`)}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_40%)]" />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]">
                    <Sparkles size={14} />
                    <span>Biểu mẫu thông minh</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{categoryMeta.label}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">{categoryMeta.description}</p>
                  </div>
                </div>
                <div className="hidden rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur sm:block">
                  <categoryMeta.icon size={34} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                <div className="overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <img
                    src={categoryMeta.illustration}
                    alt={categoryMeta.label}
                    className="h-52 w-full rounded-[22px] object-cover"
                  />
                </div>

                <div className="rounded-[28px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/70">Gợi ý cần có</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/90">
                    {categoryMeta.helperPoints.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-white/90" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 sm:p-8">
            <div className="rounded-[28px] border border-slate-200 bg-[#faf7f1] p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                  <Info size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Liên kết cư dân</p>
                  <p className="text-sm font-bold text-slate-800">
                    {contextLoading
                      ? 'Đang kiểm tra hợp đồng hiện tại...'
                      : createContext?.roomCode
                      ? `Ticket sẽ gắn với phòng ${createContext.roomCode}`
                      : 'Chưa tìm thấy phòng đang hoạt động, ticket sẽ được gửi mà không gắn phòng.'}
                  </p>
                </div>
              </div>
            </div>

            {errors.form && (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                {errors.form}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Phân loại yêu cầu</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">Chọn đúng nhóm để xử lý nhanh hơn</h3>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {TICKET_CATEGORY_OPTIONS.map((option) => {
                  const active = form.category === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleCategoryChange(option.id)}
                      className={cn(
                        'rounded-[26px] border p-4 text-left transition-all',
                        active
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black tracking-tight">{option.shortLabel}</p>
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
              {errors.category && <p className="text-sm font-bold text-rose-600">{errors.category}</p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Mức ưu tiên
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => {
                    setForm((current) => ({ ...current, priority: e.target.value as TicketPriority }));
                    setErrors((current) => ({ ...current, priority: undefined, form: undefined }));
                  }}
                  className={cn(
                    'h-14 w-full rounded-[22px] border bg-slate-50 px-5 text-sm font-bold text-slate-800 outline-none transition-all focus:border-slate-900 focus:bg-white',
                    errors.priority ? 'border-rose-300' : 'border-slate-200'
                  )}
                  disabled={form.category === 'Emergency'}
                >
                  {(['Low', 'Medium', 'High', 'Critical'] as TicketPriority[]).map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS_VI[priority]}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-slate-500">{PRIORITY_HINTS_VI[form.priority || 'Medium']}</p>
                {errors.priority && <p className="text-sm font-bold text-rose-600">{errors.priority}</p>}
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Hình ảnh đính kèm
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-14 w-full items-center justify-between rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 text-left transition-all hover:border-slate-900 hover:bg-white"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm">
                      <ImagePlus size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-800">Chọn ảnh hiện trạng</span>
                      <span className="block text-xs text-slate-500">JPG, PNG, WEBP. Tối đa 4 ảnh.</span>
                    </span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                    {form.attachments.length}/{TICKET_IMAGE_LIMIT}
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
                <p className="text-sm text-slate-500">{buildTicketAttachmentSummary(form.attachments)}</p>
                {errors.attachments && <p className="text-sm font-bold text-rose-600">{errors.attachments}</p>}
              </div>
            </div>

            {form.attachments.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {imagePreviewUrls.map(({ file, url }) => (
                  <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                    <div className="relative aspect-[1.1] overflow-hidden bg-slate-100">
                      <img src={url} alt={file.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.name)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/75 text-white backdrop-blur"
                      >
                        <Trash2 size={15} />
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

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Tiêu đề yêu cầu
              </label>
              <input
                type="text"
                placeholder={categoryMeta.titlePlaceholder}
                value={form.title}
                onChange={(e) => {
                  setForm((current) => ({ ...current, title: e.target.value }));
                  setErrors((current) => ({ ...current, title: undefined, form: undefined }));
                }}
                className={cn(
                  'h-14 w-full rounded-[22px] border bg-slate-50 px-5 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white',
                  errors.title ? 'border-rose-300' : 'border-slate-200'
                )}
              />
              {errors.title && <p className="text-sm font-bold text-rose-600">{errors.title}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                Mô tả chi tiết
              </label>
              <textarea
                placeholder={categoryMeta.descriptionPlaceholder}
                value={form.description}
                onChange={(e) => {
                  setForm((current) => ({ ...current, description: e.target.value }));
                  setErrors((current) => ({ ...current, form: undefined }));
                }}
                className="min-h-[180px] w-full resize-none rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] leading-7 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex h-16 w-full items-center justify-center gap-3 rounded-[24px] text-sm font-black uppercase tracking-[0.28em] text-white transition-all active:scale-[0.99] disabled:opacity-50',
                form.category === 'Emergency'
                  ? 'bg-rose-600 shadow-[0_24px_60px_rgba(225,29,72,0.3)]'
                  : 'bg-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.24)]'
              )}
            >
              {createMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <span>{form.category === 'Emergency' ? 'Gửi yêu cầu khẩn cấp' : 'Gửi ticket hỗ trợ'}</span>
                  <Send size={18} strokeWidth={2.6} />
                </>
              )}
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tóm tắt trước khi gửi</p>
            <div className="mt-5 space-y-4">
              <div className={cn('inline-flex rounded-full border px-4 py-2 text-sm font-bold', categoryMeta.badgeClassName)}>
                {categoryMeta.label}
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Ưu tiên</span>
                  <span className="font-bold text-slate-900">{PRIORITY_LABELS_VI[form.priority || 'Medium']}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Phòng liên kết</span>
                  <span className="font-bold text-slate-900">{createContext?.roomCode || 'Chưa gắn phòng'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Số ảnh</span>
                  <span className="font-bold text-slate-900">{form.attachments.length}</span>
                </div>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Tiêu đề hiện tại</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                  {form.title.trim() || 'Chưa nhập tiêu đề'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-[#111827] p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/50">Lưu ý xử lý</p>
                <p className="mt-2 text-sm leading-6 text-white/85">
                  Với tình huống nguy hiểm như chập điện, rò nước lớn hoặc cháy nổ, hãy gọi ngay hotline hoặc bảo vệ sau khi gửi ticket để được hỗ trợ tức thời.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <FileImage size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Ảnh nên chụp như thế nào</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Chụp 1 ảnh toàn cảnh để thấy vị trí sự cố trong phòng.</li>
                  <li>Chụp thêm 1 ảnh cận cảnh để thấy mức độ hư hỏng.</li>
                  <li>Nếu có mã thiết bị hoặc đồng hồ, chụp rõ thông tin đó.</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreateTicket;
