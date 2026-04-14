import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import useUIStore from '@/stores/uiStore'
import { cn } from '@/utils'

const StaffLayout: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#F3FBFA] text-foreground transition-colors duration-300">
      <div
        className={cn(
          'hidden lg:block border-r border-teal-100 bg-white/90 backdrop-blur',
          sidebarOpen ? 'w-[260px]' : 'w-[72px]'
        )}
      >
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="w-[260px] relative z-10 animate-in slide-in-from-left duration-300 bg-white">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        <div className="border-b border-teal-100 bg-[linear-gradient(135deg,#0f766e_0%,#134e4a_100%)] text-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-5 md:px-8 lg:px-12 py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-teal-100/70">Staff Workspace</p>
            <h1 className="text-2xl font-black tracking-tight mt-2">Vận hành hiện trường và xử lý ticket</h1>
          </div>
        </div>

        <main className="flex-1 overflow-auto animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="max-w-[1280px] mx-auto p-4 sm:p-5 md:p-8 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
