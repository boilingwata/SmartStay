import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
} from 'lucide-react';
import BottomNavigation from '@/components/layout/BottomNavigation';

import useAuthStore from '@/stores/authStore';
import useUIStore from '@/stores/uiStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { PublicTopbar, PublicFooter } from './PublicComponents';
import { cn } from '@/utils';

// --- 4.1 Admin & Staff Shared Layout ---
export const AdminLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-background text-foreground min-h-screen overflow-x-hidden transition-colors duration-300">
      {/* 4.1 Sidebar logic for Desktop & Mobile */}
      <div className={cn(
        "hidden lg:block", 
        sidebarOpen ? "w-[260px]" : "w-[72px]"
      )}>
        <Sidebar />
      </div>

      {/* 4.1 Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="w-[260px] relative z-10 animate-in slide-in-from-left duration-300">
            <Sidebar />
          </div>
        </div>
      )}

      {/* 4.1 Main Dynamic Content Framework */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        
        {/* 4.1 ContentArea: max-w-1280px + Responsive Padding */}
        <main className="flex-1 overflow-auto animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="max-w-[1280px] mx-auto p-4 sm:p-5 md:p-8 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// --- TODO: 4.3 StaffLayout is handled implicitly within AdminLayout via role-based sidebar items.
// In a real app we might add Staff-specific widgets in the Dashboard component based on role.

// PortalLayout has been moved to @/components/layout/PortalLayout.tsx to consolidate implementation.





// --- 4.3 Public Layout (Hero pages / Landing) ---
export const PublicLayout = ({ showHeader = true }: { showHeader?: boolean }) => (
  <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
    {showHeader && <PublicTopbar />}
    <main className="flex-1 animate-in fade-in duration-700">
      <Outlet />
    </main>
    {showHeader && <PublicFooter />}
  </div>
);

