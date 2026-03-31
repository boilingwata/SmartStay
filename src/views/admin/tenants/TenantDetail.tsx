import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  User, Phone, Mail, MapPin, 
  ShieldCheck, CreditCard, FileText, 
  MessageSquare, LayoutList, ChevronRight,
  Plus, ExternalLink, MoreVertical, 
  Smartphone, Briefcase, Globe, 
  Calendar, AlertCircle, CheckCircle2,
  Trash2, Edit, TrendingUp, Star,
  DollarSign, Wallet, History,
  ArrowRight, Heart, Eye, EyeOff
} from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { tenantService } from '@/services/tenantService';
import { 
  TenantProfile, EmergencyContact, 
  OnboardingProgress, TenantFeedback, 
  NPSSurvey, TenantBalanceTransaction 
} from '@/models/Tenant';
import { cn, maskCCCD, maskPhone, calculateAge, formatDate, formatVND } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

import { 
  ProfileTab,
  ContactTab,
  ContractTab,
  InvoiceTab,
  WalletTab,
  FeedbackTab,
  OnboardingTab
} from './components/index';

export type TabType = 'Ho so' | 'Lien he' | 'Hop dong' | 'Hoa don' | 'Vi' | 'Phan hoi' | 'Onboarding';

/**
 * Helper to determine if a tab is in a loading state.
 * Using a function declaration for hoisting safety.
 */
