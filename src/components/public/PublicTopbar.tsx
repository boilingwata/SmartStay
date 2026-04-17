import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/utils';

export const PublicTopbar: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
    setOwnerOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-[#e8f5f1] h-[65px] flex items-center px-4 sm:px-16 shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-[#0a5547] flex items-center justify-center text-white font-black text-sm tracking-wide">
          SS
        </div>
        <span className="hidden sm:block text-[#0a5547] text-[22px] font-semibold leading-none tracking-tight">
          SmartStay
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden lg:flex items-center ml-8 gap-1">
        <Link
          to="/listings"
          className="text-[#0d6b5a] font-bold px-4 py-3 rounded-xl hover:bg-[#0d6b5a]/10 transition-colors text-[16px]"
        >
          Tìm phòng
        </Link>

        <div className="relative">
          <button
            onClick={() => setOwnerOpen((o) => !o)}
            className="flex items-center gap-2 text-[#0d6b5a] font-bold px-4 py-3 rounded-xl hover:bg-[#0d6b5a]/10 transition-colors text-[16px]"
          >
            Dành cho chủ nhà
            <ChevronDown size={12} className={cn('transition-transform duration-200', ownerOpen && 'rotate-180')} />
          </button>
          {ownerOpen && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setOwnerOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-[220px] bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                <Link
                  to="/login?intent=owner"
                  onClick={() => setOwnerOpen(false)}
                  className="block px-4 py-3 text-sm text-[#0d6b5a] hover:bg-[#e8f5f1] font-medium transition-colors"
                >
                  Đăng nhập chủ nhà
                </Link>
                <Link
                  to="/public/register?role=owner"
                  onClick={() => setOwnerOpen(false)}
                  className="block px-4 py-3 text-sm text-[#0d6b5a] hover:bg-[#e8f5f1] font-medium transition-colors"
                >
                  Đăng ký tài khoản
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop: Login */}
      <div className="ml-auto hidden lg:flex items-center">
        <Link
          to="/login"
          className="bg-[#0a5547] text-white px-4 h-10 rounded-xl font-medium text-[16px] flex items-center hover:bg-[#083f35] transition-colors"
        >
          Đăng nhập
        </Link>
      </div>

      {/* Mobile: hamburger */}
      <button
        className="ml-auto lg:hidden p-2 text-[#0d6b5a]"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      <div
        className={cn(
          'absolute top-[65px] inset-x-0 bg-[#e8f5f1] border-t border-[#0d6b5a]/10 px-4 py-3 space-y-1 shadow-md lg:hidden transition-all duration-200 overflow-hidden',
          mobileOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <Link
          to="/listings"
          className="block py-3 px-4 text-[#0d6b5a] font-bold rounded-xl hover:bg-white/50 transition-colors"
        >
          Tìm phòng
        </Link>
        <Link
          to="/login?intent=owner"
          className="block py-3 px-4 text-[#0d6b5a] font-bold rounded-xl hover:bg-white/50 transition-colors"
        >
          Dành cho chủ nhà
        </Link>
        <Link
          to="/login"
          className="block py-3 px-4 bg-[#0a5547] text-white font-medium rounded-xl text-center"
        >
          Đăng nhập
        </Link>
      </div>
    </nav>
  );
};
