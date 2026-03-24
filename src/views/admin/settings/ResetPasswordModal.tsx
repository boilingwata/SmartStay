import React, { useState } from 'react';
import { User } from '@/types';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { toast } from 'sonner';
import { Lock, Mail, Settings, Key } from 'lucide-react';

interface ResetPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ open, onOpenChange, user }) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendEmail = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await userService.sendResetPasswordEmail(user.id);
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
    
    // Password strength check (simplified)
    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    try {
      setLoading(true);
      await userService.resetPassword(user.id, newPassword);
      toast.success('Mật khẩu đã được thay đổi');
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
      title="Đặt lại mật khẩu"
      className="max-w-md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
           <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
             {user?.fullName.charAt(0)}
           </div>
           <div className="flex flex-col">
             <span className="font-bold text-slate-900">{user?.fullName}</span>
             <span className="text-xs text-slate-500">@{user?.username}</span>
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
             <label className="text-sm font-bold text-slate-700">Lựa chọn đặt lại</label>
             <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleSendEmail} disabled={loading} className="h-auto py-4 flex-col gap-2 rounded-2xl border-indigo-100 hover:bg-indigo-50">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-bold">Gửi email đặt lại</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2 rounded-2xl border-indigo-100 bg-indigo-50 hover:bg-indigo-100 ring-2 ring-indigo-500/20">
                  <Key className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-bold">Đặt thủ công</span>
                </Button>
             </div>
          </div>

          <form onSubmit={handleManualReset} className="space-y-4 pt-2">
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  placeholder="********"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  required
                  placeholder="********"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
             </div>
             
             <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <ul className="text-[10px] text-blue-700 space-y-1 list-disc pl-4">
                   <li>Ít nhất 8 ký tự</li>
                   <li>Ít nhất 1 chữ hoa, 1 số</li>
                   <li>Nên bao gồm ký tự đặc biệt (!@#...)</li>
                </ul>
             </div>

             <Button type="submit" isLoading={loading} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg mt-4">
               Cập nhật mật khẩu mới
             </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;
