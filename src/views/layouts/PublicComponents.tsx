import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import { cn } from '@/utils';

export const PublicTopbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Listings', href: '/listings', isRoute: true },
    { name: 'Features', href: '#features', isRoute: false },
    { name: 'Pricing', href: '#pricing', isRoute: false },
    { name: 'About', href: '#about', isRoute: false },
    { name: 'FAQ', href: '#faq', isRoute: false },
  ];

  const useSolidSurface = isScrolled || location.pathname !== '/';

  return (
    <nav
      className={cn(
        'fixed top-0 z-50 w-full transition-all duration-300',
        useSolidSurface ? 'bg-white/80 py-3 shadow-md backdrop-blur-md' : 'bg-transparent py-5'
      )}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span
            className={cn(
              'text-2xl font-display font-bold tracking-tighter transition-colors',
              useSolidSurface ? 'text-primary' : 'text-white'
            )}
          >
            SmartStay <span className="text-accent">BMS</span>
          </span>
        </Link>

        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  'text-body font-medium transition-colors hover:text-accent',
                  useSolidSurface ? 'text-text' : 'text-white/90'
                )}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  'text-body font-medium transition-colors hover:text-accent',
                  useSolidSurface ? 'text-text' : 'text-white/90'
                )}
              >
                {link.name}
              </a>
            )
          )}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link
            to="/login"
            className={cn(
              'rounded-md border px-5 py-2 text-sm font-bold transition-all',
              useSolidSurface
                ? 'border-primary text-primary hover:bg-primary/5'
                : 'border-white/30 text-white hover:bg-white/10'
            )}
          >
            Đăng nhập
          </Link>
          <Link
            to="/public/register"
            className="rounded-md bg-accent px-6 py-2 text-sm font-bold text-white transition-transform hover:scale-105"
          >
            Create account
          </Link>
        </div>

        <button
          className={cn('p-2 lg:hidden', useSolidSurface ? 'text-primary' : 'text-white')}
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div
        className={cn(
          'absolute left-0 top-full w-full overflow-hidden bg-white shadow-xl transition-all duration-300 lg:hidden',
          mobileMenuOpen ? 'max-h-[500px] border-t' : 'max-h-0'
        )}
      >
        <div className="flex flex-col gap-6 p-6">
          {navLinks.map((link) =>
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className="text-h3 text-text"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="text-h3 text-text"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            )
          )}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <Link to="/login" className="btn-primary border bg-bg text-center text-primary">
              Đăng nhập
            </Link>
            <Link to="/public/register" className="btn-primary text-center">
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const PublicFooter = () => (
  <footer className="bg-[#1A1A2E] pb-10 pt-20 text-white">
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 border-b border-white/10 px-6 pb-16 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-6">
        <h2 className="text-2xl font-display font-bold tracking-tighter">
          SmartStay <span className="text-accent">BMS</span>
        </h2>
        <p className="text-body leading-relaxed text-white/60">
          A hybrid property platform for public discovery, resident activation, and day-to-day building operations.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/5 transition-all hover:bg-accent hover:text-white">F</div>
          <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/5 transition-all hover:bg-accent hover:text-white">L</div>
          <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/5 transition-all hover:bg-accent hover:text-white">Y</div>
        </div>
      </div>

      <div>
        <h4 className="text-h3 mb-8">Product</h4>
        <ul className="space-y-4 text-body text-white/50">
          <li><Link to="/listings" className="hover:text-accent">Listings</Link></li>
          <li className="cursor-pointer hover:text-accent">Resident portal</li>
          <li className="cursor-pointer hover:text-accent">Billing automation</li>
          <li className="cursor-pointer hover:text-accent">Operations workspace</li>
        </ul>
      </div>

      <div>
        <h4 className="text-h3 mb-8">Company</h4>
        <ul className="space-y-4 text-body text-white/50">
          <li className="cursor-pointer hover:text-accent">About us</li>
          <li className="cursor-pointer hover:text-accent">Careers</li>
          <li className="cursor-pointer hover:text-accent">Press</li>
          <li className="cursor-pointer hover:text-accent">Partners</li>
        </ul>
      </div>

      <div>
        <h4 className="text-h3 mb-8">Contact</h4>
        <ul className="space-y-4 text-body text-white/50">
          <li>Hotline: 1900 88xx</li>
          <li>Email: hello@smartstay.vn</li>
          <li>Address: Floor 25, Keangnam Landmark 72, Hanoi</li>
          <li className="flex items-center gap-2 pt-4">
            <Globe size={16} />
            <select className="cursor-pointer border-none bg-transparent text-white/80 outline-none focus:ring-0">
              <option value="vi" className="bg-[#1A1A2E]">Vietnamese</option>
              <option value="en" className="bg-[#1A1A2E]">English</option>
            </select>
          </li>
        </ul>
      </div>
    </div>
    <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 pt-10 text-small text-white/30 md:flex-row">
      <p>© 2026 SmartStay BMS. All rights reserved.</p>
      <div className="flex gap-8">
        <span>Privacy policy</span>
        <span>Terms of service</span>
      </div>
    </div>
  </footer>
);
