import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus, Info, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Spinner } from '@/components/ui';
import {
  buildTicketAttachmentSummary,
  getTicketCategoryMeta,
  PRIORITY_HINTS_VI,
  PRIORITY_LABELS_VI,
  TICKET_CATEGORY_OPTIONS,
  TICKET_IMAGE_LIMIT,
} from '@/features/tickets/ticketMetadata';
import { ticketQueryKeys } from '@/features/tickets/ticketPresentation';
import { supabase } from '@/lib/supabase';
import type { TicketPriority, TicketType } from '@/models/Ticket';
import { ticketService, type CreateTicketInput } from '@/services/ticketService';
import { cn } from '@/utils';

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
  const errors: TicketFormErrors = {};

  if (!values.category) errors.category = 'Vui lòng chọn phân loại yêu cầu.';
  if (!values.priority) errors.priority = 'Vui lòng chọn mức ưu tiên.';

  const title = values.title.trim();
  if (!title) {
    errors.title = 'Vui lòng nhập tiêu đề yêu cầu.';
  } else if (title.length < 6) {
    errors.title = 'Tiêu đề cần tối thiểu 6 ký tự để ban quản lý dễ tiếp nhận.';
  }

  if (values.attachments.length > TICKET_IMAGE_LIMIT) {
    errors.attachments = `Chỉ được đính kèm tối đa ${TICKET_IMAGE_LIMIT} ảnh.`;
  }

  return errors;
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

  const categoryMeta = useMemo(() => getTicketCategoryMeta(form.category || 'Maintenance'), [form.category]);

  const { data: createContext, isLoading: contextLoading, isError: contextError } = useQuery<TicketCreateContext>({
    queryKey: ticketQueryKeys.portalCreateContext,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      const { data: contractLinks, error: contractError } = await supabase
        .from('contract_tenants')
        .select('contract_id')
        .eq('tenant_id', tenantId)
        .limit(10);

      if (contractError) throw contractError;

      const contractIds = (contractLinks ?? []).map((row) => row.contract_id);
      if (contractIds.length === 0) {
        return { tenantId, roomId: null, roomCode: null };
      }

      const { data: contractRow, error: activeContractError } = await supabase
        .from('contracts')
        .select('room_id')
        .in('id', contractIds)
        .eq('status', 'active')
        .eq('is_deleted', false)
        .limit(1)
        .maybeSingle();

      if (activeContractError) throw activeContractError;

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
        type: form.category || 'Maintenance',
        priority: form.priority || categoryMeta.suggestedPriority,
        status: 'Open',
        assignedToId: null,
        attachments: form.attachments,
      };

      return ticketService.createTicket(payload);
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', 'portal'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', 'owner'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Đã gửi yêu cầu thành công.');
      navigate(`/portal/tickets/${ticket.id}`);
    },
    onError: (error: Error) => {
      setErrors((current) => ({
        ...current,
        form: error.message || 'Không thể tạo yêu cầu lúc này. Vui lòng thử lại.',
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

  const handleRemoveAttachment = (fileName: string) => {
    setForm((current) => ({
      ...current,
      attachments: current.attachments.filter((file) => file.name !== fileName),
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateForm(form);
    if (!createContext?.tenantId) {
      nextErrors.form = 'Không tìm thấy hồ sơ cư dân để tạo yêu cầu.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createMutation.mutate();
  };

  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#f7f7f2_0%,#ffffff_30%,#f8fbfd_100%)] pb-24 text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition active:scale-95"
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

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.08)]">
          <div className={cn('p-6 text-white sm:p-8', `bg-gradient-to-br ${categoryMeta.accentClassName}`)}>
            <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em]">
                  <Info size={14} />
                  Biểu mẫu hỗ trợ
                </p>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{categoryMeta.label}</h2>
                <p className="max-w-2xl text-sm leading-6 text-white/85">{categoryMeta.description}</p>
              </div>

              <div className="rounded-[28px] border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/70">Gợi ý nên có</p>
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
                      ? 'Đang kiểm tra phòng đang sử dụng...'
                      : contextError
                        ? 'Không thể xác định phòng hiện tại. Bạn vẫn có thể gửi yêu cầu chung.'
                        : createContext?.roomCode
                          ? `Yêu cầu sẽ gắn với phòng ${createContext.roomCode}.`
                          : 'Chưa tìm thấy phòng đang hoạt động, yêu cầu sẽ được gửi mà không gắn phòng.'}
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
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Phân loại yêu cầu</p>
                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                  Chọn đúng nhóm để ban quản lý xử lý nhanh hơn
                </h3>
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
                  onChange={(event) => {
                    setForm((current) => ({ ...current, priority: event.target.value as TicketPriority }));
                    setErrors((current) => ({ ...current, priority: undefined, form: undefined }));
                  }}
                  className={cn(
                    'h-14 w-full rounded-[22px] border bg-slate-50 px-5 text-sm font-bold text-slate-800 outline-none transition focus:border-primary focus:bg-white',
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
                  className="flex h-14 w-full items-center justify-between rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-5 text-left transition hover:border-primary hover:bg-white"
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
                  onChange={(event) => handleFileSelection(event.target.files)}
                />
                <p className="text-sm text-slate-500">{buildTicketAttachmentSummary(form.attachments)}</p>
                {errors.attachments && <p className="text-sm font-bold text-rose-600">{errors.attachments}</p>}
              </div>
            </div>

            {form.attachments.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {form.attachments.map((file) => (
                  <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{file.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(file.name)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={15} />
                      </button>
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
                onChange={(event) => {
                  setForm((current) => ({ ...current, title: event.target.value }));
                  setErrors((current) => ({ ...current, title: undefined, form: undefined }));
                }}
                className={cn(
                  'h-14 w-full rounded-[22px] border bg-slate-50 px-5 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white',
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
                onChange={(event) => {
                  setForm((current) => ({ ...current, description: event.target.value }));
                  setErrors((current) => ({ ...current, form: undefined }));
                }}
                className="min-h-[180px] w-full resize-none rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-[15px] leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'flex h-16 w-full items-center justify-center gap-3 rounded-[24px] text-sm font-black uppercase tracking-[0.28em] text-white transition active:scale-[0.99] disabled:opacity-50',
                form.category === 'Emergency'
                  ? 'bg-rose-600 shadow-[0_24px_60px_rgba(225,29,72,0.3)]'
                  : 'bg-slate-950 shadow-[0_24px_60px_rgba(15,23,42,0.24)]'
              )}
            >
              {createMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <span>{form.category === 'Emergency' ? 'Gửi yêu cầu khẩn cấp' : 'Gửi yêu cầu hỗ trợ'}</span>
                  <Send size={18} strokeWidth={2.6} />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateTicket;
