import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User as UserIcon, 
  MapPin, 
  ChevronRight,
  Camera,
  Bell,
  MessageSquare,
  Globe,
  LogOut,
  Plus,
  Trash2,
  Lock,
  Loader2,
  Phone,
  Settings,
  ShieldCheck,
  CreditCard,
  History,
  Info as InfoIcon,
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Fingerprint,
  QrCode,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import portalProfileService from '@/services/portalProfileService';
import { cn, formatVND } from '@/utils';
import useAuthStore from '@/stores/authStore';
import { useConfirm } from '@/hooks/useConfirm';
import { BottomSheet } from '@/components/portal/BottomSheet';
import { PasswordStrengthMeter } from '@/components/shared';
import PortalLayout from '@/components/layout/PortalLayout';

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, setUser, logout: authLogout } = useAuthStore();
  const { confirm } = useConfirm();
  const { i18n } = useTranslation();
  
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const sheetParam = searchParams.get('sheet');
  const fromOnboarding = searchParams.get('from') === 'onboarding';

  useEffect(() => {
    if (sheetParam) {
      setActiveSheet(sheetParam);
    }
  }, [sheetParam]);

  const closeActiveSheet = () => {
    setActiveSheet(null);
    if (!searchParams.get('sheet')) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('sheet');
    setSearchParams(nextParams);
  };

  // 1. Fetch Profile Details
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['portal-profile-detail'],
    queryFn: () => portalProfileService.getProfile()
  });

  // Actions
  const handleLogout = async () => {
    const ok = await confirm({
      title: "Xác nhận đăng xuất?",
      description: "Hệ thống sẽ kết thúc phiên làm việc của bạn ngay lập tức để bảo vệ dữ liệu cá nhân.",
      confirmLabel: "ĐĂNG XUẤT NGAY",
      cancelLabel: "QUAY LẠI",
      variant: "danger"
    });

    if (ok) {
        await authLogout();
        navigate('/login', { replace: true });
        toast.success('Đã đăng xuất an toàn.');
    }
  };

  const updateAvatarMutation = useMutation({
    mutationFn: (file: File) => portalProfileService.updateAvatar(file),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['portal-profile-detail'] });
      if (user) {
        // Update local store avatar
        setUser({ ...user, avatar: res.data.avatarUrl });
      }
      toast.success('Đã cập nhật ảnh đại diện');
    }
  });

  const language = i18n.language === 'en' ? 'English' : 'Tiếng Việt';

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('lang', nextLang);
    toast.success(`Đã chuyển sang ${nextLang === 'vi' ? 'Tiếng Việt' : 'English'}`);
  };

  return (
    <>
    <div className={cn(
      'min-h-screen bg-slate-50 relative overflow-x-hidden animate-in fade-in slide-in-from-right-6 duration-700',
      fromOnboarding && 'lg:max-w-[1100px] lg:mx-auto lg:px-8 lg:pb-10'
    )}>
        {/* 1. Lush High-End Premium Banner */}
        
        {/* 1. Lush High-End Premium Banner */}
        <div className="bg-[#0D8A8A] pt-12 pb-28 px-8 rounded-b-[48px] shadow-2xl shadow-[#0D8A8A]/10 relative overflow-hidden">
           <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse" />
           <div className="absolute bottom-[-15%] right-[-10%] w-56 h-56 bg-teal-400/10 rounded-full blur-2xl" />

           <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="relative group">
                 <div className="w-36 h-36 rounded-[44px] p-2 bg-gradient-to-tr from-teal-300/30 to-white/20 shadow-2xl relative transition-transform duration-700 group-hover:rotate-6">
                    <div className="w-full h-full rounded-[36px] overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 shadow-inner group-hover:scale-[1.02] transition-transform">
                        {profile?.avatar || user?.avatar ? (
                          <img src={profile?.avatar || user?.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-teal-500/20 text-white opacity-80 italic font-black text-4xl">
                             {user?.fullName?.charAt(0) || 'S'}
                          </div>
                        )}
                    </div>
                 </div>
                 <label className="absolute -bottom-1 -right-1 w-12 h-12 bg-white text-[var(--portal-primary)] rounded-[20px] flex items-center justify-center shadow-2xl border border-slate-100 cursor-pointer active:scale-90 transition-all hover:bg-teal-50 hover:shadow-[var(--portal-primary)]/20">
                    <Camera size={24} strokeWidth={2.5} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => e.target.files?.[0] && updateAvatarMutation.mutate(e.target.files[0])} 
                    />
                 </label>
              </div>

              <div className="text-center space-y-3">
                 <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-sm uppercase">
                   {profile?.fullName || user?.fullName || 'Cư dân SmartStay'}
                 </h2>
                 <div className="flex flex-col items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                       <MapPin size={14} className="text-teal-300" />
                       <span className="text-[11px] font-black text-white uppercase tracking-widest">{profile?.roomCode || '--'} • {profile?.buildingName || 'Hệ thống'}</span>
                    </div>
                     <div className="flex items-center gap-2 opacity-80">
                       <ShieldCheck size={12} className="text-teal-200" />
                       <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Tài khoản đã định danh (Verified)</span>
                     </div>
                 </div>
              </div>
           </div>
           
           <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 opacity-5 rotate-12 pointer-events-none">
              <UserIcon size={300} className="text-white" />
           </div>
      </div>
 
        {/* 2. Overlapping Tactical Hub (Overlap) */}
        <div className="px-6 -mt-12 relative z-20 pb-40 space-y-10">
           {fromOnboarding && (
             <button
               onClick={() => navigate('/portal/onboarding')}
               className="w-full h-14 bg-white text-[var(--portal-primary)] rounded-[28px] font-black shadow-xl shadow-slate-200/40 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[11px] border border-slate-100 active:scale-[0.98] transition-all"
             >
               <ArrowLeft size={18} />
               Back to onboarding
             </button>
           )}
           
           {/* Section: Quick Digital Identity */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[32px] p-5 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-3 group active:scale-[0.98] transition-all" onClick={() => setActiveSheet('qr')}>
                 <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[var(--portal-primary)] flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                    <QrCode size={24} strokeWidth={2.5} />
                 </div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Pass</span>
              </div>
              <div className="bg-white rounded-[32px] p-5 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-3 group active:scale-[0.98] transition-all" onClick={() => navigate('/portal/profile')}>
                 <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                    <History size={24} strokeWidth={2.5} />
                 </div>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Hành trình</span>
              </div>
           </div>

           {/* Preference Cluster: Account Security */}
           <div className="space-y-4 text-left">
              <div className="px-4 flex items-center justify-between">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Thiết lập bảo mật</h3>
                 <ShieldAlert size={14} className="text-red-400 opacity-50" />
              </div>
              <div className="bg-white rounded-[44px] p-3 shadow-2xl shadow-slate-200/40 border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                 <MenuButton icon={Smartphone} label="Hồ sơ định danh" sub="Đã đồng bộ v1.2" onClick={() => setActiveSheet('personal')} color="text-[var(--portal-primary)]" />
                 <MenuButton icon={Fingerprint} label="Khóa vân tay / FaceID" sub="Đang tắt" onClick={() => toast.info('Tính năng đang phát triển')} color="text-blue-500" />
                 <MenuButton icon={ShieldCheck} label="Bảo mật 2 lớp (2FA)" sub="Kích hoạt ngay" onClick={() => setActiveSheet('security')} color="text-amber-500" />
                 <MenuButton icon={Lock} label="Thay đổi mật khẩu" sub="Lớp bảo vệ Secure+" onClick={() => setActiveSheet('security')} color="text-indigo-500" />
              </div>
           </div>

           {/* Preference Cluster: App settings */}
           <div className="space-y-4 text-left">
              <div className="px-4 flex items-center justify-between">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Ứng dụng & Trợ giúp</h3>
                 <Sparkles size={14} className="text-teal-400 opacity-50" />
              </div>
              <div className="bg-white rounded-[44px] p-3 shadow-2xl shadow-slate-200/40 border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                 <MenuButton icon={Bell} label="Tùy chọn thông báo" sub="App, SMS, Email" onClick={() => setActiveSheet('notifications')} color="text-[var(--portal-primary)]" />
                 <MenuButton icon={Globe} label="Ngôn ngữ hiện tại" sub={language} onClick={toggleLanguage} color="text-emerald-500" />
                  <MenuButton icon={HelpCircle} label="Trung tâm trợ giúp" sub="Câu hỏi thường gặp" onClick={() => setActiveSheet('feedback')} color="text-rose-600" />
                  <MenuButton icon={InfoIcon} label="Về SmartLife Resident" sub="Phiên bản v2.5.8 Build 99" onClick={() => setActiveSheet('about')} color="text-slate-600" />
              </div>
           </div>

           {/* Logout Strategy Layer */}
           <div className="pt-6">
              <button 
                onClick={handleLogout}
                className="w-full h-[72px] bg-white border-2 border-red-100 text-red-600 rounded-[32px] font-black shadow-2xl shadow-red-500/5 flex items-center justify-center gap-4 active:scale-[0.98] active:bg-red-50 transition-all uppercase tracking-[0.3em] text-[11px]"

              >
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                   <LogOut size={22} strokeWidth={3} />
                </div>
                KẾT THÚC PHIÊN LÀM VIỆC
              </button>
              
              <div className="mt-14 flex flex-col items-center gap-3 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000">
                 <ShieldCheck size={26} className="text-teal-600" />
                 <div className="space-y-1 text-center">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em]">Integrated Protection Protocol</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">SmartStay Secured Endpoint • ID-G99F-X1</p>
                 </div>
            </div>
         </div>
      </div>
 
       {/* --- PREMIUM BOTTOM SHEETS --- */}
      
      {/* Personal Info Sheet */}
      <BottomSheet isOpen={activeSheet === 'personal'} onClose={closeActiveSheet} title="Định danh cư dân">
        <PersonalInfoForm profile={profile} onClose={closeActiveSheet} />
      </BottomSheet>

      {/* Security Hub Sheet */}
      <BottomSheet isOpen={activeSheet === 'security'} onClose={closeActiveSheet} title="Trung tâm bảo mật">
        <SecuritySettings onClose={closeActiveSheet} />
      </BottomSheet>

      {/* Feedback Sheet */}
      <BottomSheet isOpen={activeSheet === 'feedback'} onClose={closeActiveSheet} title="Góp ý trải nghiệm">
        <FeedbackForm onClose={closeActiveSheet} />
      </BottomSheet>

      {/* Notifications Sheet */}
      <BottomSheet isOpen={activeSheet === 'notifications'} onClose={closeActiveSheet} title="Kênh thông báo">
        <NotificationPrefs profile={profile} />
      </BottomSheet>

      {/* Digital Pass Sheet */}
      <BottomSheet isOpen={activeSheet === 'qr'} onClose={() => setActiveSheet(null)} title="Mã cư dân định danh">
         <div className="pb-10 pt-4 flex flex-col items-center gap-8 text-center animate-in zoom-in-95 duration-500">
            <div className="p-8 bg-slate-50 rounded-[48px] border-2 border-slate-100 shadow-inner relative group">
               <div className="absolute inset-0 bg-teal-500/5 rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-56 h-56 bg-white rounded-3xl p-6 shadow-2xl flex items-center justify-center relative z-10">
                  <QrCode size={200} strokeWidth={1} className={cn(loadingProfile ? "opacity-10 animate-pulse" : "opacity-100 text-slate-800")} />
               </div>
            </div>
            <div className="space-y-3 px-8 text-left">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Mã định danh đang hoạt động</span>
               </div>
               <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none italic">SMR-RES-2024-{user?.id || 'X'}</h4>
               <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed tracking-wider opacity-60">Sử dụng mã này để check-in tại quầy lễ tân hoặc các khu vực tiện ích cao cấp.</p>
            </div>
            <button 
              onClick={() => setActiveSheet(null)}
              className="w-full h-16 bg-[var(--portal-primary)] text-white rounded-[28px] font-black text-sm shadow-2xl shadow-[var(--portal-primary)]/30 uppercase tracking-[0.2em] active:scale-95 transition-all border-none"
            >
               HOÀN TẤT XÁC THỰC
            </button>
         </div>
      </BottomSheet>

      {/* About Sheet */}
      <BottomSheet isOpen={activeSheet === 'about'} onClose={() => setActiveSheet(null)} title="Hệ sinh thái SmartStay">
        <div className="space-y-10 pb-10 text-center animate-in fade-in duration-700 pt-6">
           <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-teal-500/10 rounded-[32px] rotate-6 animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-[32px] border-2 border-teal-50 flex items-center justify-center text-[var(--portal-primary)] shadow-2xl">
                 <Smartphone size={56} strokeWidth={1} className="animate-bounce-slow" />
              </div>
           </div>
           <div className="space-y-3">
              <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">SmartStay v2.5.8</h4>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed px-12 uppercase tracking-widest opacity-60 italic">
                Sản phẩm trí tuệ của SmartStay Infrastructure JSC. Giải pháp vận hành tòa nhà thông minh hàng đầu khu vực.
              </p>
           </div>
           <div className="grid grid-cols-1 divide-y divide-slate-100 border-2 border-slate-50 rounded-[40px] bg-slate-50/50 overflow-hidden mx-2">
              <AboutRow label="ID Phiên bản" value="SMR-2024-BUILD-99" />
              <AboutRow label="Hạng định danh" value="Premium Resident" />
              <AboutRow label="Mã hóa dữ liệu" value="256-bit AES" />
              <AboutRow label="Pháp lý & Bảo mật" value="Bản quyền 2024" infoOnly />
           </div>
        </div>
      </BottomSheet>
    </div>
    </>
  );
};

