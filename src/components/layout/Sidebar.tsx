import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileSearch,
  Receipt,
  CreditCard,
  Users,
  DoorOpen,
  Building,
  Package,
  AlertCircle,
  BarChart2,
  Megaphone,
  Wrench,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  UserPlus,
  Waves,
  ShieldCheck,
  FilePlus2,
  Zap,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { buildingService } from '@/services/buildingService';

interface NavItem {
  labelKey: string;
  route: string;
  icon: LucideIcon;
  permission?: string;
  ownerOnly?: boolean;
  badge?: number;
}

const sidebarText: Record<string, string> = {
  'sidebar.overview': 'TỔNG QUAN',
  'sidebar.property': 'BẤT ĐỘNG SẢN',
  'sidebar.leasing': 'THUÊ & HỢP ĐỒNG',
  'sidebar.utilities_services': 'ĐIỆN NƯỚC & DỊCH VỤ',
  'sidebar.finance': 'TÀI CHÍNH',
  'sidebar.operations': 'VẬN HÀNH & CSKH',
  'sidebar.settings': 'CÀI ĐẶT HỆ THỐNG',
  'sidebar.dashboard': 'Tổng quan launch',
  'sidebar.reports': 'Báo cáo phân tích',
  'sidebar.buildings': 'Tòa nhà',
  'sidebar.rooms': 'Tin đăng',
  'sidebar.assets': 'Tài sản & Thiết bị',
  'sidebar.amenities': 'Khu tiện ích',
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
  'sidebar.payments': 'Phiếu thu / Thanh toán',
  'sidebar.allTickets': 'Yêu cầu hỗ trợ',
  'sidebar.announcements': 'Thông báo nội bộ',
  'sidebar.visitorCheckin': 'Check-in Khách',
  'sidebar.amenityCheckin': 'Check-in Tiện ích',
  'sidebar.users': 'Nhân sự & Tài khoản',
  'sidebar.permissions': 'Phân quyền',
  'sidebar.systemConfig': 'Cấu hình hệ thống',
  'sidebar.auditLogs': 'Nhật ký hoạt động',
  'sidebar.commandCenter': 'TRUNG TÂM ĐIỀU KHIỂN',
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

export const Sidebar = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { can } = usePermission();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tt = (key: string) => sidebarText[key] || t(key);

  const { data: buildings } = useQuery({
    queryKey: ['buildings-sidebar'],
    queryFn: () => buildingService.getBuildings(),
    staleTime: 5 * 60 * 1000,
  });

  const activeBuilding = buildings?.find((b) => String(b.id) === String(activeBuildingId));
  const isOwner = user?.role === 'Owner' || user?.role === 'SuperAdmin';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Đăng xuất thành công');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Lỗi đăng xuất');
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col bg-primary text-white shadow-2xl transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-[260px]' : 'w-[72px]',
      )}
    >
      <div className="h-20 shrink-0 border-b border-white/10 px-6">
        <div className="flex h-full items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent shadow-lg shadow-accent/20">
            <Building2 size={22} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="animate-in slide-in-from-left-4 fade-in duration-500">
              <h1 className="whitespace-nowrap text-xl font-display font-bold tracking-tight">
                SmartStay <span className="text-accent">Launch</span>
              </h1>
              <p className="text-[9px] font-mono tracking-[0.2em] text-white/40">{tt('sidebar.commandCenter')}</p>
            </div>
          )}
        </div>
      </div>

      <div className={cn('overflow-hidden px-4 py-4 transition-all', sidebarOpen ? 'block' : 'hidden lg:block lg:h-0 lg:invisible')}>
        <div className="group flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Building size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{tt('sidebar.activeBuilding')}</p>
            <p className="truncate text-sm font-bold">{activeBuilding?.buildingName || 'Chọn tòa nhà'}</p>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (item.ownerOnly && !isOwner) return false;
            if (item.permission && !can(item.permission) && !isOwner) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupKey} className="space-y-1">
              {sidebarOpen && (
                <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                  {tt(group.groupKey)}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.route}
                  to={item.route}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
                      isActive ? 'bg-white/10 font-bold text-white ring-1 ring-white/20' : 'text-white/60 hover:bg-white/5 hover:text-white',
                    )
                  }
                  title={!sidebarOpen ? tt(item.labelKey) : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
                      {sidebarOpen && <span className="flex-1 truncate text-sm">{tt(item.labelKey)}</span>}
                      {item.badge && sidebarOpen && (
                        <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-primary">
                          {item.badge}
                        </span>
                      )}
                      {!sidebarOpen && isActive && <div className="absolute left-0 h-8 w-1 rounded-r-full bg-accent" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 bg-white/5 p-3">
        <div className={cn('flex items-center gap-3 rounded-xl p-3 transition-all', sidebarOpen ? 'bg-white/5' : 'bg-transparent')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold shadow-lg shadow-accent/20">
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-none">{user?.username || 'Người dùng hệ thống'}</p>
              <p className="mt-1 text-[10px] uppercase tracking-tighter text-white/40">{user?.role || 'Chủ sở hữu'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn('shrink-0 rounded-lg p-1.5 transition-colors hover:bg-danger/20 hover:text-danger', !sidebarOpen && 'mx-auto')}
          >
            <LogOut size={16} />
          </button>
        </div>

        <button onClick={toggleSidebar} className="flex w-full items-center justify-center py-2 text-white/30 transition-colors hover:text-white">
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};
