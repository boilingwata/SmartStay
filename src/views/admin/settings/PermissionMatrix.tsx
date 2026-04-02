import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft,
  Lock,
  RefreshCw,
  Info,
  Layers,
  Settings,
  Activity
} from 'lucide-react';
import { roleService } from '@/services/roleService';
import { Role, Permission, RolePermission } from '@/types';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { cn } from '@/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

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
      setHasChanges(false);
    } catch (error) {
      toast.error('Không thể tải dữ liệu phân quyền');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const togglePermission = (roleId: string, permKey: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) return; // System roles are immutable
    
    setRolePerms(prev => {
      const index = prev.findIndex(rp => rp.roleId === roleId);
      const newRP = [...prev];
      
      if (index !== -1) {
        const perms = [...newRP[index].permissions];
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

  const toggleGroup = (roleId: string, groupKey: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) return;

    const groupPermKeys = groupedPermissions[groupKey].map(p => p.key);
    
    setRolePerms(prev => {
      const index = prev.findIndex(rp => rp.roleId === roleId);
      const newRP = [...prev];
      
      let currentRolePerms: string[] = [];
      if (index !== -1) {
        currentRolePerms = [...newRP[index].permissions];
      }

      const allInGroupSelected = groupPermKeys.every(k => currentRolePerms.includes(k));
      
      let nextRolePerms: string[];
      if (allInGroupSelected) {
        // Deselect all in group
        nextRolePerms = currentRolePerms.filter(k => !groupPermKeys.includes(k));
      } else {
        // Select all in group
        const otherPerms = currentRolePerms.filter(k => !groupPermKeys.includes(k));
        nextRolePerms = [...otherPerms, ...groupPermKeys];
      }

      if (index !== -1) {
        newRP[index] = { ...newRP[index], permissions: nextRolePerms };
      } else {
        newRP.push({ roleId, permissions: nextRolePerms });
      }

      setHasChanges(true);
      return newRP;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Save each modified role
      const updatePromises = rolePerms.map(rp => 
        roleService.updateRolePermissions(rp.roleId, rp.permissions)
      );
      await Promise.all(updatePromises);
      
      toast.success('Đã lưu ma trận quyền thành công!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-pulse">
       <div className="flex justify-between items-center">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <Skeleton className="h-12 w-48 rounded-2xl" />
       </div>
       <Skeleton className="h-[600px] w-full rounded-[40px]" />
    </div>
  );

  // Group permissions by group name
  const groupedPermissions: Record<string, Permission[]> = {};
  permissions.forEach(p => {
    if (!groupedPermissions[p.group]) groupedPermissions[p.group] = [];
    groupedPermissions[p.group].push(p);
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <button 
                onClick={() => window.history.back()} 
                className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm"
               >
                  <ChevronLeft size={24} />
               </button>
               <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-900/20 rotate-3 transition-transform hover:rotate-0">
                  <Shield className="text-white w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ma trận Phân quyền</h1>
                  <p className="text-slate-500 font-medium italic text-sm">Cấu hình chi tiết đặc quyền truy cập cho các vai trò hệ thống.</p>
               </div>
            </div>

            <div className="flex items-center gap-4">
              {hasChanges && (
                <Badge variant="warning" className="px-4 py-2 border-amber-200 bg-amber-50 text-amber-700 animate-pulse rounded-xl flex items-center gap-2">
                   <AlertTriangle size={14} />
                   <span className="text-[11px] font-black uppercase tracking-widest">Có thay đổi chưa lưu</span>
                </Badge>
              )}
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges} 
                isLoading={saving}
                className="h-14 px-10 rounded-[20px] bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
              >
                <Save className="mr-3 h-5 w-5" /> Lưu Cấu Hình
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-6">
        {/* Info Banner */}
        <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <Info className="w-7 h-7" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-tight">Kiểm soát quyền hạt nhân (Granular RBAC)</h3>
                    <p className="text-indigo-100 text-sm font-medium">Bạn đang chỉnh sửa cấu hình quyền trực tiếp. Thay đổi sẽ áp dụng ngay sau khi lưu.</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 flex items-center gap-2">
                    <Layers size={14} className="text-indigo-200" />
                    <span className="text-[11px] font-black uppercase">{roles.length} Roles</span>
                 </div>
                 <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 flex items-center gap-2">
                    <Activity size={14} className="text-indigo-200" />
                    <span className="text-[11px] font-black uppercase">{permissions.length} Perms</span>
                 </div>
              </div>
           </div>
           {/* Abstract shapes */}
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-5 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
           <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-indigo-400 opacity-20 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
        </div>

        {/* Matrix Table */}
        <Card className="rounded-[40px] overflow-hidden border border-slate-200/50 shadow-2xl shadow-slate-900/5 bg-white/80 backdrop-blur-3xl">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/50">
                  <th className="p-8 text-[11px] font-black uppercase tracking-[3px] text-slate-400 sticky left-0 bg-slate-50/80 backdrop-blur-xl z-20 w-[350px] shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                    Quyền hạn / Chức năng
                  </th>
                  {roles.map(role => (
                    <th key={role.id} className="p-8 text-center min-w-[180px] border-l border-slate-100">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-sm font-black text-xs">
                           {role.name[0]}
                        </div>
                        <div className="space-y-1">
                           <span className="text-sm font-black text-slate-900 block tracking-tight uppercase">{role.name}</span>
                           {role.isSystem ? (
                             <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                               <Lock size={8} className="mr-1 inline" /> System Role
                             </Badge>
                           ) : (
                             <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-400 px-2 py-0.5 rounded-full">
                               Customizable
                             </Badge>
                           )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(groupedPermissions).map(([group, groupPerms]) => (
                  <React.Fragment key={group}>
                    <tr className="bg-indigo-50/20">
                      <td 
                        className="px-8 py-4 text-[11px] font-black uppercase tracking-[4px] text-indigo-500 border-y border-indigo-100/30 sticky left-0 bg-indigo-50/80 backdrop-blur-md z-10"
                      >
                        <div className="flex items-center gap-2">
                           <Settings size={14} />
                           {group}
                        </div>
                      </td>
                      {roles.map(role => (
                        <td key={`group-actions-${role.id}-${group}`} className="px-8 py-4 text-center border-y border-indigo-100/30">
                           {!role.isSystem && (
                             <button
                               onClick={() => toggleGroup(role.id, group)}
                               className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-600 transition-colors"
                             >
                               Toggle Group
                             </button>
                           )}
                        </td>
                      ))}
                    </tr>
                    {groupPerms.map(perm => (
                      <tr key={perm.key} className="group hover:bg-slate-50/80 transition-all duration-300">
                        <td className="p-8 sticky left-0 bg-white group-hover:bg-slate-50 z-10 transition-colors shadow-[4px_0_15px_rgba(0,0,0,0.02)] border-r border-slate-50">
                          <div className="space-y-1">
                            <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{perm.name}</span>
                            <p className="text-[11px] font-medium text-slate-400 italic font-mono">{perm.key}</p>
                          </div>
                        </td>
                        {roles.map(role => {
                          const isChecked = rolePerms.find(rp => rp.roleId === role.id)?.permissions.includes(perm.key);
                          const isImmutable = role.isSystem;
                          
                          return (
                            <td key={`${role.id}-${perm.key}`} className="p-8 text-center border-l border-slate-50">
                              <label className={cn(
                                "relative inline-flex items-center justify-center cursor-pointer p-4 rounded-3xl transition-all duration-500",
                                isImmutable ? "cursor-not-allowed opacity-40" : "hover:bg-white hover:shadow-xl hover:shadow-indigo-600/5 group/check"
                                )}
                              >
                                <input 
                                  type="checkbox" 
                                  className="sr-only"
                                  checked={isChecked}
                                  disabled={isImmutable}
                                  onChange={() => togglePermission(role.id, perm.key)}
                                />
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500",
                                  isChecked 
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-600/40 rotate-0 scale-110" 
                                    : "bg-white border-slate-200 text-transparent rotate-[-10deg] scale-90 group-hover/check:border-indigo-300 group-hover/check:rotate-0"
                                )}>
                                  <CheckCircle2 size={24} strokeWidth={3} className={isChecked ? "opacity-100 scale-100" : "opacity-0 scale-50"} />
                                </div>
                                {isChecked && (
                                   <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full scale-150 animate-pulse pointer-events-none" />
                                )}
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
        </Card>
      </div>

      {/* Persistence Note */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
         <div className={cn(
           "px-8 py-4 rounded-full border shadow-2xl transition-all duration-500 flex items-center gap-4 bg-white/90 backdrop-blur-md",
           hasChanges ? "border-amber-400 translate-y-0 opacity-100 scale-100" : "border-slate-200 translate-y-10 opacity-0 scale-95 pointer-events-none"
         )}>
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
               <AlertTriangle size={20} />
            </div>
            <p className="text-sm font-black text-slate-800">Cấu hình đã thay đổi. Đừng quên lưu lại!</p>
            <Button 
              onClick={handleSave} 
              isLoading={saving}
              className="bg-slate-900 text-white h-10 px-6 rounded-full font-black text-xs uppercase tracking-widest hover:bg-black"
            >
              Lưu ngay
            </Button>
         </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;
