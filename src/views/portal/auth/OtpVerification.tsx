import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { getAuthenticatedHomePath } from '@/lib/authRouting';
import useAuthStore from '@/stores/authStore';

const OtpVerification: React.FC = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    setIsError(false);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if complete
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
      
      if (newOtp.every(digit => digit !== '')) {
        handleVerify(newOtp.join(''));
      }
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (code === '123456') {
        toast.success('Xác thực thành công!');
        navigate(getAuthenticatedHomePath(useAuthStore.getState().user));
      } else {
        setIsError(true);
        toast.error('Mã không đúng');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    toast.success('Đã gửi lại mã xác thực mới.');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#0D8A8A] to-[#1B3A6B] p-4">
      <div className={cn(
        "max-w-[390px] w-full bg-white rounded-2xl shadow-2xl p-8 relative",
        isError && "animate-shake ring-2 ring-red-500"
      )}>
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex flex-col items-center mb-8 pt-6 text-center">
          <div className="w-[80px] h-[80px] bg-[#0D8A8A]/10 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound size={40} className="text-[#0D8A8A]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Nhập mã xác thực</h2>
          <p className="text-sm text-slate-500 mt-2">
            Mã 6 chữ số đã được gửi đến SĐT <span className="font-semibold">****5678</span>
          </p>
        </div>

        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                "w-12 h-14 text-center text-xl font-bold rounded-xl border focus:outline-none focus:ring-2 transition-all",
                digit ? "border-[#0D8A8A] ring-[#0D8A8A]/20 bg-[#0D8A8A]/5" : "border-slate-200 bg-slate-50",
                isError ? "border-red-500 text-red-500 focus:ring-red-500/20" : "text-slate-800 focus:border-[#0D8A8A]"
              )}
              autoFocus={i === 0}
              readOnly={loading}
            />
          ))}
        </div>

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-sm text-slate-500">
              Mã hết hạn sau <span className="font-semibold text-[#0D8A8A]">{timer}s</span>
            </p>
          ) : (
            <button 
              onClick={handleResend}
              className="text-sm font-semibold text-[#0D8A8A] hover:underline"
              disabled={loading}
            >
              Gửi lại mã
            </button>
          )}
        </div>

        <button 
          onClick={() => handleVerify(otp.join(''))}
          disabled={loading || otp.some(d => !d)}
          className="w-full h-[48px] mt-6 bg-[#0D8A8A] text-white rounded-xl font-bold text-[16px] flex items-center justify-center hover:bg-[#0A6B6B] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Xác nhận'
          )}
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default OtpVerification;
