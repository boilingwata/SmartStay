import React, { useState, useEffect } from 'react';
import { User, UserRoleType } from '@/types';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { buildingService } from '@/services/buildingService';
import { toast } from 'sonner';
import { Shield, User as UserIcon, Mail, Phone, Lock, Building2, X } from 'lucide-react';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { FileUpload } from '@/components/shared/FileUpload';

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ open, onOpenChange, user, onSuccess }) => {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
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

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        role: 'Staff',
        isActive: true,
        isTwoFactorEnabled: false,
        buildingsAccess: [],
        forceChangePassword: true,
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEdit) {
        await userService.updateUser(user!.id, formData);
        toast.success('Đã cập nhật thông tin người dùng');
      } else {
        await userService.createUser(formData as Omit<User, 'id'>);
        toast.success('Đã tạo người dùng mới. Mật khẩu mặc định đã được gửi tới email.');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)} 
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
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-500" /> Số điện thoại
            </label>
            <input
              type="tel"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRoleType })}
            >
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
              <option value="Tenant">Tenant</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div className="space-y-2">
               <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                 <Building2 className="h-4 w-4 text-indigo-500" /> Quản lý tòa nhà
               </label>
               <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[56px]">
                  {formData.buildingsAccess?.map(bid => (
                    <span key={bid} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      Building #{bid}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => setFormData({...formData, buildingsAccess: formData.buildingsAccess?.filter(id => id !== bid)})} />
                    </span>
                  ))}
                  <SelectAsync
                    placeholder="Thêm..."
                    loadOptions={async (search) => {
                      const buildings = await buildingService.getBuildings({ search });
                      return buildings.map(b => ({ label: b.buildingName, value: Number(b.id) }));
                    }}
                    value=""
                    onChange={(val) => {
                      if (val && !formData.buildingsAccess?.includes(val)) {
                        setFormData({ ...formData, buildingsAccess: [...(formData.buildingsAccess || []), val] });
                      }
                    }}
                  />
               </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
             <div className="flex-1">
               <h4 className="text-sm font-bold text-slate-700">Force Change Password</h4>
               <p className="text-[10px] text-slate-500 italic">Yêu cầu đổi mật khẩu lần đầu</p>
             </div>
             <input 
               type="checkbox" 
               checked={formData.forceChangePassword}
               onChange={(e) => setFormData({...formData, forceChangePassword: e.target.checked})}
               className="w-5 h-5 accent-indigo-600 rounded"
             />
           </div>
           <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
             <div className="flex-1">
               <h4 className="text-sm font-bold text-slate-700">Avatar</h4>
               <p className="text-[10px] text-slate-500 italic">Max 2MB</p>
             </div>
             <FileUpload 
               onUpload={(urls) => setFormData({...formData, avatar: urls[0]})}
               maxSizeMB={2}
               accept="image/*"
             />
           </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6 rounded-xl font-bold">Hủy</Button>
          <Button type="submit" isLoading={loading} className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/10">
            {isEdit ? 'Cập nhật' : 'Tạo tài khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
