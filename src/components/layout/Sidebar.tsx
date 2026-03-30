import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Receipt, CreditCard, Users, 
  DoorOpen, Building, Gauge, Package, AlertCircle, 
  BarChart2, Megaphone, Briefcase, Wrench, Zap, 
  Droplets, UserCog, Settings, ScrollText, ChevronLeft,
  ChevronRight, LogOut, Building2, UserPlus, Waves,
  ShieldCheck, FilePlus2
} from 'lucide-react';
import { cn } from '@/utils';
import useUIStore from '@/stores/uiStore';
import useAuthStore from '@/stores/authStore';
import { usePermission } from '@/hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { buildingService } from '@/services/buildingService';

interface NavItem {
  labelKey: string;
  route: string;
  icon: any;
  permission?: string;
  adminOnly?: boolean;
  badge?: number;
}

const navItems: { groupKey: string; items: NavItem[] }[] = [
  {
    groupKey: "sidebar.system",
    items: [
      { labelKey: "sidebar.dashboard", route: "/admin/dashboard", icon: LayoutDashboard },
      { labelKey: "sidebar.buildings", route: "/admin/buildings", icon: Building, permission: "building.view" },
      { labelKey: "sidebar.rooms", route: "/admin/rooms", icon: DoorOpen, permission: "room.view" },
    ]
  },
  {
    groupKey: "sidebar.customers",
    items: [
      { labelKey: "sidebar.tenants", route: "/admin/tenants", icon: Users, permission: "tenant.view" },
      { labelKey: "sidebar.owners", route: "/admin/owners", icon: Briefcase, adminOnly: true },
      { labelKey: "sidebar.contracts", route: "/admin/contracts", icon: FileText, permission: "contract.view" },
      { labelKey: "sidebar.contractAddendums", route: "/admin/contracts/addendums", icon: FilePlus2, permission: "contract.view" },
    ]
  },
  {
    groupKey: "sidebar.finance",
    items: [
      { labelKey: "sidebar.invoices", route: "/admin/invoices", icon: Receipt, permission: "invoice.view" },
      { labelKey: "sidebar.payments", route: "/admin/payments", icon: CreditCard, permission: "payment.view" },
      { labelKey: "sidebar.services", route: "/admin/services", icon: Wrench, permission: "service.manage" },
    ]
  },
  {
    groupKey: "sidebar.operations",
    items: [
      { labelKey: "sidebar.allTickets", route: "/admin/tickets", icon: AlertCircle, permission: "ticket.view.all" },
      { labelKey: "sidebar.meterEntry", route: "/admin/meters/bulk", icon: Gauge, permission: "meter.entry" },
      { labelKey: "sidebar.visitorCheckin", route: "/admin/staff/visitor-checkin", icon: UserPlus, permission: "visitor.checkin" },
      { labelKey: "sidebar.amenityCheckin", route: "/admin/staff/amenity-checkin", icon: Waves, permission: "amenity.checkin" },
      { labelKey: "sidebar.assets", route: "/admin/assets", icon: Package, permission: "asset.view" },
    ]
  },
  {
    groupKey: "sidebar.communication",
    items: [
      { labelKey: "sidebar.announcements", route: "/admin/announcements", icon: Megaphone, permission: "announcement.manage" },
      { labelKey: "sidebar.reports", route: "/admin/reports", icon: BarChart2, permission: "report.view" },
    ]
  },
  {
    groupKey: "sidebar.settings",
    items: [
      { labelKey: "sidebar.users", route: "/admin/settings/users", icon: UserCog, adminOnly: true },
      { labelKey: "sidebar.permissions", route: "/admin/settings/users/permissions", icon: ShieldCheck, adminOnly: true },
      { labelKey: "sidebar.electricityPolicy", route: "/admin/settings/electricity-policy", icon: Zap, adminOnly: true },
      { labelKey: "sidebar.waterPolicy", route: "/admin/settings/water-policy", icon: Droplets, adminOnly: true },
      { labelKey: "sidebar.systemConfig", route: "/admin/settings/system", icon: Settings, adminOnly: true },
      { labelKey: "sidebar.auditLogs", route: "/admin/settings/audit-logs", icon: ScrollText, adminOnly: true },
    ]
  }
];

