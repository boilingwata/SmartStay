import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart2,
  Building,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DoorOpen,
  FilePlus2,
  FileSearch,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  Waves,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { buildingService } from '@/services/buildingService';
import { usePermission } from '@/hooks/usePermission';
import useAuthStore from '@/stores/authStore';
import useUIStore from '@/stores/uiStore';
import { cn } from '@/utils';

interface NavItem {
  labelKey: string;
  route: string;
  icon: LucideIcon;
  permission?: string;
  ownerOnly?: boolean;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  width?: number;
}

const sidebarText: Record<string, string> = {
  'sidebar.overview': 'Tổng quan',
  'sidebar.property': 'Bất động sản',
  'sidebar.leasing': 'Khách thuê và hợp đồng',
  'sidebar.utilities_services': 'Điện nước và dịch vụ',
  'sidebar.finance': 'Tài chính',
  'sidebar.operations': 'Vận hành',
  'sidebar.settings': 'Cài đặt hệ thống',
  'sidebar.dashboard': 'Bảng điều khiển',
  'sidebar.reports': 'Báo cáo',
  'sidebar.buildings': 'Tòa nhà',
  'sidebar.rooms': 'Phòng',
  'sidebar.assets': 'Tài sản',
  'sidebar.amenities': 'Tiện ích chung',
  'sidebar.tenants': 'Khách thuê',
  'sidebar.leads': 'Đơn thuê',
  'sidebar.contracts': 'Hợp đồng thuê',
  'sidebar.contractAddendums': 'Phụ lục hợp đồng',
  'sidebar.utilities': 'Quản lý điện nước',
  'sidebar.billingRuns': 'Đợt chốt chỉ số',
  'sidebar.utilityPolicies': 'Chính sách tiện ích',
  'sidebar.utilityOverrides': 'Điều chỉnh thủ công',
  'sidebar.services': 'Bảng giá dịch vụ',
  'sidebar.invoices': 'Hóa đơn',
  'sidebar.payments': 'Thanh toán',
  'sidebar.allTickets': 'Yêu cầu hỗ trợ',
  'sidebar.announcements': 'Thông báo',
  'sidebar.visitorCheckin': 'Kiểm tra khách',
  'sidebar.amenityCheckin': 'Kiểm tra tiện ích',
  'sidebar.users': 'Nhân sự và tài khoản',
  'sidebar.permissions': 'Phân quyền',
  'sidebar.systemConfig': 'Cấu hình hệ thống',
  'sidebar.auditLogs': 'Nhật ký hoạt động',
  'sidebar.commandCenter': 'KHÔNG GIAN QUẢN LÝ',
  'sidebar.activeBuilding': 'Tòa nhà đang chọn',
};

const navItems: { groupKey: string; items: NavItem[] }[] = [
  {
    groupKey: 'sidebar.overview',
    items: [
      { labelKey: 'sidebar.dashboard', route: '/owner/dashboard', icon: LayoutDashboard },
      { labelKey: 'sidebar.reports', route: '/owner/reports', icon: BarChart2, permission: 'report.view' },
    ],
  },
  {
    groupKey: 'sidebar.property',
    items: [
      { labelKey: 'sidebar.buildings', route: '/owner/buildings', icon: Building, permission: 'building.view' },
      { labelKey: 'sidebar.rooms', route: '/owner/rooms', icon: DoorOpen, permission: 'room.view' },
      { labelKey: 'sidebar.assets', route: '/owner/assets', icon: Package, permission: 'asset.view' },
      { labelKey: 'sidebar.amenities', route: '/owner/amenities', icon: Waves, ownerOnly: true },
    ],
  },
  {
    groupKey: 'sidebar.leasing',
    items: [
      { labelKey: 'sidebar.tenants', route: '/owner/tenants', icon: Users, permission: 'tenant.view' },
      { labelKey: 'sidebar.leads', route: '/owner/leads', icon: FileSearch },
      { labelKey: 'sidebar.contracts', route: '/owner/contracts', icon: FileText, permission: 'contract.view' },
      { labelKey: 'sidebar.contractAddendums', route: '/owner/contracts/addendums', icon: FilePlus2, permission: 'contract.view' },
    ],
  },
  {
    groupKey: 'sidebar.utilities_services',
    items: [
      { labelKey: 'sidebar.utilities', route: '/owner/utility-billing', icon: Zap, ownerOnly: true },
      { labelKey: 'sidebar.billingRuns', route: '/owner/settings/billing-runs', icon: Receipt, ownerOnly: true },
      { labelKey: 'sidebar.services', route: '/owner/services', icon: Wrench, permission: 'service.manage' },
      { labelKey: 'sidebar.utilityPolicies', route: '/owner/settings/utility-policies', icon: Settings, ownerOnly: true },
      { labelKey: 'sidebar.utilityOverrides', route: '/owner/settings/utility-overrides', icon: FileText, ownerOnly: true },
    ],
  },
  {
    groupKey: 'sidebar.finance',
    items: [
      { labelKey: 'sidebar.invoices', route: '/owner/invoices', icon: Receipt, permission: 'invoice.view' },
      { labelKey: 'sidebar.payments', route: '/owner/payments', icon: CreditCard, permission: 'payment.view' },
    ],
  },
  {
    groupKey: 'sidebar.operations',
    items: [
      { labelKey: 'sidebar.allTickets', route: '/owner/tickets', icon: AlertCircle, permission: 'ticket.view.all' },
      { labelKey: 'sidebar.announcements', route: '/owner/announcements', icon: Megaphone, permission: 'announcement.manage' },
      { labelKey: 'sidebar.visitorCheckin', route: '/owner/staff/visitor-checkin', icon: UserPlus, permission: 'visitor.checkin' },
      { labelKey: 'sidebar.amenityCheckin', route: '/owner/staff/amenity-checkin', icon: Waves, permission: 'amenity.checkin' },
    ],
  },
  {
    groupKey: 'sidebar.settings',
    items: [
      { labelKey: 'sidebar.users', route: '/owner/settings/users', icon: UserCog, ownerOnly: true },
      { labelKey: 'sidebar.permissions', route: '/owner/settings/users/permissions', icon: ShieldCheck, ownerOnly: true },
      { labelKey: 'sidebar.systemConfig', route: '/owner/settings/system', icon: Settings, ownerOnly: true },
      { labelKey: 'sidebar.auditLogs', route: '/owner/settings/audit-logs', icon: ScrollText, ownerOnly: true },
    ],
  },
];

