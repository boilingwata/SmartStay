import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, RefreshCcw, Smartphone, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import useAuthStore from '@/stores/authStore';
import { getPostLoginRedirect, getAuthenticatedHomePath } from '@/lib/authRouting';

const PortalLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const loginAuth = useAuthStore(state => state.login);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);

  const requestedRedirect =
    searchParams.get('redirect') ??
    ((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? null);

  // Redirect if already logged in as a Tenant
  useEffect(() => {
    if (isAuthenticated && user?.role === 'Tenant') {
      navigate(getAuthenticatedHomePath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setInterval(() => setLockoutTimer(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTimer]);

  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isPhone = (val: string) => /^[0-9+]{10,12}$/.test(val);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      toast.error(`Tài khoản bị khoá ${Math.ceil(lockoutTimer / 60)} phút`);
      return;
    }

    if (password.length < 6) {
      toast.error('Mật khẩu mẫu yêu cầu tối thiểu 6 ký tự');
      return;
    }
    
    setLoading(true);
    try {
      await loginAuth(identifier, password, {
        allowedRoles: ['Tenant'],
        invalidRoleMessage: 'Tài khoản này không thuộc Cổng Cư dân. Vui lòng dùng trang quản trị.',
      });
      toast.success('Chào mừng trở lại!');
      navigate(getPostLoginRedirect(useAuthStore.getState().user, requestedRedirect), { replace: true });
    } catch (error: any) {
      const message = error?.message || 'Tài khoản hoặc mật khẩu không chính xác';
      toast.error(message);
    } finally {
      setLoading(false);
    }

  };

  const setQuickLogin = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    toast.info('Đã chọn tài khoản mẫu');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      
      {/* LEFT SIDE: BRANDING & VISUALS (Match Admin Layout) */}
      <div className="hidden lg:flex lg:w-1/2 p-20 flex-col justify-between text-white relative transition-colors duration-700 bg-gradient-to-br from-secondary to-[#0F766E]">
        <div className="absolute inset-0 opacity-[0.03]" style={{ 
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px' 
        }}></div>

        
        <div className="relative z-10">
          <Link to="/" className="text-3xl font-display font-bold tracking-tighter hover:opacity-80 transition-opacity">
            SmartStay <span className="text-accent underline decoration-accent/40 decoration-4 underline-offset-8">PORTAL</span>
          </Link>
          
          <div className="mt-20 space-y-10">
            <h1 className="text-[64px] font-display font-black leading-tight animate-in slide-in-from-left-6 duration-700 uppercase italic">
              KẾT NỐI <br /> 
              <span className="text-accent not-italic">CƯ DÂN</span>
            </h1>
            <p className="text-xl text-white/70 max-w-md leading-relaxed animate-in slide-in-from-left-8 duration-700 delay-100 italic">
              Nâng tầm trải nghiệm sống với nền tảng quản lý căn hộ thông minh. Thanh toán - Phản ánh - Thông báo chỉ trong một lần chạm.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-small font-black text-white/50 animate-in fade-in duration-1000 delay-300 uppercase tracking-[0.3em]">
          <Smartphone size={24} className="text-accent" />
          <span>Multilingual Smart Gateway v2.8</span>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-20 bg-bg transition-colors duration-500">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-500">
          
          {/* Logo mobile-only */}
          <div className="lg:hidden text-center mb-10">
            <Link to="/" className="text-3xl font-display font-bold tracking-tighter text-secondary">
              SmartStay <span className="text-accent">Portal</span>
            </Link>
          </div>

          <div className="card-container p-10 bg-white shadow-modal border-none rounded-[40px]">
            <header className="mb-10 text-center lg:text-left">
              <h2 className="text-h1 text-secondary uppercase tracking-tight italic">Cổng Cư Dân</h2>
              <p className="text-body text-muted mt-2">Dành cho cư dân và người thuê căn hộ</p>
            </header>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Identifier */}
              <div className="space-y-2 text-left">
                <label className="text-label text-text-secondary block uppercase tracking-widest font-black ml-1">Số điện thoại / Email</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary transition-colors transition-all duration-300">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    autoFocus
                    placeholder="Nhập SĐT hoặc Email..."
                    className="w-full pl-12 pr-4 py-4 border rounded-2xl outline-none transition-all text-body focus:ring-secondary/20 focus:border-secondary font-bold"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-label text-text-secondary block uppercase tracking-widest font-black ml-1">Mật khẩu</label>
                  <Link to="/portal/forgot-password" title="Quên mật khẩu?" className="text-small font-bold text-secondary hover:underline uppercase tracking-widest decoration-2 underline-offset-4">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-secondary transition-colors transition-all duration-300">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 border rounded-2xl outline-none transition-all text-body focus:ring-secondary/20 focus:border-secondary font-bold"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center px-1">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-lg border-gray-300 text-secondary focus:ring-secondary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-body font-bold text-muted uppercase tracking-widest text-[11px]">Ghi nhớ đăng nhập</span>
                </label>
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                disabled={loading || lockoutTimer > 0}
                className="w-full py-5 bg-secondary hover:bg-secondary-light text-white rounded-[24px] font-black text-lg transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-[0.2em] italic"
              >
                {loading ? (
                  <RefreshCcw className="animate-spin" size={20} />
                ) : lockoutTimer > 0 ? (
                  `BỊ KHOÁ (${lockoutTimer}s)`
                ) : (
                  <>ĐĂNG NHẬP NGAY <ArrowRight className="group-hover:translate-x-2 transition-transform shadow-accent" size={20} /></>
                )}
              </button>
            </form>

            {/* Quick Access Section — only visible in development */}
            {import.meta.env.DEV && (
            <div className="mt-10 pt-10 border-t border-slate-100 animate-in fade-in duration-1000">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-6 italic">Gợi ý truy cập (Dev)</p>

               <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setQuickLogin('tenant@smartstay.vn', 'Tenant@123456')}
                    className="flex flex-col items-center p-4 rounded-2xl bg-bg border-none hover:bg-secondary hover:text-white transition-all group shadow-sm active:scale-95"
                  >
                     <span className="text-[11px] font-black uppercase tracking-tighter">Cư dân Mới</span>
                     <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">P.405</span>
                  </button>
               </div>
            </div>
            )}

            <div className="mt-10 pt-10 border-t text-center space-y-4">
              <p className="text-small text-muted font-bold uppercase tracking-widest">
                Bạn là Quản trị viên? <br />
                <Link to="/public/login" className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors mt-2 font-black border-b-2 border-primary/20 hover:border-primary">
                  <ArrowLeft size={16} /> Quay lại trang Quản trị
                </Link>
              </p>
            </div>
          </div>

          <footer className="mt-8 text-center text-small text-muted flex items-center justify-center gap-8 opacity-40 font-black tracking-widest">
            <span className="hover:text-text cursor-pointer">PRIVACY</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span className="hover:text-text cursor-pointer">COMPLIANCE</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span className="hover:text-text cursor-pointer">SUPPORT</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PortalLogin;

