import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Lock,
  UserX,
  History,
  Layers,
  ChevronRight,
  Phone,
  Fingerprint,
  Activity,
  UserCheck,
} from 'lucide-react';
import { DataTable, RowAction } from '@/components/shared/DataTable';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { User } from '@/types';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { cn } from '@/utils';
import UserModal from './UserModal';
import ResetPasswordModal from './ResetPasswordModal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    isActive: 'true'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUsers(filterValues);
      setUsers(userData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterValues]);

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user.id);
      await auditService.logAction({
        action: 'Toggle Status',
        entityType: 'Profiles',
        entityId: user.id,
        newValues: { isActive: !user.isActive }
      });
      fetchData();
      toast.success(`Đã ${user.isActive ? 'khóa' : 'mở'} tài khoản ${user.fullName}`);
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const columns: ColumnDef<User, any>[] = [
    {
      header: 'NGƯỜI DÙNG',
      accessorKey: 'fullName',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-4 py-2">
            <div className="relative group/avatar">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-100 shadow-sm transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:rotate-3 overflow-hidden text-lg">
                 {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.fullName.charAt(0)}
              </div>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100",
                user.isActive ? "bg-emerald-500" : "bg-rose-500"
              )} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-bold text-slate-800 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                {user.fullName}
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide lowercase">
                 @{user.username}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'LIÊN HỆ',
      accessorKey: 'email',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 text-[13px] font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                   <Mail size={12} />
                </div>
                {user.email || '—'}
             </div>
             {user.phone && (
               <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                  <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                     <Phone size={10} />
                  </div>
                  {user.phone}
               </div>
             )}
          </div>
        );
      },
    },
    {
      header: 'VAI TRÒ',
      accessorKey: 'role',
      cell: ({ getValue }) => {
        const roleName = String(getValue());
        const roleLower = roleName.toLowerCase();
        
        const config = {
          admin: { bg: 'bg-indigo-50/80', text: 'text-indigo-700', border: 'border-indigo-100', label: 'Quản trị viên' },
          staff: { bg: 'bg-slate-50/80', text: 'text-slate-600', border: 'border-slate-200', label: 'Nhân viên' },
          tenant: { bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Cư dân' },
        }[roleLower] || { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-100', label: roleName };
        
        return (
          <Badge className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-none",
            config.bg, config.text, config.border
          )}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'NGÀY THAM GIA',
      accessorKey: 'createdAt',
      cell: ({ row }) => {
        const dateStr = row.original.createdAt;
        if (!dateStr) return <span className="text-slate-300 italic text-[11px]">Chưa cập nhật</span>;
        
        const date = new Date(dateStr);
        return (
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-slate-700">
              {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
              {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
  ];

  const rowActions: RowAction<User>[] = [
    {
      label: 'Chỉnh sửa hồ sơ',
      icon: <Users className="w-4 h-4" />,
      onClick: (user) => { setSelectedUser(user); setIsModalOpen(true); }
    },
    {
      label: 'Cài đặt mật khẩu',
      icon: <Lock className="w-4 h-4" />,
      onClick: (user) => { setSelectedUser(user); setIsResetModalOpen(true); }
    },
    { type: 'divider' },
    {
      label: 'Nhật ký hệ thống',
      icon: <History className="w-4 h-4" />,
      onClick: (user) => navigate(`/admin/settings/audit?userId=${user.id}`)
    },
    {
      label: 'Trạng thái tài khoản',
      icon: <UserX className="w-4 h-4" />,
      variant: 'danger',
      onClick: (u) => {
        if (u.role.toLowerCase() === 'admin') {
          toast.error('Không thể thao tác trên tài khoản Admin');
          return;
        }
        handleToggleStatus(u);
      }
    },
  ];

  const filterConfig: FilterConfig[] = [
    { 
      key: 'search', 
      label: 'Tìm kiếm', 
      type: 'text', 
      placeholder: 'Tên, email, ID...' 
    },
    {
      key: 'role',
      label: 'Vai trò',
      type: 'select',
      options: [
        { label: 'Tất cả', value: 'All' },
        { label: 'Admin', value: 'Admin' },
        { label: 'Staff', value: 'Staff' },
        { label: 'Tenant', value: 'Tenant' },
      ]
    },
    { 
      key: 'isActive', 
      label: 'Trạng thái', 
      type: 'select', 
      options: [
        { label: 'Tất cả', value: 'All' },
        { label: 'Hoạt động', value: 'true' },
        { label: 'Đã khóa', value: 'false' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-lg">
                    <Users size={22} strokeWidth={2.5} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý người dùng</h1>
               </div>
               <p className="text-sm text-slate-400 font-medium pl-1">Phân quyền, bảo mật và hồ sơ cá nhân toàn hệ thống.</p>
            </div>

            <div className="flex items-center gap-3">
               <Button 
                variant="outline" 
                onClick={() => navigate('/admin/settings/users/permissions')} 
                className="h-11 px-5 rounded-xl border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 shadow-sm"
               >
                  <Shield size={16} className="mr-2 opacity-60 text-indigo-600" /> Ma trận quyền
               </Button>
               <Button 
                onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} 
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
               >
                  <UserPlus size={16} className="mr-2" /> Thêm người dùng
               </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="p-6 rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <Users size={20} />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng số</p>
                    <h3 className="text-2xl font-bold text-slate-800 leading-none">{users.length}</h3>
                 </div>
              </div>
           </Card>
           <Card className="p-6 rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    <Shield size={20} />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quản trị viên</p>
                    <h3 className="text-2xl font-bold text-slate-800 leading-none">
                      {users.filter(u => u.role.toLowerCase() === 'admin').length}
                    </h3>
                 </div>
              </div>
           </Card>
           <Card className="p-6 rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                    <UserCheck size={20} />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang online</p>
                    <h3 className="text-2xl font-bold text-emerald-600 leading-none">
                       {users.filter(u => u.isActive).length}
                    </h3>
                 </div>
              </div>
           </Card>
           <Card className="p-6 rounded-2xl border-slate-200/60 bg-white shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                    <Activity size={20} />
                 </div>
                 <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tác vụ 24h</p>
                    <h3 className="text-2xl font-bold text-slate-800 leading-none">32</h3>
                 </div>
              </div>
           </Card>
        </div>

        {/* Action & Filter Bar */}
        <FilterPanel
          filters={filterConfig}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({ isActive: 'true' })}
          className="bg-white border-slate-200/60 rounded-2xl px-6 py-5 shadow-sm"
          activeCount={Object.values(filterValues).filter(v => v !== '' && v !== 'true' && v !== 'All').length}
        />

        {/* Data Container */}
        <Card className="rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm bg-white">
          <DataTable
            columns={columns}
            data={users}
            total={users.length}
            loading={loading}
            rowActions={rowActions}
            emptyState={
               <div className="py-24 flex flex-col items-center justify-center space-y-4 opacity-40">
                  <Layers size={48} className="text-slate-300" strokeWidth={1} />
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-600">Danh sách trống</p>
                    <p className="text-xs font-medium text-slate-400">Không tìm thấy kết quả phù hợp với bộ lọc.</p>
                  </div>
               </div>
            }
          />
        </Card>
      </div>

      {/* Footer / Info Section */}
      <div className="max-w-7xl mx-auto px-6 mt-12 mb-20">
         <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200/60 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 border border-slate-100">
                  <Fingerprint size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">Tính bảo mật và minh bạch</h4>
                  <p className="text-xs text-slate-400 font-medium max-w-xl">
                    Mọi thao tác thay đổi vai trò hoặc trạng thái tài khoản đều được lưu lại trong hệ thống Audit Logs. Hãy đảm bảo bạn tuân thủ các chính sách bảo mật của SmartStay.
                  </p>
               </div>
            </div>
            <Button 
               variant="outline" 
               className="h-11 px-6 rounded-xl border-slate-200 bg-white text-slate-600 font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 hover:bg-slate-50"
               onClick={() => navigate('/admin/settings/audit')}
            >
               Xem nhật ký truy vết <ChevronRight size={14} className="opacity-60" />
            </Button>
         </div>
      </div>

      <UserModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        user={selectedUser} 
        onSuccess={fetchData}
      />
      
      <ResetPasswordModal
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        user={selectedUser}
      />
    </div>
  );
};

export default UserListPage;
