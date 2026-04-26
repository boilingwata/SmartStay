import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import useUIStore from '@/stores/uiStore';
import { cn } from '@/utils';

export const AdminLayout = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300">
      <div className={cn('hidden lg:block', sidebarOpen ? 'w-[260px]' : 'w-[72px]')}>
        <Sidebar />
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-10 w-[260px] animate-in slide-in-from-left duration-300">
            <Sidebar />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="mx-auto max-w-[1280px] p-4 sm:p-5 md:p-8 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