const MenuButton = ({ icon: Icon, label, sub, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="w-full min-h-[82px] px-5 flex items-center justify-between group active:bg-slate-50/50 transition-all rounded-[32px]"
  >
    <div className="flex items-center gap-5">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100 group-active:scale-90 transition-transform shadow-inner", color)}>
        <Icon size={26} strokeWidth={1.5} />
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none group-hover:text-[var(--portal-primary)] transition-colors">{label}</span>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none group-hover:text-[var(--portal-primary)] transition-all italic">{sub}</span>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 group-active:translate-x-1 group-hover:text-[var(--portal-primary)] group-hover:bg-white group-hover:shadow-lg transition-all">
       <ChevronRight size={20} strokeWidth={3} />
    </div>
  </button>
);

const AboutRow = ({ label, value, infoOnly }: any) => (
  <div className="py-5 px-8 text-left flex justify-between items-center bg-white group hover:bg-slate-50 transition-all">
     <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
     <span className={cn("text-[11px] font-black uppercase tracking-tighter truncate max-w-[150px]", infoOnly ? "text-[var(--portal-primary)] underline cursor-pointer" : "text-slate-800")}>{value}</span>
  </div>
);

const PersonalInfoForm = ({ profile, onClose }: any) => {
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    phone: profile?.phone || '',
    email: profile?.email || ''
  });

  const mutation = useMutation({
    mutationFn: (data: any) => portalProfileService.updateProfile(data),
    onSuccess: () => {
      toast.success('Hồ sơ định danh đã được cập nhật.');
      onClose();
    }
  });

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500 text-left pt-4">
       <div className="space-y-6">
          <InputGroup icon={UserIcon} label="Họ tên cư dân định danh" value={formData.fullName} onChange={(v: string) => setFormData({...formData, fullName: v})} placeholder="HỌ VÀ TÊN" />
          <InputGroup icon={Smartphone} label="Số điện thoại bảo mật" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} placeholder="0xxx xxx xxx" />
          <InputGroup icon={InfoIcon} label="Hòm thư liên hệ chính" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} placeholder="name@domain.com" />
       </div>
       <button 
        onClick={() => mutation.mutate(formData)}
        disabled={mutation.isPending}
         className="w-full h-[72px] bg-[var(--portal-primary)] text-white rounded-[32px] font-black shadow-2xl shadow-[var(--portal-primary)]/30 flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-[0.3em] text-sm border-none"
       >
         <ShieldCheck size={24} strokeWidth={2.5} />
         {mutation.isPending ? 'Đang đồng bộ...' : 'CẬP NHẬT HỒ SƠ'}
       </button>
    </div>
  );
};