export const Sidebar = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeBuildingId = useUIStore((s) => s.activeBuildingId);
  const setBuilding = useUIStore((s) => s.setBuilding);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { can } = usePermission();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: buildings } = useQuery({
    queryKey: ['buildings-sidebar'],
    queryFn: () => buildingService.getBuildings(),
    staleTime: 5 * 60 * 1000,
  });
  const activeBuilding = buildings?.find(b => String(b.id) === String(activeBuildingId));

  const handleLogout = () => {
    logout();
    toast.success(t('auth.logoutSuccess'));
    navigate('/public/login', { replace: true });
  };
  
  const isAdmin = user?.role === 'Admin';
  
  
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-primary text-white flex flex-col z-50 transition-all duration-300 ease-in-out shadow-2xl",
      sidebarOpen ? "w-[260px]" : "w-[72px]"
    )}>
      {/* 4.1 Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
            <Building2 size={22} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-xl font-display font-bold whitespace-nowrap tracking-tight">
                SmartStay <span className="text-accent">BMS</span>
              </h1>
              <p className="text-[9px] text-white/40 font-mono tracking-[0.2em]">{t('sidebar.commandCenter')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 4.1 Building Selector */}
      <div className={cn("px-4 py-4 transition-all overflow-hidden", sidebarOpen ? "block" : "hidden lg:block lg:invisible lg:h-0")}>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 group hover:bg-white/10 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Building size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t('sidebar.activeBuilding')}</p>
            <p className="text-sm font-bold truncate">{activeBuilding?.buildingName || 'Chọn tòa nhà'}</p>
          </div>
        </div>
      </div>

      {/* 4.1.1 Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {navItems.map((group) => {
          const visibleItems = group.items.filter(item => {
            // 1. Check adminOnly
            if (item.adminOnly && !isAdmin) return false;
            
            // 2. Check specific permission
            // If item has permission AND user doesn't have it AND user is NOT admin (admin has all powers)
            if (item.permission && !can(item.permission) && !isAdmin) return false;
            
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupKey} className="space-y-1">
              {sidebarOpen && (
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] px-4 mb-2">
                  {t(group.groupKey)}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.route}
                  to={item.route}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                    isActive
                      ? "bg-white/10 text-white font-bold ring-1 ring-white/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                  title={!sidebarOpen ? t(item.labelKey) : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={20} className={cn("shrink-0 transition-transform group-hover:scale-110")} />
                      {sidebarOpen && (
                        <span className="flex-1 truncate text-sm">
                          {t(item.labelKey)}
                        </span>
                      )}
                      {item.badge && sidebarOpen && (
                        <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-primary">
                          {item.badge}
                        </span>
                      )}
                      {!sidebarOpen && isActive && (
                        <div className="absolute left-0 w-1 h-8 bg-accent rounded-r-full"></div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* 4.1 Bottom: User Info & Collapse */}
      <div className="p-3 bg-white/5 border-t border-white/10 space-y-2">
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl transition-all",
          sidebarOpen ? "bg-white/5" : "bg-transparent"
        )}>
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold shrink-0 shadow-lg shadow-accent/20">
            {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-none">{user?.username || 'Administrator'}</p>
              <p className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter">{user?.role || 'Admin'}</p>
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className={cn("p-1.5 hover:bg-danger/20 hover:text-danger rounded-lg transition-colors shrink-0", !sidebarOpen && "mx-auto")}
          >
            <LogOut size={16} />
          </button>
        </div>
        
        <button 
          onClick={toggleSidebar} 
          className="w-full flex items-center justify-center py-2 text-white/30 hover:text-white transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};
