import React from 'react';
import { CreditCard, Eye, EyeOff, Pencil, Plus, Save, X } from 'lucide-react';
import { TenantProfile } from '@/models/Tenant';
import { formatDate, maskCCCD } from '@/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ProfileTabProps {
  profile: TenantProfile;
  canViewPII: boolean;
  showSensitive: boolean;
  setShowSensitive: (show: boolean) => void;
  onSaveVehiclePlates: (vehiclePlates: string[]) => Promise<void> | void;
  isSavingVehicles?: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  canViewPII,
  showSensitive,
  setShowSensitive,
  onSaveVehiclePlates,
  isSavingVehicles = false,
}) => {
  const [isEditingVehicles, setIsEditingVehicles] = React.useState(false);
  const [draftPlates, setDraftPlates] = React.useState<string[]>(profile.vehiclePlates);
  const [nextPlate, setNextPlate] = React.useState('');

  React.useEffect(() => {
    if (!isEditingVehicles) {
      setDraftPlates(profile.vehiclePlates);
    }
  }, [profile.vehiclePlates, isEditingVehicles]);

  const addPlate = () => {
    const normalized = nextPlate.trim().toUpperCase();
    if (!normalized || draftPlates.includes(normalized)) return;
    setDraftPlates((current) => [...current, normalized]);
    setNextPlate('');
  };

  const removePlate = (plate: string) => {
    setDraftPlates((current) => current.filter((item) => item !== plate));
  };

  const handleSave = async () => {
    await Promise.resolve(onSaveVehiclePlates(draftPlates));
    setIsEditingVehicles(false);
  };

  const handleCancel = () => {
    setDraftPlates(profile.vehiclePlates);
    setNextPlate('');
    setIsEditingVehicles(false);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-8 lg:col-span-8">
        <div className="card-container bg-white/60 p-8">
          <h3 className="mb-6 text-label font-black uppercase tracking-widest text-muted">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Họ và tên</p>
              <p className="text-body font-bold text-primary">{profile.fullName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Giới tính</p>
              <StatusBadge status="Info" label={profile.gender} className="!bg-primary/5 !py-1 !capitalize !text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Ngày sinh</p>
              <p className="text-body font-bold text-primary">{formatDate(profile.dateOfBirth)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Quốc tịch</p>
              <p className="text-body font-bold text-primary">{profile.nationality}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Nghề nghiệp</p>
              <p className="text-body font-bold text-primary">{profile.occupation || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>

        <div className="card-container bg-white/60 p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-label font-black uppercase tracking-widest text-muted">Định danh (CCCD/Passport)</h3>
            {canViewPII && (
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                className="flex items-center gap-2 text-[11px] font-black uppercase text-primary hover:underline"
              >
                {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />}
                {showSensitive ? 'Ẩn' : 'Xem chi tiết'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Số định danh</p>
              <p className="font-mono text-h2 font-black tracking-tighter text-primary">
                {showSensitive ? profile.cccd : maskCCCD(profile.cccd)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Ngày cấp</p>
              <p className="text-body font-bold text-primary">{formatDate(profile.cccdIssuedDate)}</p>
            </div>
            <div className="col-span-full space-y-1">
              <p className="text-[10px] font-black uppercase tracking-tighter text-muted">Nơi cấp</p>
              <p className="text-body font-bold text-primary">{profile.cccdIssuedPlace || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 lg:col-span-4">
        <div className="card-container relative overflow-hidden bg-slate-900 p-8 text-white">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-label font-black uppercase tracking-widest text-slate-400">Phương tiện</h3>
              {!isEditingVehicles ? (
                <button
                  type="button"
                  onClick={() => setIsEditingVehicles(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-all hover:bg-white/20"
                >
                  <Plus size={14} />
                  Thêm biển số
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {draftPlates.map((plate) => (
                <span
                  key={plate}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white"
                >
                  <span className="font-mono">{plate}</span>
                  {isEditingVehicles ? (
                    <button type="button" onClick={() => removePlate(plate)} className="text-slate-300 transition-colors hover:text-white">
                      <X size={12} />
                    </button>
                  ) : null}
                </span>
              ))}
              {draftPlates.length === 0 ? <span className="italic text-slate-500">Không có phương tiện</span> : null}
            </div>

            {isEditingVehicles ? (
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={nextPlate}
                    onChange={(event) => setNextPlate(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      addPlate();
                    }}
                    className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-bold text-white outline-none placeholder:text-slate-400"
                    placeholder="Ví dụ: 30A-123.45"
                  />
                  <button
                    type="button"
                    onClick={addPlate}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[11px] font-black uppercase tracking-[0.22em] text-slate-900 transition-colors hover:bg-slate-100"
                  >
                    <Plus size={14} />
                    Thêm
                  </button>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={14} />
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSavingVehicles}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingVehicles ? <Pencil size={14} className="animate-pulse" /> : <Save size={14} />}
                    {isSavingVehicles ? 'Đang lưu' : 'Lưu biển số'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <CreditCard size={120} className="absolute -bottom-10 -right-10 rotate-12 text-white/5" />
        </div>

        <div className="card-container border-2 border-dashed border-border/50 bg-transparent p-8">
          <h3 className="mb-4 text-label font-black uppercase tracking-widest text-muted">Ghi chú nội bộ</h3>
          <p className="text-small italic leading-relaxed text-muted">
            {profile.notes || 'Chưa có ghi chú nào cho cư dân này.'}
          </p>
        </div>
      </div>
    </div>
  );
};
