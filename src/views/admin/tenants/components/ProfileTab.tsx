import React from 'react';
import { Eye, EyeOff, CreditCard } from 'lucide-react';
import { TenantProfile } from '@/models/Tenant';
import { formatDate, maskCCCD } from '@/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ProfileTabProps {
  profile: TenantProfile;
  canViewPII: boolean;
  showSensitive: boolean;
  setShowSensitive: (show: boolean) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ 
  profile, 
  canViewPII, 
  showSensitive, 
  setShowSensitive 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4 duration-500">
      <div className="lg:col-span-8 space-y-8">
        <div className="card-container p-8 bg-white/60">
          <h3 className="text-label text-muted font-black uppercase tracking-widest mb-6">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Họ và tên</p>
              <p className="text-body font-bold text-primary">{profile.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Giới tính</p>
              <StatusBadge status="Info" label={profile.gender} className="!capitalize !bg-primary/5 !text-primary !py-1" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Ngày sinh</p>
              <p className="text-body font-bold text-primary">{formatDate(profile.dateOfBirth)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Quốc tịch</p>
              <p className="text-body font-bold text-primary flex items-center gap-2">🇻🇳 {profile.nationality}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Nghề nghiệp</p>
              <p className="text-body font-bold text-primary">{profile.occupation}</p>
            </div>
          </div>
        </div>

        <div className="card-container p-8 bg-white/60">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-label text-muted font-black uppercase tracking-widest">Định danh (CCCD/Passport)</h3>
            {canViewPII && (
              <button 
                onClick={() => setShowSensitive(!showSensitive)}
                className="text-primary hover:underline text-[11px] font-black uppercase flex items-center gap-2"
              >
                {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />} {showSensitive ? 'Ẩn' : 'Xem chi tiết'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Số định danh</p>
              <p className="text-h2 font-black text-primary font-mono tracking-tighter">
                {showSensitive ? profile.cccd : maskCCCD(profile.cccd)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Ngày cấp</p>
              <p className="text-body font-bold text-primary">{formatDate(profile.cccdIssuedDate)}</p>
            </div>
            <div className="col-span-full space-y-1">
              <p className="text-[10px] text-muted font-black uppercase tracking-tighter">Nơi cấp</p>
              <p className="text-body font-bold text-primary">{profile.cccdIssuedPlace}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <div className="card-container p-8 bg-slate-900 text-white overflow-hidden relative">
          <div className="relative z-10 space-y-6">
            <h3 className="text-label text-slate-500 font-black uppercase tracking-widest">Phương tiện vận chuyển</h3>
            <div className="flex flex-wrap gap-2">
              {profile.vehiclePlates.map((plate, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-white/10 text-white text-[12px] font-mono font-bold rounded-lg border border-white/20">
                  {plate}
                </span>
              ))}
              {profile.vehiclePlates.length === 0 && <span className="text-slate-500 italic">Không có phương tiện</span>}
            </div>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10">
              + Thêm biển số
            </button>
          </div>
          <CreditCard size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
        </div>

        <div className="card-container p-8 border-dashed border-2 border-border/50 bg-transparent">
          <h3 className="text-label text-muted font-black uppercase tracking-widest mb-4">Ghi chú nội bộ</h3>
          <p className="text-small text-muted italic leading-relaxed">
            {profile.notes || 'Chưa có ghi chú nào cho cư dân này.'}
          </p>
        </div>
      </div>
    </div>
  );
};
