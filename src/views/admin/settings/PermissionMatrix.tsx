import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';
import { roleService } from '@/services/roleService';
import { Role } from '@/models/Role';
import { Permission, RolePermission } from '@/models/Permission';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';

const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allRoles, allPerms, currentRP] = await Promise.all([
        roleService.getRoles(),
        roleService.getAllPermissions(),
        roleService.getRolePermissions()
      ]);
      setRoles(allRoles);
      setPermissions(allPerms);
      setRolePerms(currentRP);
    } catch (error) {
      toast.error('Không thể tải dữ liệu phân quyền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePermission = (roleId: string, permKey: string) => {
    if (roleId === 'Admin') return; // Admin is locked
    
    setRolePerms(prev => {
      const index = prev.findIndex(rp => rp.roleId === roleId);
      const newRP = [...prev];
      
      if (index !== -1) {
        const perms = newRP[index].permissions;
        if (perms.includes(permKey)) {
          newRP[index] = { ...newRP[index], permissions: perms.filter(p => p !== permKey) };
        } else {
          newRP[index] = { ...newRP[index], permissions: [...perms, permKey] };
        }
      } else {
        newRP.push({ roleId, permissions: [permKey] });
      }
      
      setHasChanges(true);
      return newRP;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulate saving for each role
      await Promise.all(rolePerms.map(rp => roleService.updateRolePermissions(rp.roleId, rp.permissions)));
      toast.success('Đã lưu thay đổi phân quyền');
      setHasChanges(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Spinner />
      <p className="text-slate-400 font-bold uppercase tracking-[3px] text-xs">Loading Matrix...</p>
    </div>
  );

  // Group permissions by group name
  const groupedPermissions: Record<string, Permission[]> = {};
  permissions.forEach(p => {
    if (!groupedPermissions[p.group]) groupedPermissions[p.group] = [];
    groupedPermissions[p.group].push(p);
  });

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => window.history.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
              <ChevronLeft size={24} />
           </button>
           <div className="p-3 bg-slate-900 text-white rounded-[20px] shadow-xl">
              <Shield size={28} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Ma trận Phân quyền</h1>
              <p className="text-slate-500 text-sm font-medium">Thiết lập chi tiết quyền hạn cho từng vai trò trong hệ thống.</p>
           </div>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 animate-pulse">
               <AlertTriangle size={16} />
               <span className="text-xs font-bold">Có thay đổi chưa lưu</span>
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges} 
            isLoading={saving}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 px-8"
          >
            <Save className="mr-2 h-4 w-4" /> Lưu ma trận
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-900/5 border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-6 text-xs font-black uppercase tracking-[2px] text-slate-400 sticky left-0 bg-slate-50 z-10 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  Quyền / Chức năng
                </th>
                {roles.map(role => (
                  <th key={role.id} className="p-6 text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-black text-slate-800">{role.name}</span>
                      {role.id === 'Admin' && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock size={10} /> Read Only
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(groupedPermissions).map(([group, groupPerms]) => (
                <React.Fragment key={group}>
                  <tr className="bg-slate-50/50">
                    <td 
                      colSpan={roles.length + 1} 
                      className="px-6 py-3 text-[11px] font-black uppercase tracking-[3px] text-indigo-600 border-y border-slate-200"
                    >
                      {group}
                    </td>
                  </tr>
                  {groupPerms.map(perm => (
                    <tr key={perm.key} className="group hover:bg-slate-50 transition-colors">
                      <td className="p-6 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{perm.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 italic">{perm.key}</span>
                        </div>
                      </td>
                      {roles.map(role => {
                        const isChecked = rolePerms.find(rp => rp.roleId === role.id)?.permissions.includes(perm.key);
                        const isAdmin = role.id === 'Admin';
                        return (
                          <td key={`${role.id}-${perm.key}`} className="p-6 text-center">
                            <label className={cn(
                              "relative inline-flex items-center justify-center cursor-pointer p-2 rounded-xl transition-all",
                              isAdmin ? "cursor-not-allowed opacity-50" : "hover:bg-indigo-50"
                            )}>
                              <input 
                                type="checkbox" 
                                className="sr-only"
                                checked={isChecked}
                                disabled={isAdmin}
                                onChange={() => togglePermission(role.id, perm.key)}
                              />
                              <div className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                isChecked 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110" 
                                  : "bg-white border-slate-200 text-transparent"
                              )}>
                                <CheckCircle2 size={16} strokeWidth={3} />
                              </div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-center pb-10">
         <div className="bg-slate-50 px-6 py-4 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4 max-w-2xl">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
               <AlertTriangle size={20} />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              <strong className="text-slate-800">Lưu ý:</strong> Thay đổi quyền hạn sẽ có tác dụng ngay lập tức cho tất cả người dùng thuộc vai trò này. Hãy cẩn trọng khi chỉnh sửa các quyền liên quan đến <span className="text-red-500 font-bold uppercase tracking-wider text-[9px]">Xóa dữ liệu</span> hoặc <span className="text-indigo-500 font-bold uppercase tracking-wider text-[9px]">Cấu hình hệ thống</span>.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;
