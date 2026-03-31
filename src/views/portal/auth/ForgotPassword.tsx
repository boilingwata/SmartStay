import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordStrengthMeter } from '@/components/shared';
import { cn } from '@/utils';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // In production: await authService.sendResetOtp(identifier);
    setLoading(false);
    setStep(2);
    setTimer(30);
    toast.success('Mã OTP đã được gửi!');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && index === 5) handleOtpVerify(newOtp.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every(char => /^\d$/.test(char))) {
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      otpRefs.current[Math.min(pastedData.length, 5)]?.focus();
      
      if (newOtp.every(digit => digit !== '')) {
        handleOtpVerify(newOtp.join(''));
      }
    }
  };

  const handleOtpVerify = async (code: string) => {
    setLoading(true);
    // In production: await authService.verifyResetOtp(identifier, code);
    setLoading(false);
    if (code === '123456') {
      setStep(3);
    } else {
      toast.error('Mã không đúng. Vui lòng thử lại.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Mật khẩu không khớp!');
      return;
    }
    setLoading(true);
    // In production: await authService.resetPassword(identifier, password);
    setLoading(false);
    setStep(4);
    // Navigation should be user-triggered or a very short auto-redirect
    setTimeout(() => navigate('/portal/login'), 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleIdentifierSubmit} className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-[80px] h-[80px] bg-[#0D8A8A]/10 rounded-2xl flex items-center justify-center">
                <Mail size={40} className="text-[#0D8A8A]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Quên mật khẩu?</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Nhập Số điện thoại hoặc Email để nhận mã thiết lập lại mật khẩu
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                placeholder="Số điện thoại hoặc Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0D8A8A] focus:ring-2 focus:ring-[#0D8A8A]/20 outline-none transition-all text-[16px] placeholder:text-slate-400"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !identifier} 
              className="w-full h-[48px] bg-[#0D8A8A] text-white rounded-xl font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-[#0A6B6B] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Tiếp tục <ArrowRight size={20} /></>}
            </button>
          </form>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-[80px] h-[80px] bg-[#0D8A8A]/10 rounded-2xl flex items-center justify-center">
                <KeyRound size={40} className="text-[#0D8A8A]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Xác thực OTP</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Nhập mã 6 chữ số vừa gửi đến <br/><span className="font-semibold text-slate-700">{identifier}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className={cn(
                    "w-12 h-14 text-center text-xl font-bold rounded-xl border focus:outline-none focus:ring-2 transition-all",
                    digit ? "border-[#0D8A8A] ring-[#0D8A8A]/20 bg-[#0D8A8A]/5" : "border-slate-200 bg-slate-50",
                    "text-slate-800 focus:border-[#0D8A8A]"
                  )}
                  autoFocus={i === 0}
                  readOnly={loading}
                />
              ))}
            </div>

            <div className="text-center">
               {timer > 0 ? (
                 <p className="text-sm text-slate-500">Mã hết hạn sau <span className="font-semibold text-[#0D8A8A]">{timer}s</span></p>
               ) : (
                 <button onClick={() => { setTimer(30); toast.success('Đã gửi lại mã'); }} className="text-sm font-semibold text-[#0D8A8A] hover:underline">
                    Gửi lại mã mới
                 </button>
               )}
            </div>
          </div>
        );
      case 3:
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-[80px] h-[80px] bg-[#0D8A8A]/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={40} className="text-[#0D8A8A]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Mật khẩu mới</h2>
                <p className="text-sm text-slate-500 mt-1">Thiết lập mật khẩu an toàn (tối thiểu 8 ký tự)</p>
              </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                 <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0D8A8A] focus:ring-2 focus:ring-[#0D8A8A]/20 outline-none transition-all text-[16px] placeholder:text-slate-400"
                  placeholder="Mật khẩu mới"
                  required
                 />
                 {password && <PasswordStrengthMeter password={password} />}
               </div>
               <div className="space-y-2">
                 <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0D8A8A] focus:ring-2 focus:ring-[#0D8A8A]/20 outline-none transition-all text-[16px] placeholder:text-slate-400"
                  placeholder="Xác nhận mật khẩu"
                  required
                 />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || password.length < 8 || password !== confirmPassword} 
              className="w-full h-[48px] bg-[#0D8A8A] text-white rounded-xl font-bold text-[16px] flex items-center justify-center hover:bg-[#0A6B6B] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
               {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Đổi mật khẩu'}
            </button>
          </form>
        );
      case 4:
        return (
          <div className="py-8 text-center space-y-6">
            <div className="w-[80px] h-[80px] bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Thành công!</h2>
              <p className="text-sm text-slate-500 mt-2">Mật khẩu của bạn đã được thay đổi. <br/>Tự động chuyển trang sau 3s...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0D8A8A] to-[#1B3A6B] p-4 text-[#1E293B]">
      <div className="max-w-[390px] w-full bg-white rounded-2xl shadow-2xl p-8 relative">
        {step < 4 && (
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="pt-6">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
