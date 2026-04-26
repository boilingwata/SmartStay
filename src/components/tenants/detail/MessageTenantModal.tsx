import React from 'react';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';

interface MessageTenantModalProps {
  isOpen: boolean;
  tenantName: string;
  isSending: boolean;
  onClose: () => void;
  onSubmit: (payload: { title: string; message: string }) => Promise<void> | void;
}

export const MessageTenantModal: React.FC<MessageTenantModalProps> = ({
  isOpen,
  tenantName,
  isSending,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    setTitle(`Thông báo từ quản lý`);
    setMessage('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await Promise.resolve(onSubmit({ title: title.trim(), message: message.trim() }));
  };

  const isDisabled = isSending || !title.trim() || !message.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>

        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <MessageSquare size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Gửi tin nhắn nội bộ</h2>
            <p className="text-sm font-medium text-slate-500">
              Tin nhắn sẽ xuất hiện trong trung tâm thông báo của <span className="text-slate-900">{tenantName}</span>.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Tiêu đề</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="input-base h-14 w-full"
              placeholder="Ví dụ: Cập nhật hợp đồng tháng này"
              maxLength={120}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Nội dung</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="input-base min-h-[160px] w-full resize-none py-4"
              placeholder="Nhập nội dung bạn muốn gửi cho cư dân..."
              maxLength={1000}
            />
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
          <button type="button" onClick={onClose} className="btn-outline px-6 py-3">
            Hủy
          </button>
          <button
            type="submit"
            disabled={isDisabled}
            className="btn-primary flex items-center gap-2 px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSending ? 'Đang gửi...' : 'Gửi tin nhắn'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageTenantModal;
