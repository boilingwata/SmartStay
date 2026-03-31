import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, ShieldAlert, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ current: '', password: '', confirm: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Mật khẩu xác nhận không khớp');
    if (form.current === form.password) return toast.error('Mật khẩu mới phải khác mật khẩu cũ');
    
    setLoading(true);
    // Logic to clear ForceChangePassword flag
    toast.success('Đã cập nhật mật khẩu mới. Chào mừng trở lại!');
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-display text-primary leading-tight font-bold">Yêu cầu đổi mật khẩu</h2>
          <p className="text-body text-muted px-4">Chào {user?.fullName || 'bạn'}, vì lý do bảo mật, bạn cần đổi mật khẩu ngay trong lần đăng nhập đầu tiên.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-container p-10 bg-white space-y-6 shadow-modal">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-label text-muted">Mật khẩu hiện tại (được cấp)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 border rounded-md outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  value={form.current}
                  onChange={e => setForm({...form, current: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label text-muted">Mật khẩu mới</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary" size={18} />
                <input 
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border rounded-md outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label text-muted">Xác nhận mật khẩu mới</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary" size={18} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 border rounded-md outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.confirm}
                  onChange={e => setForm({...form, confirm: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-md font-bold hover:bg-primary-light transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCcw className="animate-spin" size={20} /> : "Kích hoạt mật khẩu mới"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
