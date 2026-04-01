import React, { useCallback, useEffect, useState } from 'react';
import { User, UserRoleType } from '@/types';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { buildingService } from '@/services/buildingService';
import { toast } from 'sonner';
import { Shield, User as UserIcon, Mail, Phone, Building2, X } from 'lucide-react';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { ImageUploadCard } from '@/components/shared/ImageUploadCard';

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
  role: 'Staff' as UserRoleType,
  isActive: true,
  isTwoFactorEnabled: false,
  buildingsAccess: [],
  forceChangePassword: true,
});

const UserModal: React.FC<UserModalProps> = ({ open, onOpenChange, user, onSuccess }) => {
  const isEdit = Boolean(user);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(createEmptyForm);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    if (user) {
      setFormData({
        ...createEmptyForm(),
        ...user,
        buildingsAccess: [...(user.buildingsAccess ?? [])],
      });
      return;
    }

    setFormData(createEmptyForm());
  }, [open, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (isEdit) {
        await userService.updateUser(user!.id, formData);
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
      title={isEdit ? 'Sửa người dùng' : 'Thêm người dùng mới'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-indigo-500" /> Họ và tên
            </label>
            <input
              type="text"
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={formData.fullName ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" /> Username
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
              value={formData.username ?? ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''),
              }))}
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-500" /> Email
            </label>
            <input
              type="email"
              required
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={formData.email ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-500" /> Số điện thoại
            </label>
            <input
              type="tel"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={formData.phone ?? ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-500" /> Vai trò
            </label>
            <select
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={formData.role ?? 'Staff'}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRoleType }))}
            >
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Tenant">Tenant</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-500" /> Quản lý tòa nhà
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[56px]">
              {formData.buildingsAccess?.map((buildingId) => (
                <span
                  key={buildingId}
                  className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  Building #{buildingId}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      buildingsAccess: prev.buildingsAccess?.filter(id => id !== buildingId),
                    }))}
                  />
                </span>
              ))}

              <SelectAsync
                placeholder="Thêm..."
                loadOptions={async (search) => {
                  const buildings = await buildingService.getBuildings({ search });
                  return buildings.map((building) => ({
                    label: building.buildingName,
                    value: Number(building.id),
                  }));
                }}
                value=""
                onChange={(value) => {
                  if (!value) return;

                  setFormData(prev => {
                    if (prev.buildingsAccess?.includes(value)) return prev;
                    return {
                      ...prev,
                      buildingsAccess: [...(prev.buildingsAccess || []), value],
                    };
                  });
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700">Force Change Password</h4>
              <p className="text-[10px] text-slate-500 italic">Yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên</p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(formData.forceChangePassword)}
              onChange={(e) => setFormData(prev => ({ ...prev, forceChangePassword: e.target.checked }))}
              className="w-5 h-5 accent-indigo-600 rounded"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-700">Ảnh đại diện</h4>
              <p className="text-[10px] text-slate-500 italic">JPG, PNG hoặc WebP. Tối đa 2MB.</p>
            </div>
            <div className="w-full max-w-[240px]">
              <ImageUploadCard
                value={formData.avatar}
                label="Ảnh đại diện"
                alt="User avatar preview"
                successMessage="Đã tải ảnh đại diện thành công"
                onUploaded={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={handleClose} className="h-11 px-6 rounded-xl font-bold">
            Hủy
          </Button>
          <Button type="submit" isLoading={loading} className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/10">
            {isEdit ? 'Cập nhật' : 'Tạo tài khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
