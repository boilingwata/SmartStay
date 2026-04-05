import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertCircle, Home, Zap, Wrench, FileQuestion } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketService, type CreateTicketInput } from '@/services/ticketService';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { TicketPriority, TicketType } from '@/models/Ticket';

type TicketFormState = {
  category: TicketType | '';
  priority: TicketPriority | '';
  title: string;
  description: string;
};

type TicketFormErrors = Partial<Record<'category' | 'priority' | 'title' | 'form', string>>;

type TicketCreateContext = {
  tenantId: number | null;
  roomId: number | null;
  roomCode: string | null;
};

const CATEGORY_OPTIONS: Array<{ id: TicketType; label: string; icon: typeof Wrench }> = [
  { id: 'Maintenance', label: 'Sua chua', icon: Wrench },
  { id: 'Complaint', label: 'Su co', icon: Zap },
  { id: 'ServiceRequest', label: 'Dich vu', icon: Home },
  { id: 'Inquiry', label: 'Hoi dap', icon: FileQuestion },
  { id: 'Emergency', label: 'Khan cap', icon: AlertCircle },
];

const PRIORITY_OPTIONS: TicketPriority[] = ['Low', 'Medium', 'High', 'Critical'];

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  Low: 'Thap',
  Medium: 'Trung binh',
  High: 'Cao',
  Critical: 'Khan cap',
};

function validateForm(values: TicketFormState): TicketFormErrors {
  const nextErrors: TicketFormErrors = {};

  if (!values.category) nextErrors.category = 'Chon phan loai yeu cau.';
  if (!values.priority) nextErrors.priority = 'Chon muc uu tien.';

  const trimmedTitle = values.title.trim();
  if (!trimmedTitle) {
    nextErrors.title = 'Nhap tieu de yeu cau.';
  } else if (trimmedTitle.length < 3) {
    nextErrors.title = 'Tieu de can it nhat 3 ky tu.';
  }

  return nextErrors;
}

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TicketFormState>({
    category: '',
    priority: 'Medium',
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState<TicketFormErrors>({});

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
        throw new Error('Khong tim thay ho so cu dan dang hoat dong.');
      }

      const payload: CreateTicketInput = {
        tenantId,
        roomId: createContext?.roomId ?? null,
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.category,
        priority: form.priority || 'Medium',
        status: 'Open',
        assignedToId: null,
      };

      return ticketService.createTicket(payload);
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['portal-ticket', ticket.id] });
      toast.success('Gui yeu cau thanh cong.');
      navigate('/portal/tickets');
    },
    onError: (error: Error) => {
      setErrors((current) => ({
        ...current,
        form: error.message || 'Khong the tao ticket luc nay. Vui long thu lai.',
      }));
    },
  });

  const canSubmit = useMemo(() => {
    return !contextLoading && !createMutation.isPending && !!createContext?.tenantId;
  }, [contextLoading, createMutation.isPending, createContext?.tenantId]);

  const handleSubmit = () => {
    const nextErrors = validateForm(form);
    if (!createContext?.tenantId) {
      nextErrors.form = 'Khong tim thay ho so cu dan de tao ticket.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    createMutation.mutate();
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white pb-32 animate-in fade-in slide-in-from-right-8 duration-700 font-sans relative">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 active:scale-95 transition-all">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Tao yeu cau moi</h2>
          <div className="w-10 h-10" />
        </div>
      </div>

      <div className="p-6 space-y-8 max-w-[800px] mx-auto w-full">
        <div className="rounded-[28px] border border-slate-100 bg-slate-50/70 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Lien ket cu dan</p>
          <p className="mt-2 text-sm font-bold text-slate-700">
            {contextLoading
              ? 'Dang kiem tra hop dong hien tai...'
              : createContext?.roomCode
              ? `Phong ${createContext.roomCode}`
              : 'Chua tim thay phong dang hoat dong, ticket se duoc gui ma khong gan phong.'}
          </p>
        </div>

        {errors.form && (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {errors.form}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] leading-none">Phan loai <span className="text-rose-500">*</span></h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = form.category === cat.id;
              const isEmergency = cat.id === 'Emergency';

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      category: cat.id,
                      priority: cat.id === 'Emergency' ? 'Critical' : current.priority || 'Medium',
                    }));
                    setErrors((current) => ({ ...current, category: undefined, priority: undefined, form: undefined }));
                  }}
                  className={cn(
                    'px-6 py-3 min-w-fit rounded-[20px] text-xs font-black uppercase tracking-widest transition-all shadow-sm border',
                    isSelected
                      ? isEmergency
                        ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20'
                        : 'bg-teal-600 text-white border-teal-500 shadow-teal-500/20'
                      : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          {errors.category && <p className="px-1 text-[11px] font-bold text-rose-600">{errors.category}</p>}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Uu tien <span className="text-rose-500">*</span></label>
            <select
              value={form.priority}
              onChange={(e) => {
                setForm((current) => ({ ...current, priority: e.target.value as TicketPriority }));
                setErrors((current) => ({ ...current, priority: undefined, form: undefined }));
              }}
              className={cn(
                'w-full h-14 px-6 bg-slate-50 border rounded-[24px] font-black text-sm text-slate-800 focus:bg-white focus:border-teal-500 transition-all outline-none',
                errors.priority ? 'border-rose-300' : 'border-slate-100'
              )}
            >
              <option value="" disabled>Chon muc uu tien</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
              ))}
            </select>
            {errors.priority && <p className="ml-1 text-[11px] font-bold text-rose-600">{errors.priority}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Tieu de yeu cau <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="VD: Voi nuoc bon rua mat bi ro ri..."
              value={form.title}
              onChange={(e) => {
                setForm((current) => ({ ...current, title: e.target.value }));
                setErrors((current) => ({ ...current, title: undefined, form: undefined }));
              }}
              className={cn(
                'w-full h-14 px-6 bg-slate-50 border rounded-[24px] font-black text-sm text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-teal-500 transition-all outline-none',
                errors.title ? 'border-rose-300' : 'border-slate-100'
              )}
            />
            {errors.title && <p className="ml-1 text-[11px] font-bold text-rose-600">{errors.title}</p>}
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[3px] ml-1">Mo ta chi tiet</label>
            <textarea
              placeholder="Cung cap them thong tin chi tiet ve su co hoac yeu cau cua ban..."
              value={form.description}
              onChange={(e) => {
                setForm((current) => ({ ...current, description: e.target.value }));
                setErrors((current) => ({ ...current, form: undefined }));
              }}
              className="w-full min-h-[160px] p-6 bg-slate-50 border border-slate-100 rounded-[32px] font-medium text-[15px] text-slate-700 placeholder:text-slate-300 focus:bg-white focus:border-teal-500 transition-all outline-none resize-none leading-relaxed italic"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full h-16 rounded-[28px] font-black uppercase tracking-[4px] text-xs transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50',
            form.category === 'Emergency' ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-slate-900 text-white shadow-slate-900/20'
          )}
        >
          {createMutation.isPending ? (
            <Spinner size="sm" />
          ) : (
            <>
              {form.category === 'Emergency' ? 'Gui yeu cau khan cap' : 'Gui yeu cau ngay'}
              <Send size={18} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateTicket;
