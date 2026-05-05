import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/views/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/views/components/ui/dropdown-menu';

export const PublicTopbar: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-[65px] flex items-center px-4 sm:px-16 border-b border-border shadow-sm">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm tracking-wide">
          SS
        </div>
        <span className="hidden sm:block text-primary text-[22px] font-semibold leading-none tracking-tight">
          SmartStay
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden lg:flex items-center ml-8 gap-1">
        <Link
          to="/listings"
          className="text-primary font-medium px-4 py-3 rounded-xl hover:bg-primary/10 transition-colors text-[16px]"
        >
          Tìm phòng
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-primary font-medium px-4 py-3 rounded-xl hover:bg-primary/10 transition-colors text-[16px]">
              Dành cho chủ nhà
              <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px] rounded-xl p-2 z-50">
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
              <Link to="/login?intent=owner" className="w-full font-medium text-primary py-2 px-3">
                Đăng nhập chủ nhà
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
              <Link to="/public/register?role=owner" className="w-full font-medium text-primary py-2 px-3">
                Đăng ký tài khoản
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Login */}
      <div className="ml-auto hidden lg:flex items-center gap-3">
        <Button variant="outline" asChild className="rounded-xl h-10 text-[16px] font-medium border-primary/20 text-primary hover:bg-primary/10">
          <Link to="/public/register">Đăng ký</Link>
        </Button>
        <Button asChild className="rounded-xl h-10 text-[16px] font-medium">
          <Link to="/login">Đăng nhập</Link>
        </Button>
      </div>

      {/* Mobile: hamburger */}
      <button
        className="ml-auto lg:hidden p-2 text-primary"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu */}
      <div
        className={cn(
          'absolute top-[65px] inset-x-0 bg-background border-t border-border px-4 py-3 space-y-2 shadow-md lg:hidden transition-all duration-200 overflow-hidden',
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        )}
      >
        <Link
          to="/listings"
          className="block py-3 px-4 text-primary font-medium rounded-xl hover:bg-primary/10 transition-colors"
        >
          Tìm phòng
        </Link>
        <Link
          to="/login?intent=owner"
          className="block py-3 px-4 text-primary font-medium rounded-xl hover:bg-primary/10 transition-colors"
        >
          Dành cho chủ nhà
        </Link>
        <Link
          to="/public/register"
          className="block py-3 px-4 text-primary font-medium rounded-xl hover:bg-primary/10 transition-colors"
        >
          Đăng ký
        </Link>
        <Link
          to="/login"
          className="block py-3 px-4 bg-primary text-primary-foreground font-medium rounded-xl text-center hover:bg-primary/90"
        >
          Đăng nhập
        </Link>
      </div>
    </nav>
  );
};