const SecuritySettings = ({ onClose }: any) => {
  const [step, setStep] = useState('menu');
  const [twoFactor, setTwoFactor] = useState(true);

  if (step === 'change-password') {
    return <ChangePasswordForm onBack={() => setStep('menu')} onComplete={onClose} />;
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-300 text-left pt-4">
       <div className="bg-white rounded-[44px] shadow-2xl shadow-slate-200/40 p-3 divide-y divide-slate-100 border-2 border-slate-50 overflow-hidden">
          <button 
            onClick={() => setStep('change-password')}
            className="w-full p-6 flex items-center justify-between group active:bg-slate-50/50 rounded-[32px] transition-all"
          >
             <div className="flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-indigo-50 shadow-inner flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform">
                  <Lock size={26} strokeWidth={1.5} />
               </div>
               <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Cài đặt mật khẩu</span>
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Cập nhật 15 ngày trước</span>
               </div>
             </div>
             <ChevronRight size={20} strokeWidth={3} className="text-slate-200 group-hover:text-[#0D8A8A] transition-colors" />
          </button>
          
          <div className="p-6 flex items-center justify-between group">
             <div className="flex items-center gap-6 text-left">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 shadow-inner flex items-center justify-center text-amber-600 border border-amber-100 group-hover:scale-110 transition-transform">
                   <ShieldCheck size={28} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Xác thực 2-Lớp (2FA)</span>
                  <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest italic">An toàn tối đa</span>
                </div>
             </div>
             <Switch active={twoFactor} onClick={() => {
                setTwoFactor(!twoFactor);
                toast.success(twoFactor ? 'Đã tắt bảo mật 2FA' : 'Đã kích hoạt bảo mật 2FA qua SMS');
             }} />
          </div>
       </div>
       
       <div className="px-6 flex items-start gap-4 opacity-40">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-1" />
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed italic">Vui lòng không cung cấp mã xác thực hoặc mật khẩu đăng nhập cho bất kỳ ai, kể cả nhân viên ban quản lý tòa nhà.</p>
       </div>
    </div>
  );
};

