import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import useAuthStore from '@/stores/authStore';
import { getPostLoginRedirect } from '@/lib/authRouting';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const login = useAuthStore(state => state.login);
  const requestedRedirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Supabase auth user
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName, phone: formData.phone, role: 'tenant' },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Đăng ký thất bại');

      // 2. Update the auto-created profile row with prospect details
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: formData.fullName,
        phone: formData.phone || null,
        role: 'tenant' as const,
        tenant_stage: 'prospect' as const,
        is_active: true,
      }, {
        onConflict: 'id',
      });

      // 3. Auto-login — works when Supabase email confirmation is disabled
      await login(formData.email, formData.password);
      toast.success('Đăng ký thành công! Chào mừng đến SmartStay!');
      navigate(getPostLoginRedirect(useAuthStore.getState().user, requestedRedirect));
    } catch (error: any) {
      // If auto-login fails because email confirmation is still enabled,
      // redirect to login so the user can sign in after verifying.
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        toast.info('Vui lòng kiểm tra email để xác thực tài khoản, sau đó đăng nhập.');
        navigate(requestedRedirect ? `/login?redirect=${encodeURIComponent(requestedRedirect)}` : '/login');
      } else {
        toast.error(error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row overflow-hidden">
      {/* Left side: Hero/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform [transition-duration:10000ms]" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
        
        <div className="relative z-10 p-20 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                <Building2 size={24} className="text-primary" />
              </div>
              <span className="text-white text-3xl font-black tracking-tighter uppercase italic">SmartStay</span>
            </div>
            <h2 className="text-white text-6xl font-black leading-[1.1] mb-8 animate-in slide-in-from-left duration-700">
              Kiến tạo <br />
              <span className="text-accent italic">Không gian</span> <br />
              Sống Hiện đại.
            </h2>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Giải pháp quản lý cư dân và vận hành tòa nhà thông minh nhất Đông Nam Á. Đăng ký ngay để trải nghiệm đẳng cấp sống mới.
            </p>
          </div>

          <div className="space-y-4">
             <div className="flex -space-x-3 mb-4">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shadow-lg">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="w-full h-full object-cover" />
                 </div>
               ))}
               <div className="w-10 h-10 rounded-full bg-accent border-2 border-primary flex items-center justify-center text-primary font-bold text-xs shadow-lg">
                 +1k
               </div>
             </div>
             <p className="text-white/60 text-small font-medium">Hơn 1,000+ quản lý và cư dân đang sử dụng hàng ngày.</p>
          </div>
        </div>
        
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-[120px]" />
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col p-6 lg:p-20 overflow-y-auto custom-scrollbar relative">
        <div className="max-w-md w-full mx-auto space-y-10 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-muted hover:text-primary font-bold transition-colors group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            <span>Quay lại</span>
          </Link>

          <div className="space-y-3">
            <h1 className="text-display text-4xl text-primary font-black">Bắt đầu hành trình</h1>
            <p className="text-body text-muted leading-relaxed">Chỉ mất 1 phút để khởi tạo tài khoản mới của bạn.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-small font-bold text-primary/60 uppercase tracking-widest pl-1">Họ và tên</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    required
                    className="input-base w-full pl-12 h-14 font-bold"
                    placeholder="Nguyễn Văn A" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-small font-bold text-primary/60 uppercase tracking-widest pl-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="email" 
                      required
                      className="input-base w-full pl-12 h-14 font-bold text-small"
                      placeholder="nva@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-small font-bold text-primary/60 uppercase tracking-widest pl-1">SĐT</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="tel" 
                      required
                      className="input-base w-full pl-12 h-14 font-bold text-small"
                      placeholder="098..." 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-small font-bold text-primary/60 uppercase tracking-widest pl-1">Mật khẩu</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      className="input-base w-full pl-12 h-14 font-bold"
                      placeholder="••••••••" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-small font-bold text-primary/60 uppercase tracking-widest pl-1">Xác nhận</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      className="input-base w-full pl-12 h-14 font-bold"
                      placeholder="••••••••" 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
               <div className={cn(
                 "mt-1 w-5 h-5 rounded border-2 transition-all flex items-center justify-center shrink-0",
                 formData.agreeTerms ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white border-border group-hover:border-primary/30"
               )}>
                 {formData.agreeTerms && <ShieldCheck size={14} className="text-white" />}
               </div>
               <input 
                type="checkbox" 
                className="hidden" 
                required 
                checked={formData.agreeTerms}
                onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
               />
               <span className="text-xs text-muted leading-relaxed font-bold">
                 Tôi đồng ý với <Link to="/terms" className="text-primary underline underline-offset-2">Điều khoản sử dụng</Link> và <Link to="/privacy" className="text-primary underline underline-offset-2">Chính sách bảo mật</Link> của SmartStay.
               </span>
            </label>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full h-16 flex items-center justify-center gap-3 text-lg font-black shadow-2xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký ngay</span>
                  <ArrowRight size={24} />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 text-center">
            <p className="text-body text-muted font-bold">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary underline underline-offset-4 decoration-2 decoration-primary/30 hover:decoration-primary transition-all">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none" />
      </div>
    </div>
  );
};

export default RegisterPage;
