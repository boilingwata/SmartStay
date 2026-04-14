import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, ShieldAlert, RefreshCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ password: '', confirm: '' });

  useEffect(() => {
    // Supabase handles the recovery token from the URL hash automatically.
    // We just check if there is an active recovery session.
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      // When a password-reset link is clicked, Supabase sets a recovery session
      if (session) {
        setIsTokenValid(true);
      } else if (!token || token === 'expired') {
        toast.error('Mã xác thực không hợp lệ hoặc đã hết hạn.');
        setIsTokenValid(false);
      } else {
        // token param present but no session yet — treat as valid for flow
        setIsTokenValid(true);
      }
      setIsValidating(false);
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      setIsSuccess(true);
      toast.success('Mật khẩu đã được thay đổi thành công!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Cập nhật mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) return <div className="h-screen flex items-center justify-center bg-bg"><RefreshCcw className="animate-spin text-primary" size={40} /></div>;

  if (!isTokenValid) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg p-6">
        <div className="card-container p-10 max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center text-danger mx-auto">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-h1 text-primary">Liên kết không hợp lệ</h2>
          <p className="text-body text-muted">Liên kết đặt lại mật khẩu của bạn đã hết hạn hoặc không khớp. Vui lòng yêu cầu lại liên kết mới.</p>
          <button onClick={() => navigate('/public/forgot-password')} className="w-full py-4 bg-primary text-white rounded-md font-bold hover:bg-primary-light">Yêu cầu lại link mới</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg p-6">
        <div className="card-container p-10 max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-h1 text-primary">Thành công!</h2>
          <p className="text-body text-muted">Mật khẩu mới của bạn đã được cập nhật. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới này.</p>
          <button onClick={() => navigate('/login')} className="w-full py-4 bg-primary text-white rounded-md font-bold">Quay lại Đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-display text-primary">Đặt lại mật khẩu</h2>
          <p className="text-body text-muted">Vui lòng nhập mật khẩu mới và bảo mật tốt hơn.</p>
        </div>

        <form onSubmit={handleSubmit} className="card-container p-10 bg-white space-y-6">
          <div className="space-y-4">
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
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[1, 2, 3, 4].map(i => <div key={i} className={cn("h-1 rounded-full", form.password.length > i * 2 ? "bg-success" : "bg-bg")}></div>)}
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
            {loading ? <RefreshCcw className="animate-spin" size={20} /> : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
