import React from 'react';
import { cn } from '@/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return score;
    if (pass.length > 6) score++;
    if (pass.length > 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  
  const getLevels = () => {
    if (strength === 0) return { label: 'Rất yếu', color: 'bg-danger', width: 'w-1/5' };
    if (strength <= 2) return { label: 'Yếu', color: 'bg-warning', width: 'w-2/5' };
    if (strength === 3) return { label: 'Trung bình', color: 'bg-yellow-400', width: 'w-3/5' };
    if (strength === 4) return { label: 'Mạnh', color: 'bg-success', width: 'w-4/5' };
    return { label: 'Rất mạnh', color: 'bg-success', width: 'w-full' };
  };

  const level = getLevels();

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Độ mạnh mật khẩu</span>
        <span className={cn("text-[10px] font-black uppercase tracking-widest", level.color.replace('bg-', 'text-'))}>
          {level.label}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-500 rounded-full", level.color, level.width)} />
      </div>
      <p className="text-[9px] text-muted italic font-medium">
        Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
      </p>
    </div>
  );
};
