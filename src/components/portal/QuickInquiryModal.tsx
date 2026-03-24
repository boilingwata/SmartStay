import React, { useState } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/utils';
import { publicListingsService } from '@/services/publicListingsService';

interface QuickInquiryModalProps {
  listingId: string;
  roomCode: string;
  onClose: () => void;
}

const QuickInquiryModal: React.FC<QuickInquiryModalProps> = ({ listingId, roomCode, onClose }) => {
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const mutation = useMutation({
    mutationFn: () => publicListingsService.submitInquiry(listingId, form),
    onSuccess: () => {
      toast.success('Câu hỏi của bạn đã được gửi! Chúng tôi sẽ liên hệ sớm nhất.');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể gửi. Vui lòng thử lại.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) return;
    mutation.mutate();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0D8A8A]/10 flex items-center justify-center">
              <MessageSquare size={15} className="text-[#0D8A8A]" />
            </div>
            <div>
              <p className="font-black text-[13px] text-slate-800">Đặt câu hỏi</p>
              <p className="text-[10px] text-slate-400 font-medium">Phòng {roomCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-[12px] text-slate-500 leading-relaxed">
            Không cần đăng ký tài khoản. Chúng tôi sẽ liên hệ lại với bạn qua số điện thoại.
          </p>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Họ và tên</label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D8A8A]/20 focus:border-[#0D8A8A] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
            <input
              type="tel"
              required
              placeholder="098 xxx xxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D8A8A]/20 focus:border-[#0D8A8A] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Câu hỏi của bạn</label>
            <textarea
              required
              rows={3}
              placeholder="Phòng này còn trống không? Có thể xem trực tiếp vào cuối tuần không?"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D8A8A]/20 focus:border-[#0D8A8A] transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !form.name.trim() || !form.phone.trim() || !form.message.trim()}
              className={cn(
                'flex-1 h-11 rounded-xl text-[13px] font-black text-white transition-all flex items-center justify-center gap-2',
                'bg-[#0D8A8A] hover:bg-[#0A6B6B] active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {mutation.isPending ? (
                <><Loader2 size={14} className="animate-spin" /><span>Đang gửi...</span></>
              ) : (
                'Gửi câu hỏi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickInquiryModal;
