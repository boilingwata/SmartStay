import React, { useState } from 'react';
import { User } from '@/types';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { toast } from 'sonner';
import { Lock, Mail, Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/utils';

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ open, onOpenChange, user }) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMethod, setResetMethod] = useState<'email' | 'manual'>('email');

  const handleSendEmail = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await userService.sendResetPasswordEmail(user.id);
      await auditService.logAction({
        action: 'Reset Password Email',
        entityType: 'Profiles',
        entityId: user.id,
        details: `Sent reset email to ${user.email}`
      });
      toast.success(`Liên kết đặt lại mật khẩu đã được gửi tới ${user.email}`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Không thể gửi email đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleManualReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    try {
      setLoading(true);
      await userService.resetPassword(user.id, newPassword);
      await auditService.logAction({
        action: 'Manual Password Reset',
        entityType: 'Profiles',
        entityId: user.id,
        details: 'Admin performed manual password reset'
      });
      toast.success('Mật khẩu đã được thay đổi thành công');
      onOpenChange(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)} 
      title="Bảo mật & Mật khẩu"
      className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl"
    >
      <div className="bg-white border-b border-slate-100 p-8 relative overflow-hidden group">
         <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100/50 shadow-sm transition-transform duration-500 group-hover:rotate-12">
               <Lock size={28} />
            </div>
            <div>
               <h2 className="text-xl font-bold text-slate-800 tracking-tight">Thiết lập mật khẩu</h2>
               <p className="text-slate-400 text-[13px] font-medium">Bảo vệ tài khoản và dữ liệu hệ thống.</p>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />
      </div>

      <div className="p-8 space-y-6 bg-white">
        {/* User Card */}
        <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
           <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm">
             {user?.fullName.charAt(0)}
           </div>
           <div className="flex flex-col">
             <span className="text-sm font-bold text-slate-800 tracking-tight leading-tight">{user?.fullName}</span>
             <span className="text-[11px] font-medium text-slate-400">@{user?.username}</span>
           </div>
        </div>

        {/* Method Switcher */}
        <div className="flex p-1 bg-slate-100/80 rounded-xl">
           <button 
             onClick={() => setResetMethod('email')}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
               resetMethod === 'email' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
             )}
           >
              <Mail size={14} /> Gửi Email
           </button>
           <button 
             onClick={() => setResetMethod('manual')}
             className={cn(
               "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
               resetMethod === 'manual' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
             )}
           >
              <Key size={14} /> Đặt thủ công
           </button>
        </div>

        {resetMethod === 'email' ? (
           <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
                 <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={18} />
                 <p className="text-[12px] font-medium text-indigo-700/80 leading-relaxed">
                   Hệ thống sẽ gửi mã xác thực và hướng dẫn đặt lại mật khẩu đến <strong>{user?.email}</strong>.
                 </p>
              </div>
              <Button 
                onClick={handleSendEmail} 
                isLoading={loading} 
                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
              >
                Gửi hướng dẫn ngay
              </Button>
           </div>
        ) : (
           <form onSubmit={handleManualReset} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Mật khẩu mới *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Xác nhận lại *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                 </div>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-500 italic">
                 <ShieldCheck size={14} className="text-emerald-500" />
                 Mật khẩu tối thiểu 8 ký tự, bao gồm chữ và số.
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                   variant="outline" 
                   type="button"
                   onClick={() => onOpenChange(false)}
                   className="flex-1 h-12 rounded-xl border-slate-200 font-bold text-xs text-slate-600 uppercase tracking-wider"
                >
                   Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  isLoading={loading} 
                  className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
                >
                  Xác nhận lưu
                </Button>
              </div>
           </form>
        )}
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;
