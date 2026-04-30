import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import useUIStore from '@/stores/uiStore';

export const AdminLayout = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopSidebarWidth = sidebarOpen ? 272 : 88;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div
        className="relative min-h-screen lg:grid"
        style={{
          gridTemplateColumns: `${desktopSidebarWidth}px minmax(0, 1fr)`,
        }}
      >
        <Sidebar width={desktopSidebarWidth} />

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <Sidebar
              mobileOpen
              width={272}
              onMobileClose={() => setMobileMenuOpen(false)}
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col">
          <Topbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[1760px] min-w-0 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 2xl:px-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