function isLoadingTab(tab: TabType, loadingOnboarding?: boolean, loadingTransactions?: boolean) {
  if (tab === 'Onboarding' && loadingOnboarding) return true;
  if (tab === 'Vi' && loadingTransactions) return true;
  return ['Hop dong', 'Hoa don'].includes(tab);
}

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canViewPII = hasPermission('tenant.view_pii');
  
  const [activeTab, setActiveTab] = useState<TabType>('Ho so');
  const [showSensitive, setShowSensitive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Queries
  const { data: profile, isLoading: loadingProfile } = useQuery<TenantProfile>({
    queryKey: ['tenant-profile', id],
    queryFn: () => tenantService.getTenantDetail(id!),
    enabled: !!id
  });

  const { data: contracts } = useQuery({
    queryKey: ['tenant-contracts', id],
    queryFn: () => tenantService.getTenantContracts(id || ''),
    enabled: !!id
  });

  const { data: invoices } = useQuery({
    queryKey: ['tenant-invoices', id],
    queryFn: () => tenantService.getTenantInvoices(id || ''),
    enabled: !!id
  });

  const { data: onboarding, isLoading: loadingOnboarding } = useQuery<OnboardingProgress>({
    queryKey: ['tenant-onboarding', id],
    queryFn: () => tenantService.getOnboardingProgress(id!),
    enabled: activeTab === 'Onboarding'
  });

  const { data: contacts } = useQuery<EmergencyContact[]>({
    queryKey: ['tenant-contacts', id],
    queryFn: () => tenantService.getEmergencyContacts(id!),
    enabled: activeTab === 'Lien he'
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<TenantBalanceTransaction[]>({
    queryKey: ['tenant-transactions', id],
    queryFn: () => tenantService.getTenantBalanceTransactions(id!),
    enabled: activeTab === 'Vi'
  });

  const { data: feedback } = useQuery<TenantFeedback[]>({
    queryKey: ['tenant-feedback', id],
    queryFn: () => tenantService.getFeedback(id!),
    enabled: activeTab === 'Phan hoi'
  });

  const { data: nps } = useQuery<NPSSurvey[]>({
    queryKey: ['tenant-nps', id],
    queryFn: () => tenantService.getNPSSurveys(id!),
    enabled: activeTab === 'Phan hoi'
  });

  // Checklist #4: Onboarding Confetti
  const handleOnboardingAction = (key: string) => {
    toast.success(`Đã cập nhật bước: ${key}`);
    // Check for completion to celebrate
    if (onboarding && (onboarding.completionPercent >= 100 || key === 'isRoomHandovered')) {
      setShowConfetti(true);
      toast.success('CHÚC MỪNG! Quy trình Onboarding đã hoàn tất.', {
        description: 'Dữ liệu cư dân đã được đồng bộ chính xác.',
        icon: <CheckCircle2 className="text-success" />,
        duration: 8000
      });
      setTimeout(() => setShowConfetti(false), 8000);
    }
  };

  const { data: tenantBalance, isLoading: loadingBalances } = useQuery({
    queryKey: ['tenant-balance', id],
    queryFn: () => tenantService.getTenantBalance(id || ''),
    enabled: activeTab === 'Vi'
  });

  if (loadingProfile || !profile) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Spinner />
        <p className="text-label text-muted font-black animate-pulse uppercase tracking-[3px]">Đang tải thông tin cư dân...</p>
      </div>
    );
  }

  // Combine loading states for specific tabs if needed
  const isTabLoading = isLoadingTab(activeTab, loadingOnboarding, loadingTransactions || loadingBalances);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* 3.2 Page Header (Mobile-first feel) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end">
        <div className="relative group">
           <img 
            src={profile.avatarUrl} 
            className="w-32 h-32 rounded-[40px] object-cover shadow-2xl border-4 border-white group-hover:scale-105 transition-transform duration-500" 
            alt={profile.fullName} 
           />
           <div className="absolute inset-0 bg-black/40 rounded-[40px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Đổi ảnh</span>
           </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display text-primary tracking-tighter">{profile.fullName}</h1>
            <StatusBadge status={profile.status} size="sm" className="shadow-lg" />
            <span className="text-body font-bold text-muted bg-bg px-3 py-1 rounded-full">{calculateAge(profile.dateOfBirth)}</span>
          </div>
          
          <div className="flex flex-wrap gap-6 text-small font-medium text-muted">
            <span className="flex items-center gap-2"><Phone size={14} className="text-primary" /> {profile.phone}</span>
            <span className="flex items-center gap-2"><Mail size={14} className="text-primary" /> {profile.email || 'N/A'}</span>
            <span className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {profile.currentRoomCode || 'Chưa nhận phòng'}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-outline-sm flex items-center gap-2" onClick={() => navigate(-1)}>
             Quay lại
          </button>
          <button
            className="btn-outline flex items-center gap-2 px-6"
            onClick={() => {
              toast.info(`Tính năng gửi tin nhắn trực tiếp cho ${profile.fullName} đang được cấu hình.`);
            }}
          >
            <MessageSquare size={16} /> Gửi tin nhắn
          </button>
          <button className="btn-primary flex items-center gap-2 px-6 shadow-xl shadow-primary/20" onClick={() => toast.info('Tính năng chỉnh sửa thông tin cư dân đang được phát triển.')}>
             <Edit size={16} /> Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="border-b border-border/20 flex flex-nowrap overflow-x-auto no-scrollbar gap-8">
        {(['Ho so', 'Lien he', 'Hop dong', 'Hoa don', 'Vi', 'Phan hoi', 'Onboarding'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-4 text-[11px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap relative",
              activeTab === tab ? "text-primary opacity-100" : "text-muted opacity-50 hover:opacity-80"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full animate-in slide-in-from-bottom-1" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'Ho so' && (
          <ProfileTab 
            profile={profile} 
            canViewPII={hasPermission('tenant.view_pii')} 
            showSensitive={showSensitive} 
            setShowSensitive={setShowSensitive} 
          />
        )}
        {activeTab === 'Lien he' && (
          <ContactTab profile={profile} contacts={contacts} />
        )}
        {activeTab === 'Hop dong' && (
          <ContractTab contract={contracts?.[0]} />
        )}
        {activeTab === 'Hoa don' && (
          <InvoiceTab invoices={invoices} />
        )}
        {activeTab === 'Vi' && (
          <WalletTab 
            balance={tenantBalance?.currentBalance ?? 0}
            transactions={transactions} 
            isLoading={loadingTransactions || loadingBalances} 
          />
        )}
        {activeTab === 'Phan hoi' && (
          <FeedbackTab feedback={feedback} nps={nps} />
        )}
        {activeTab === 'Onboarding' && (
          <OnboardingTab 
            onboarding={onboarding!} 
            onAction={handleOnboardingAction} 
            onTabChange={setActiveTab} 
          />
        )}

        {/* Tab Placeholders fallback */}
        {isLoadingTab(activeTab, loadingOnboarding, loadingTransactions) && (
          <div className="py-20 flex flex-col items-center justify-center gap-6 text-center animate-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary border border-primary/10">
                <History size={40} className="animate-spin-slow" />
             </div>
             <div className="max-w-md space-y-2">
                <h3 className="text-h3 font-black text-primary uppercase tracking-[4px]">Dữ liệu {activeTab}</h3>
                <p className="text-small text-muted italic font-medium">Toàn bộ lịch sử giao dịch và hồ sơ đang được đồng bộ từ Ledger Engine...</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDetail;