const ChangePasswordForm = ({ onBack, onComplete }: any) => {
  const [data, setData] = useState({ old: '', new: '', confirm: '' });
  const mutation = useMutation({
    mutationFn: (pass: any) => portalProfileService.changePassword(pass),
    onSuccess: () => {
      toast.success('Hệ thống đã cập nhật mật khẩu mới.');
      onComplete();
    }
  });

  const isValid = data.new && data.new === data.confirm && data.new.length >= 8;

  return (
    <div className="space-y-10 pb-10 animate-in slide-in-from-right-12 duration-500 text-left pt-4">
       <button onClick={onBack} className="h-12 inline-flex items-center gap-3 text-[10px] font-black text-[var(--portal-primary)] uppercase tracking-[0.2em] px-6 bg-teal-50 rounded-full active:scale-95 transition-all shadow-sm border-none">
          <ChevronRight size={16} className="rotate-180" strokeWidth={4} /> QUAY LẠI CÀI ĐẶT
       </button>
       <div className="space-y-6">
          <InputGroup icon={Lock} label="Mật khẩu đang sử dụng" type="password" value={data.old} onChange={(v: string) => setData({...data, old: v})} />
          <div className="space-y-4">
            <InputGroup icon={ShieldCheck} label="Thiết lập mật khẩu mới (Secure+)" type="password" value={data.new} onChange={(v: string) => setData({...data, new: v})} />
            <div className="px-5">
               <PasswordStrengthMeter password={data.new} />
            </div>
          </div>
          <InputGroup icon={CheckCircle} label="Xác nhận lại mật khẩu mới" type="password" value={data.confirm} onChange={(v: string) => setData({...data, confirm: v})} />
       </div>
       <button 
        disabled={mutation.isPending || !isValid}
        onClick={() => mutation.mutate({ currentPassword: data.old, newPassword: data.new })}
         className="w-full h-[72px] bg-[#0D8A8A] text-white rounded-[32px] font-black shadow-2xl shadow-teal-500/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all uppercase tracking-[0.3em] text-sm disabled:opacity-30 disabled:grayscale disabled:scale-100"
       >
         {mutation.isPending ? <Loader2 size={24} className="animate-spin" /> : <ShieldCheck size={24} strokeWidth={2.5} />}
         TÁI THIẾT LẬP MẬT MÃ
       </button>
    </div>
  );
};

