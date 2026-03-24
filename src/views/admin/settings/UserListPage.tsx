import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  MoreVertical, 
  Lock,
  UserX,
  History,
  X
} from 'lucide-react';
import { DataTable, RowAction } from '@/components/shared/DataTable';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { User, UserRoleType } from '@/types';
import { userService } from '@/services/userService';
import { formatRelativeTime, cn } from '@/utils';
import UserModal from './UserModal';
import ResetPasswordModal from './ResetPasswordModal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers(filterValues);
      setUsers(data);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterValues]);

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user.id);
      fetchUsers();
      toast.success('Đã cập nhật trạng thái người dùng');
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const columns: ColumnDef<User, any>[] = [
    {
      header: 'Người dùng',
      accessorKey: 'fullName',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm overflow-hidden">
               {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.fullName.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 leading-tight">{user.fullName}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">#{user.id}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Username',
      accessorKey: 'username',
      cell: ({ getValue }) => <code className="text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{getValue()}</code>,
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ getValue }) => {
        const email = getValue() as string;
        const maskedEmail = email.replace(/^(.)(.*)(.@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c);
        return (
          <a href={`mailto:${email}`} title={email} className="text-blue-600 hover:underline flex items-center gap-1.5 text-xs font-medium">
            <Mail className="h-3 w-3" />
            {maskedEmail}
          </a>
        );
      },
    },
    {
      header: 'Vai trò',
      accessorKey: 'role',
      cell: ({ getValue }) => {
        const role = getValue();
        let status = 'Info';
        if (role === 'Admin') status = 'Critical';
        if (role === 'Staff') status = 'Warning';
        return <StatusBadge status={status as any} size="sm" />;
      },
    },
    {
      header: 'Trạng thái',
      accessorKey: 'isActive',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div 
            className={cn(
              "w-10 h-5 rounded-full relative cursor-pointer transition-all border",
              user.isActive ? "bg-success border-success" : "bg-slate-200 border-slate-300"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (user.role !== 'Admin') handleToggleStatus(user);
            }}
          >
            <div className={cn(
              "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all",
              user.isActive ? "right-0.5" : "left-0.5"
            )} />
          </div>
        );
      },
    },
    {
      header: 'Lần cuối đăng nhập',
      accessorKey: 'lastLoginAt',
      cell: ({ getValue }) => (
        <span className="text-xs text-slate-500 italic">
          {getValue() ? formatRelativeTime(getValue()) : 'Chưa từng'}
        </span>
      ),
    },
    {
      header: '2FA',
      accessorKey: 'isTwoFactorEnabled',
      cell: ({ getValue }) => (
        <span className={cn(
          "text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border",
          getValue() ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-400 border-slate-200"
        )}>
          {getValue() ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<User>[] = [
    {
      label: 'Sửa thông tin',
      icon: <Users className="w-4 h-4" />,
      onClick: (user) => { setSelectedUser(user); setIsModalOpen(true); }
    },
    {
      label: 'Đổi mật khẩu',
      icon: <Lock className="w-4 h-4" />,
      onClick: (user) => { setSelectedUser(user); setIsResetModalOpen(true); }
    },
    {
      type: 'divider'
    },
    {
      label: 'Lịch sử thao tác',
      icon: <History className="w-4 h-4" />,
      onClick: (user) => toast.info(`Đang mở log của ${user.username}`)
    },
    {
      label: 'Khóa/Mở tài khoản',
      icon: <UserX className="w-4 h-4" />,
      variant: 'danger',
      onClick: (user) => {
        if (user.role === 'Admin') {
          toast.error('Không thể khóa tài khoản Admin hệ thống');
          return;
        }
        handleToggleStatus(user);
      }
    },
    {
      label: 'Xóa tài khoản',
      icon: <X className="w-4 h-4" />,
      variant: 'danger',
      onClick: (user) => {
        if (user.role === 'Admin') {
          toast.error('Không thể xóa tài khoản Admin hệ thống');
          return;
        }
        if (confirm(`Bạn có chắc muốn xóa người dùng ${user.username}?`)) {
          userService.deleteUser(user.id).then(() => {
            fetchUsers();
            toast.success('Đã xóa người dùng');
          });
        }
      }
    }
  ];

  const filterConfig: FilterConfig[] = [
    { 
      key: 'search', 
      label: 'Tìm kiếm', 
      type: 'text', 
      placeholder: 'Tên, username, email...' 
    },
    { 
      key: 'role', 
      label: 'Vai trò', 
      type: 'select', 
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Admin', value: 'Admin' },
        { label: 'Staff', value: 'Staff' },
        { label: 'Tenant', value: 'Tenant' },
        { label: 'Viewer', value: 'Viewer' },
      ] 
    },
    { 
      key: 'isActive', 
      label: 'Trạng thái', 
      type: 'select', 
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Đang hoạt động', value: 'true' },
        { label: 'Bị khóa', value: 'false' },
      ]
    },
    {
      key: 'buildingId',
      label: 'Tòa nhà',
      type: 'selectAsync',
      placeholder: 'Chọn tòa nhà...',
    }
  ];

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-600/20">
              <Shield size={28} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Cài đặt Hệ thống</h1>
              <p className="text-slate-500 text-sm font-medium italic">Quản lý người dùng, phân quyền RBAC và Audit Logs.</p>
           </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/settings/users/permissions')} className="rounded-2xl border-indigo-100 hover:bg-indigo-50 font-bold">
            <Shield className="mr-2 h-4 w-4 text-indigo-600" /> Phân quyền (RBAC)
          </Button>
          <Button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20">
            <UserPlus className="mr-2 h-4 w-4" /> Thêm người dùng
          </Button>
        </div>
      </div>

      <FilterPanel
        filters={filterConfig}
        values={filterValues}
        onChange={setFilterValues}
        onReset={() => setFilterValues({ isActive: 'true' })}
        activeCount={Object.values(filterValues).filter(v => v !== '' && v !== 'true').length}
      />

      <div className="rounded-[32px] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-900/5 bg-white/80 backdrop-blur-md">
        <DataTable
          columns={columns}
          data={users}
          total={users.length}
          loading={loading}
          rowActions={rowActions}
          rowClassName={(user) => !user.isActive ? "opacity-60 bg-slate-50/50" : ""}
        />
      </div>

      <UserModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        user={selectedUser} 
        onSuccess={fetchUsers}
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
