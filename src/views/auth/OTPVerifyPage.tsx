import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, RefreshCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthenticatedHomePath } from '@/lib/authRouting';
import useAuthStore from '@/stores/authStore';

const OTPVerifyPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputs = useRef<HTMLInputElement[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => setCountdown(countdown - 1), 1000);
    return () => { if (timer) clearInterval(timer); };
  }, [countdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance
    if (index < 5 && newOtp[index]) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (!data) return;

    const newOtp = [...otp];
    data.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    inputs.current[Math.min(data.length, 5)].focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('').length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã xác thực 6 chữ số.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      toast.success('Xác thực thành công!');
      navigate(getAuthenticatedHomePath(useAuthStore.getState().user));
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#E0F2FE] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in zoom-in duration-300">
        <div className="card-container p-10 bg-white shadow-modal border-none">
          <button 
            onClick={() => navigate(-1)} 
            className="mb-8 text-muted hover:text-primary flex items-center gap-2 text-small font-bold"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>

          <header className="text-center mb-10 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
              <Smartphone size={32} />
            </div>
            <h1 className="text-h1 text-primary">Xác thực OTP</h1>
            <p className="text-body text-muted leading-relaxed">
              Nhập mã 6 chữ số đã được gửi về số điện thoại <br /> 
              <span className="text-text font-bold">*******889</span>
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputs.current[i] = el!}
                  type="text"
                  maxLength={1}
                  className="w-12 h-16 border-2 rounded-xl text-center text-2xl font-bold text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  value={digit}
                  onChange={e => handleChange(e, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                />
              ))}
            </div>

            <div className="space-y-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary w-full py-4 text-lg bg-primary hover:bg-primary-light flex items-center justify-center gap-3"
              >
                {isSubmitting ? <RefreshCcw className="animate-spin" size={20} /> : <>Xác thực ngay <ArrowRight size={20} /></>}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-small text-muted">
                    Gửi lại mã sau <span className="text-primary font-bold">{countdown}s</span>
                  </p>
                ) : (
                  <button 
                    type="button" 
                    className="text-small font-bold text-secondary hover:underline flex items-center gap-1 mx-auto"
                    onClick={() => setCountdown(60)}
                  >
                    <RefreshCcw size={14} /> Gửi lại mã OTP
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerifyPage;