const FeedbackForm = ({ onClose }: any) => {
  const [content, setContent] = useState('');
  const mutation = useMutation({
    mutationFn: (c: string) => portalProfileService.submitFeedback(c),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đồng hành cùng SmartStay!');
      onClose();
    }
  });

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500 text-left pt-4">
       <div className="space-y-5 text-center">
          <div className="relative mx-auto w-20 h-20">
             <div className="absolute inset-0 bg-rose-500/10 rounded-[28px] rotate-6 animate-pulse" />
             <div className="relative w-full h-full bg-white rounded-[28px] border-2 border-rose-50 flex items-center justify-center text-rose-500 shadow-xl">
                <MessageSquare size={36} strokeWidth={1.5} />
             </div>
          </div>
          <div className="space-y-1">
             <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Lắng nghe để vươn xa</h4>
             <p className="text-[10px] font-black text-slate-400 max-w-[280px] mx-auto leading-relaxed uppercase tracking-widest opacity-60 italic">Chúng tôi trân trọng từng ý tưởng nhỏ nhất của bạn để hoàn thiện hệ sinh thái SmartLife.</p>
          </div>
       </div>
       <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nêu cảm nhận hoặc đề xuất cải tiến của bạn cho nền tảng SmartStay..." 
        className="w-full h-56 p-10 bg-slate-50 rounded-[48px] border-2 border-slate-100 focus:bg-white focus:ring-8 focus:ring-teal-500/5 focus:border-[#0D8A8A] text-sm resize-none transition-all shadow-inner placeholder:text-slate-300 font-black text-slate-800 placeholder:font-bold italic" 
       />
       <button 
        onClick={() => mutation.mutate(content)}
        disabled={!content || mutation.isPending}
         className="w-full h-[72px] bg-[#0D8A8A] text-white rounded-[32px] font-black shadow-2xl shadow-teal-500/30 active:scale-95 transition-all uppercase tracking-[0.4em] text-xs"
       >
         {mutation.isPending ? <Loader2 size={24} className="animate-spin" /> : 'GỬI PHẢN HỒI THẦN TỐC'}
       </button>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder, type = "text", icon: Icon }: any) => (
  <div className="space-y-3 group px-1">
     <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-6 flex items-center gap-2">
        {Icon && <Icon size={12} className="text-[var(--portal-primary)] opacity-50" />} {label}
     </label>
     <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
       className="w-full h-[72px] px-10 bg-slate-50 rounded-[32px] border-2 border-slate-100 focus:bg-white focus:ring-8 focus:ring-[var(--portal-primary)]/5 focus:border-[var(--portal-primary)] text-sm transition-all shadow-sm font-black text-slate-800 uppercase tracking-tight placeholder:opacity-30 placeholder:font-normal"
     />
  </div>
);

