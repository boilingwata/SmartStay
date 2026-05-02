import React, { useState, useEffect, useCallback } from 'react';
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
  UserCheck,
  UserCog,
  Building2,
  SearchCheck,
  ShieldAlert,
} from 'lucide-react';
import { DataTable, RowAction } from '@/components/shared/DataTable';
import { FilterPanel, FilterConfig } from '@/components/shared/FilterPanel';
import { User, Role } from '@/types';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { auditService } from '@/services/auditService';
import { cn } from '@/utils';
import UserModal from '@/components/settings/users/UserModal';
import ResetPasswordModal from '@/components/settings/users/ResetPasswordModal';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    isActive: 'true'
  });

  const activeUsers = users.filter((user) => user.isActive).length;
  const lockedUsers = users.filter((user) => !user.isActive).length;
  const ownerUsers = users.filter((user) => user.role.toLowerCase() === 'owner').length;
  const staffUsers = users.filter((user) => user.role.toLowerCase() === 'staff').length;
  const tenantUsers = users.filter((user) => user.role.toLowerCase() === 'tenant').length;
  const superAdminUsers = users.filter((user) => user.role.toLowerCase() === 'superadmin').length;
  const selectedRoleLabel =
    roles.find((role) => role.id === filterValues.roleId)?.name ??
    (filterValues.roleId && filterValues.roleId !== 'All' ? 'Vai trò đã chọn' : 'Tất cả vai trò');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, roleData] = await Promise.all([
        userService.getUsers(filterValues),
        roleService.getRoles()
      ]);
      setUsers(userData);
      setRoles(roleData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [filterValues]);

  useEffect(() => {
    fetchData();
  }, [filterValues, fetchData]);

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.toggleUserStatus(user.id);
      await auditService.logAction({
        action: 'Chuyển trạng thái',
        entityType: 'Profiles',
        entityId: user.id,
        newValues: { isActive: !user.isActive }
      });
      fetchData();
      toast.success(`Đã ${user.isActive ? 'khóa' : 'mở'} tài khoản ${user.fullName}`);
    } catch {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const columns: ColumnDef<User>[] = [
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
      cell: ({ row }) => {
        const user = row.original;
        const roleLower = user.role.toLowerCase();
        const roleName = user.roleName || user.role;

        const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
          superadmin: { bg: 'bg-rose-50/80', text: 'text-rose-700', border: 'border-rose-100', label: roleName },
          owner: { bg: 'bg-indigo-50/80', text: 'text-indigo-700', border: 'border-indigo-100', label: 'Chủ sở hữu' },
          staff: { bg: 'bg-slate-50/80', text: 'text-slate-600', border: 'border-slate-200', label: 'Nhân viên' },
          tenant: { bg: 'bg-emerald-50/80', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Cư dân' },
        };

        const { bg, text, border, label } = config[roleLower] || { 
          bg: 'bg-gray-50', 
          text: 'text-gray-500', 
          border: 'border-gray-100', 
          label: roleName 
        };

        return (
          <Badge className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border shadow-none",
            bg, text, border
          )}>
            {label}
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
      onClick: (user) => navigate(`/owner/settings/audit-logs?userId=${user.id}`)
    },
    {
      label: 'Trạng thái tài khoản',
      icon: <UserX className="w-4 h-4" />,
      variant: 'danger',
      onClick: (u) => {
        if (['owner', 'superadmin'].includes(u.role.toLowerCase())) {
          toast.error('Không thể thao tác trên tài khoản quản trị cấp cao');
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
      key: 'roleId',
      label: 'Vai trò',
      type: 'select',
      options: [
        { label: 'Tất cả', value: 'All' },
        ...roles.map(r => ({ label: r.name, value: r.id }))
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
    <div className="min-h-screen bg-slate-50 pb-16 font-sans">
      <div className="border-b border-slate-200 bg-white">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <UserCog size={21} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Không gian quản lý
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Tài khoản & phân quyền
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Quản lý tài khoản owner, nhân sự vận hành và cư dân; theo dõi trạng thái truy cập, quyền hệ thống và nhật ký thay đổi.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() => navigate('/owner/settings/audit-logs')}
                className="h-10 rounded-lg border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <History size={15} className="mr-2 text-slate-500" /> Nhật ký
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/owner/settings/users/permissions')}
                className="h-10 rounded-lg border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                <Shield size={15} className="mr-2 text-indigo-600" /> Ma trận quyền
              </Button>
              <Button
                onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
                className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-800"
              >
                <UserPlus size={15} className="mr-2" /> Thêm tài khoản
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Tổng tài khoản</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{users.length}</p>
                  </div>
                  <Users size={22} className="text-slate-400" />
                </div>
              </Card>
              <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Đang hoạt động</p>
                    <p className="mt-2 text-3xl font-black text-emerald-600">{activeUsers}</p>
                  </div>
                  <UserCheck size={22} className="text-emerald-500" />
                </div>
              </Card>
              <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Bị khóa</p>
                    <p className="mt-2 text-3xl font-black text-rose-600">{lockedUsers}</p>
                  </div>
                  <ShieldAlert size={22} className="text-rose-500" />
                </div>
              </Card>
              <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Vai trò lọc</p>
                    <p className="mt-2 truncate text-xl font-black text-slate-950">{selectedRoleLabel}</p>
                  </div>
                  <SearchCheck size={22} className="text-amber-500" />
                </div>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <FilterPanel
                filters={filterConfig}
                values={filterValues}
                onChange={setFilterValues}
                onReset={() => setFilterValues({ isActive: 'true' })}
                className="rounded-lg border-slate-200 bg-white px-5 py-4 shadow-sm"
                activeCount={Object.values(filterValues).filter(v => v !== '' && v !== 'true' && v !== 'All').length}
              />

              <Card className="rounded-lg border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Phân bổ vai trò</p>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    { label: 'Chủ nhà', value: ownerUsers, tone: 'bg-indigo-500' },
                    { label: 'Nhân viên', value: staffUsers, tone: 'bg-slate-700' },
                    { label: 'Cư dân', value: tenantUsers, tone: 'bg-emerald-500' },
                    { label: 'Quản trị tối cao', value: superAdminUsers, tone: 'bg-rose-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-semibold text-slate-600">
                        <span className={cn('h-2.5 w-2.5 rounded-full', item.tone)} />
                        {item.label}
                      </span>
                      <span className="font-black text-slate-950">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <DataTable
                columns={columns}
                data={users}
                total={users.length}
                loading={loading}
                rowActions={rowActions}
                emptyState={
                  <div className="flex flex-col items-center justify-center space-y-4 py-24 opacity-60">
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

          <aside className="space-y-4">
            <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Building2 size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Quy trình</p>
                  <h2 className="text-base font-black text-slate-950">Thiết lập tài khoản</h2>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  'Tạo tài khoản và gán vai trò đúng phạm vi.',
                  'Gán quyền truy cập tòa nhà cho nhân sự liên quan.',
                  'Gửi liên kết đặt lại mật khẩu hoặc buộc đổi mật khẩu.',
                  'Kiểm tra nhật ký sau các thay đổi quyền nhạy cảm.',
                ].map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-lg border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-rose-700">
                  <Shield size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">Xác thực</p>
                  <h2 className="text-base font-black text-rose-950">Tài khoản mẫu Quản trị tối cao</h2>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-rose-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Thư điện tử</p>
                <p className="mt-1 break-all text-sm font-black text-slate-950">superadmin@smartstay.vn</p>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Mật khẩu mẫu</p>
                <p className="mt-1 break-all text-sm font-black text-slate-950">SuperAdmin@123456</p>
              </div>
              <p className="mt-3 text-xs leading-5 text-rose-700">
                Thư điện tử này được đối chiếu từ Supabase Auth. Quyền Quản trị tối cao được nhận qua <code className="font-mono">app_metadata.workspace_role = super_admin</code>.
              </p>
            </Card>

            <Card className="rounded-lg border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Fingerprint size={22} className="mt-1 text-slate-400" />
                <div>
                  <h2 className="text-sm font-black text-slate-950">Bảo mật & truy vết</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Mọi thao tác thay đổi vai trò hoặc trạng thái tài khoản cần được đối chiếu với nhật ký để kiểm soát rủi ro vận hành.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 h-10 rounded-lg border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-slate-700"
                    onClick={() => navigate('/owner/settings/audit-logs')}
                  >
                    Xem nhật ký <ChevronRight size={14} className="ml-2 opacity-60" />
                  </Button>
                </div>
              </div>
            </Card>
          </aside>
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
