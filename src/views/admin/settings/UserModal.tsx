import React, { useCallback, useEffect, useState } from 'react';
import { User, Role } from '@/types';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { auditService } from '@/services/auditService';
import { toast } from 'sonner';
import {
  Shield,
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Building2,
  X,
  CheckCircle2,
  UserPlus,
  Fingerprint,
  Calendar,
  MapPin,
  UserCircle2,
  ChevronDown
} from 'lucide-react';
import { ImageUploadCard } from '@/components/shared/ImageUploadCard';
import { cn } from '@/utils';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

const createEmptyForm = (): Partial<User> => ({
  fullName: '',
  username: '',
  email: '',
  phone: '',
  roleId: '',
  identityNumber: '',
  dateOfBirth: '',
  gender: 'male',
  address: '',
  isActive: true,
  isTwoFactorEnabled: false,
  buildingsAccess: [],
  forceChangePassword: true,
});

const UserModal: React.FC<UserModalProps> = ({ open, onOpenChange, user, onSuccess }) => {
  const isEdit = Boolean(user);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<Partial<User>>(createEmptyForm);
  const [autoUsername, setAutoUsername] = useState(true);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const generateUsername = (name: string) => {
    if (!name) return '';
    const parts = name.trim().toLowerCase().split(' ');
    const last = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0]).join('');
    return `${last}${initials ? '.' + initials : ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  useEffect(() => {
    roleService.getRoles().then(data => {
      setRoles(data);
      if (!isEdit && data.length > 0) {
        const defaultRole = data.find(r => r.name === 'Staff') || data[0];
        setFormData(prev => ({ ...prev, roleId: defaultRole.id }));
      }
    }).catch(err => console.error('Failed to fetch roles', err));
  }, []);

  useEffect(() => {
    if (!open) return;

    if (user) {
      setFormData({
        ...createEmptyForm(),
        ...user,
        buildingsAccess: [...(user.buildingsAccess ?? [])],
        roleId: user.roleId || roles.find(r => r.name === user.role)?.id || '',
      });
    } else {
      setFormData({
        ...createEmptyForm(),
        roleId: roles.find(r => r.name === 'Staff')?.id || roles[0]?.id || '',
      });
    }
  }, [open, user?.id, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (isEdit) {
        await userService.updateUser(user!.id, formData);
        await auditService.logAction({
          action: 'Cập nhật người dùng',
          entityType: 'Profiles',
          entityId: user!.id,
          newValues: formData
        });
        toast.success('Đã cập nhật thông tin người dùng');
      } else {
        await userService.createUser(formData as Omit<User, 'id'>);
        toast.success('Đã tạo tài khoản người dùng mới');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
      className="max-w-3xl rounded-[32px] p-0 overflow-hidden border-none shadow-2xl"
    >
      <div className="bg-white border-b border-slate-100 p-8 relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100/50 shadow-sm transition-transform duration-500 group-hover:scale-110">
            {isEdit ? <UserCircle2 size={28} /> : <UserPlus size={28} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{isEdit ? 'Hồ sơ người dùng' : 'Tạo tài khoản mới'}</h2>
            <p className="text-slate-400 text-[13px] font-medium">Cung cấp thông tin chính xác để quản lý hệ thống tốt hơn.</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white">
        <div className="max-h-[70vh] overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">

          {/* Section 1: Account Settings */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Lock size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Thông tin tài khoản</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
                  Email công việc <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    disabled={isEdit}
                    placeholder="email@work.com"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                    value={formData.email ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
                  Tên đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isEdit}
                    placeholder="Ten.DangNhap"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                    value={formData.username ?? ''}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, username: e.target.value }));
                      setAutoUsername(false);
                    }}
                  />
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
                  Quyền hạn hệ thống <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    className="w-full h-12 pl-11 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 appearance-none bg-white"
                    value={formData.roleId ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                  >
                    <option value="">Lựa chọn...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="flex gap-4 items-end pb-1">
                <div className="flex-1 p-3.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between group/toggle">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
                      <Lock size={14} />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Xác thực 2 lớp</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer scale-90">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.isTwoFactorEnabled ?? false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isTwoFactorEnabled: e.target.checked }))}
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Personal Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Fingerprint size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Định danh cá nhân</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800"
                    value={formData.fullName ?? ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        fullName: name,
                        username: !isEdit && autoUsername ? generateUsername(name) : prev.username
                      }));
                    }}
                  />
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="09xx xxx xxx"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800"
                    value={formData.phone ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1 flex items-center gap-2">
                  Số CCCD / CMND
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="Căn cước công dân 12 số"
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 tracking-[1px]"
                    value={formData.identityNumber ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, identityNumber: e.target.value.replace(/\D/g, '') }))}
                  />
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Ngày sinh</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800"
                      value={formData.dateOfBirth ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Giới tính</label>
                  <select
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800 appearance-none bg-white"
                    value={formData.gender ?? 'male'}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Address */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <MapPin size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Địa chỉ & Liên hệ</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                Địa chỉ thường trú (Theo CCCD)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Xã/Phường, Quận/Huyện, Tỉnh/Thành phố"
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-sm font-semibold text-slate-800"
                  value={formData.address ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
          </div>

          {/* Section 4: Buildings Access */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Building2 size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Tòa nhà quản lý</h3>
            </div>

            <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[56px]">
              {(formData.buildingsAccess ?? []).length === 0 && (
                <span className="text-[12px] text-slate-400 italic">Chưa có tòa nhà nào được gán</span>
              )}
              {(formData.buildingsAccess ?? []).map((buildingId) => (
                <span
                  key={buildingId}
                  className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  Tòa #{buildingId}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      buildingsAccess: prev.buildingsAccess?.filter(id => id !== buildingId),
                    }))}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Section 5: Avatar */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <UserCircle2 size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Ảnh đại diện</h3>
            </div>
            <ImageUploadCard
              value={formData.avatar}
              label="Ảnh đại diện"
              alt="Xem trước ảnh đại diện người dùng"
              successMessage="Đã tải ảnh đại diện thành công"
              onUploaded={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'px-3 py-1.5 rounded-lg flex items-center gap-2',
              formData.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            )}>
              <CheckCircle2 size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{formData.isActive ? 'Đang kích hoạt' : 'Đang tạm khóa'}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-90">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>

            {!isEdit && (
              <label className="flex items-center gap-2 cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={Boolean(formData.forceChangePassword)}
                  onChange={(e) => setFormData(prev => ({ ...prev, forceChangePassword: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">Đổi mật khẩu lần đầu</span>
              </label>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="h-11 px-6 rounded-xl font-bold text-xs text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Đóng
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {isEdit ? 'Lưu hồ sơ' : 'Tạo tài khoản'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