const NotificationPrefs = ({ profile }: any) => {
  const [prefs, setPrefs] = useState({
    sms: profile?.notificationPrefs?.sms || false,
    email: profile?.notificationPrefs?.email || true,
    push: profile?.notificationPrefs?.push || true,
  });

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-300 text-left pt-4 px-2">
       <div className="bg-white rounded-[44px] shadow-2xl shadow-slate-200/40 p-3 divide-y divide-slate-50 border-2 border-slate-50">
          <NotificationSwitch 
            icon={Smartphone}
            title="Kênh SMS Định Danh" 
            desc="Mã OTP & Cảnh báo an ninh"
            active={prefs.sms} 
            onToggle={() => setPrefs({...prefs, sms: !prefs.sms})} 
            color="text-amber-600 bg-amber-50"
          />
          <NotificationSwitch 
            icon={InfoIcon}
            title="Hòm Thư Điện Tử" 
            desc="Sổ thu chi & Bảng kê Invoice"
            active={prefs.email} 
            onToggle={() => setPrefs({...prefs, email: !prefs.email})} 
            color="text-[var(--portal-primary)] bg-teal-50"
          />
          <NotificationSwitch 
            icon={Bell}
            title="Thông Báo Ứng Dụng" 
            desc="Tin tức nội khu & Phản hồi ticket"
            active={prefs.push} 
            onToggle={() => setPrefs({...prefs, push: !prefs.push})} 
            color="text-indigo-600 bg-indigo-50"
          />
       </div>
       <div className="px-6 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] leading-relaxed">Chúng tôi cam kết không gửi thư rác hay các nội dung quảng cáo phiền nhiễu.</p>
       </div>
    </div>
  );
};

const NotificationSwitch = ({ title, desc, active, onToggle, icon: Icon, color }: any) => (
  <div className="p-8 flex items-center justify-between group">
     <div className="flex items-center gap-6 text-left">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 border", color)}>
           <Icon size={28} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1.5">
           <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</span>
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{desc}</span>
        </div>
     </div>
     <Switch active={active} onClick={onToggle} />
  </div>
);

const Switch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-16 h-10 rounded-full relative transition-all duration-700 shadow-2xl",
      active ? "bg-[var(--portal-primary)] ring-8 ring-[var(--portal-primary)]/10" : "bg-slate-200"
    )}
  >
    <div className={cn(
      "absolute top-1.5 left-1.5 w-7 h-7 bg-white rounded-full transition-transform duration-700 shadow-xl",
      active ? "translate-x-[1.5rem]" : "translate-x-0"
    )} />
  </button>
);

export default Profile;