export const Sidebar = ({
  mobileOpen = false,
  onMobileClose,
  width = 272,
}: SidebarProps) => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const activeBuildingId = useUIStore((state) => state.activeBuildingId);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { can } = usePermission();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const translate = (key: string) => sidebarText[key] || t(key);

  const { data: buildings } = useQuery({
    queryKey: ['buildings-sidebar'],
    queryFn: () => buildingService.getBuildings(),
    staleTime: 5 * 60 * 1000,
  });

  const activeBuilding = buildings?.find((building) => String(building.id) === String(activeBuildingId));
  const isOwner = user?.role === 'Owner' || user?.role === 'SuperAdmin';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đăng xuất thành công');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Không thể đăng xuất');
    }
  };

  return (
    <aside
      className={cn(
        'z-50 flex h-screen flex-col border-r border-white/10 bg-primary text-white shadow-2xl transition-all duration-300',
        mobileOpen ? 'fixed left-0 top-0' : 'sticky top-0 hidden lg:flex',
      )}
      style={{ width }}
    >
      <div className="flex h-20 shrink-0 items-center border-b border-white/10 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-slate-950/20">
            <Building2 size={22} />
          </div>
          {(sidebarOpen || mobileOpen) ? (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-display font-bold tracking-tight">SmartStay</h1>
              <p className="truncate text-[10px] font-mono tracking-[0.18em] text-white/55">
                {translate('sidebar.commandCenter')}
              </p>
            </div>
          ) : null}
        </div>

        {mobileOpen ? (
          <button
            onClick={onMobileClose}
            aria-label="Đóng menu"
            className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <div className={cn('px-3 py-4', sidebarOpen || mobileOpen ? 'block' : 'hidden')}>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            {translate('sidebar.activeBuilding')}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {activeBuilding?.buildingName || 'Chưa chọn tòa nhà'}
          </p>
        </div>
      </div>

      <nav className="min-w-0 flex-1 space-y-5 overflow-y-auto scrollbar-hide px-3 pb-4">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.ownerOnly && !isOwner) return false;
            if (item.permission && !can(item.permission) && !isOwner) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupKey} className="space-y-1">
              {(sidebarOpen || mobileOpen) ? (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {translate(group.groupKey)}
                </p>
              ) : null}

              {visibleItems.map((item) => (
                <NavLink
                  key={item.route}
                  to={item.route}
                  onClick={() => onMobileClose?.()}
                  title={!sidebarOpen && !mobileOpen ? translate(item.labelKey) : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all',
                      isActive
                        ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/12'
                        : 'text-white/68 hover:bg-white/7 hover:text-white',
                      !sidebarOpen && !mobileOpen && 'justify-center px-2',
                    )
                  }
                >
                  <item.icon size={19} className="shrink-0" />
                  {(sidebarOpen || mobileOpen) ? (
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {translate(item.labelKey)}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 bg-white/5 p-3">
        <div className={cn('flex items-center gap-3 rounded-2xl p-2', sidebarOpen || mobileOpen ? 'bg-white/5' : 'justify-center')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
            {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          {(sidebarOpen || mobileOpen) ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {(() => {
                  const rawName = user?.fullName?.trim() || user?.username?.trim() || '';
                  if (!rawName) return 'Người dùng hệ thống';
                  const normalized = rawName.toLowerCase();
                  return normalized === 'system admin' || normalized === 'admin'
                    ? 'Quản trị hệ thống'
                    : rawName;
                })()}
              </p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.16em] text-white/45">
                {user?.role === 'Owner' || user?.role === 'SuperAdmin'
                  ? 'Chủ nhà'
                  : user?.role === 'Tenant'
                    ? 'Người thuê'
                    : user?.role === 'Staff'
                      ? 'Nhân sự nội bộ'
                      : 'Người dùng hệ thống'}
              </p>
            </div>
          ) : null}

          <button
            onClick={handleLogout}
            aria-label="Đăng xuất"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>

        {mobileOpen ? null : (
          <button
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
            className="mt-2 hidden w-full items-center justify-center rounded-2xl py-2 text-white/35 transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 lg:flex"
            title={sidebarOpen ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        )}
      </div>
    </aside>
  );
};
