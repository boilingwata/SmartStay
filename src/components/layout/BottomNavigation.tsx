import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Receipt, Wrench, Building2, User } from 'lucide-react';
import { cn } from '@/utils';

const navItems = [
  { icon: Home, label: 'Trang chủ', route: '/portal/dashboard' },
  { icon: Receipt, label: 'Hóa đơn', route: '/portal/invoices', badge: 2 },
  { icon: Wrench, label: 'Yêu cầu', route: '/portal/tickets' },
  { icon: Building2, label: 'Tiện ích', route: '/portal/amenities' },
  { icon: User, label: 'Hồ sơ', route: '/portal/profile' },
];

const BottomNavigation: React.FC = () => {
  return (
    <nav className="portal-bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.route}
          to={item.route}
          className={({ isActive }) =>
            cn(
              "group flex flex-col items-center justify-center flex-1 h-full transition-all duration-500 relative py-2",
              isActive ? "text-[#0D8A8A]" : "text-slate-400"
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Active Indicator Bar */}
              <div className={cn(
                "absolute top-0 w-12 h-1 rounded-b-full bg-[#0D8A8A] transition-all duration-500 transform origin-top",
                isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
              )} />

              <div className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500",
                isActive ? "bg-[#0D8A8A]/5 shadow-inner" : "group-hover:bg-slate-50"
              )}>
                <item.icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn("transition-all duration-500", isActive && "scale-110 rotate-[5deg]")}
                />
                
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#0D8A8A] text-[9px] font-black text-white ring-4 ring-white shadow-lg">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[1px] transition-all duration-500 mt-1.5",
                isActive ? "opacity-100 translate-y-0" : "opacity-40 translate-y-0.5 group-hover:opacity-70"
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};


export default BottomNavigation;
