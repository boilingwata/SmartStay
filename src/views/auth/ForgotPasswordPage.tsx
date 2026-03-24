import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCcw, Send } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setIsSent(true);
      setLoading(false);
      toast.success('Mã đặt lại mật khẩu đã được gửi!');
    }, 1500);
  };

  if (isSent) {
    return (
      <div className="card-container p-10 text-center space-y-8 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-success mx-auto">
          <Mail size={32} />
        </div>
        <div className="space-y-4">
          <h2 className="text-h1 text-primary">Kiểm tra Email của bạn</h2>
          <p className="text-body text-muted leading-relaxed">
            Chúng tôi đã gửi link đặt lại mật khẩu tới <span className="font-bold text-text">{email}</span>. Vui lòng kiểm tra hộp thư (và cả thư mục Spam).
          </p>
        </div>
        <div className="pt-4 space-y-4">
          <button 
            onClick={() => setIsSent(false)} 
            className="btn-primary w-full bg-primary"
          >
            Quay lại
          </button>
          <p className="text-small text-muted italic">Mã xác thực có hiệu lực trong 30 phút.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-container p-10 bg-white shadow-modal animate-in fade-in slide-in-from-bottom-6 duration-500">
      <header className="mb-10">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-8 text-muted hover:text-primary flex items-center gap-2 text-small font-bold"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <h2 className="text-h1 text-primary">Khôi phục mật khẩu</h2>
        <p className="text-body text-muted mt-2">Nhập email đăng ký tài khoản. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <label className="text-label text-text-secondary block">Địa chỉ Email</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors">
              <Mail size={18} />
            </div>
            <input 
              type="email" 
              required
              autoFocus
              placeholder="example@smartstay.vn"
              className="w-full pl-12 pr-4 py-3.5 border rounded-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full py-4 text-lg bg-primary hover:bg-primary-light flex items-center justify-center gap-3"
        >
          {loading ? <RefreshCcw className="animate-spin" size={20} /> : <>Nhận link đặt lại mật khẩu <Send size={20} /></>}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
