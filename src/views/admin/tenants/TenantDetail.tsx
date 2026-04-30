import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, History, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { TenantFormModal } from '@/components/forms/TenantFormModal';
import {
  ContactTab,
  ContractTab,
  FeedbackTab,
  InvoiceTab,
  OnboardingTab,
  ProfileTab,
} from '@/components/tenants/detail';
import MessageTenantModal from '@/components/tenants/detail/MessageTenantModal';
import type { TenantDetailTab } from '@/components/tenants/detail/types';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePermission } from '@/hooks/usePermission';
import {
  EmergencyContact,
  OnboardingProgress,
  TenantFeedback,
  TenantProfile,
  NPSSurvey,
} from '@/models/Tenant';
import notificationService from '@/services/notificationService';
import { tenantService } from '@/services/tenantService';
import { calculateAge, cn } from '@/utils';

const DEFAULT_TENANT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const TENANT_TAB_LABELS: Record<TenantDetailTab, string> = {
  'Ho so': 'Hồ sơ',
  'Lien he': 'Liên hệ',
  'Hop dong': 'Hợp đồng',
  'Hoa don': 'Hóa đơn',
  'Phan hoi': 'Phản hồi',
  Onboarding: 'Hoàn tất hồ sơ',
};

function isLoadingTab(tab: TenantDetailTab, loadingOnboarding?: boolean) {
  return tab === 'Onboarding' && loadingOnboarding;
}

const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canViewPII = hasPermission('tenant.view_pii');

  const [activeTab, setActiveTab] = React.useState<TenantDetailTab>('Ho so');
  const [showSensitive, setShowSensitive] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isSavingVehicles, setIsSavingVehicles] = React.useState(false);
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);

  const {
    data: profile,
    isLoading: loadingProfile,
    refetch: refetchProfile,
  } = useQuery<TenantProfile>({
    queryKey: ['tenant-profile', id],
    queryFn: () => tenantService.getTenantDetail(id!),
    enabled: !!id,
  });

  const { data: contracts } = useQuery({
    queryKey: ['tenant-contracts', id],
    queryFn: () => tenantService.getTenantContracts(id || ''),
    enabled: !!id,
  });

  const { data: invoices } = useQuery({
    queryKey: ['tenant-invoices', id],
    queryFn: () => tenantService.getTenantInvoices(id || ''),
    enabled: !!id,
  });

  const { data: contacts } = useQuery<EmergencyContact[]>({
    queryKey: ['tenant-contacts', id],
    queryFn: () => tenantService.getEmergencyContacts(id!),
    enabled: !!id,
  });

  const { data: onboarding, isLoading: loadingOnboarding } = useQuery<OnboardingProgress>({
    queryKey: ['tenant-onboarding', id],
    queryFn: () => tenantService.getOnboardingProgress(id!),
    enabled: activeTab === 'Onboarding' && !!id,
  });

  const { data: feedback } = useQuery<TenantFeedback[]>({
    queryKey: ['tenant-feedback', id],
    queryFn: () => tenantService.getFeedback(id!),
    enabled: activeTab === 'Phan hoi' && !!id,
  });

  const { data: nps } = useQuery<NPSSurvey[]>({
    queryKey: ['tenant-nps', id],
    queryFn: () => tenantService.getNPSSurveys(id!),
    enabled: activeTab === 'Phan hoi' && !!id,
  });

  const refreshTenantViews = async () => {
    await refetchProfile();
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tenants'] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-profile', id] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-contacts', id] }),
      queryClient.invalidateQueries({ queryKey: ['tenant-onboarding', id] }),
    ]);
  };

  const handleEditSubmit = async (data: {
    fullName: string;
    phone: string;
    email?: string;
    cccd: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    nationality?: string;
    occupation?: string;
    permanentAddress?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    avatarUrl?: string;
    vehiclePlates: string[];
    cccdFrontUrl?: string;
    cccdBackUrl?: string;
    cccdIssuedDate?: string;
    cccdIssuedPlace?: string;
  }) => {
    if (!id) return;

    setIsSavingProfile(true);
    try {
      await tenantService.updateTenant(id, {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        cccd: data.cccd,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        occupation: data.occupation,
        permanentAddress: data.permanentAddress,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        avatarUrl: data.avatarUrl,
        vehiclePlates: data.vehiclePlates,
        cccdFrontUrl: data.cccdFrontUrl,
        cccdBackUrl: data.cccdBackUrl,
        cccdIssuedDate: data.cccdIssuedDate,
        cccdIssuedPlace: data.cccdIssuedPlace,
      });
      await refreshTenantViews();
      toast.success(`Đã cập nhật hồ sơ cư dân ${data.fullName}.`);
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật thông tin cư dân.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleVehicleSave = async (vehiclePlates: string[]) => {
    if (!id) return;

    setIsSavingVehicles(true);
    try {
      await tenantService.updateTenant(id, { vehiclePlates });
      await refreshTenantViews();
      toast.success('Đã cập nhật danh sách phương tiện.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật phương tiện.');
      throw error;
    } finally {
      setIsSavingVehicles(false);
    }
  };

  const handleSendMessage = async ({ title, message }: { title: string; message: string }) => {
    if (!profile?.profileId) {
      toast.error('Cư dân này chưa có tài khoản cổng cư dân để nhận tin nhắn.');
      return;
    }

    setIsSendingMessage(true);
    try {
      await notificationService.sendToProfile({
        profileId: profile.profileId,
        title,
        message,
        type: 'admin_message',
        link: '/portal/notifications',
      });
      toast.success(`Đã gửi tin nhắn tới ${profile.fullName}.`);
      setIsMessageModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể gửi tin nhắn cho cư dân.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loadingProfile || !profile) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Spinner />
        <p className="animate-pulse text-label font-bold uppercase tracking-[3px] text-muted">
          Đang tải hồ sơ cư dân...
        </p>
      </div>
    );
  }

  const isTabLoading = isLoadingTab(activeTab, loadingOnboarding);

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700">
      <TenantFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSavingProfile) setIsEditModalOpen(false);
        }}
        initialData={{
          id: profile.id,
          fullName: profile.fullName,
          phone: profile.phone,
          email: profile.email,
          cccd: profile.cccd,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          nationality: profile.nationality,
          occupation: profile.occupation,
          permanentAddress: profile.permanentAddress,
          emergencyContactName: profile.emergencyContactName,
          emergencyContactPhone: profile.emergencyContactPhone,
          avatarUrl: profile.avatarUrl,
          vehiclePlates: profile.vehiclePlates,
          cccdIssuedDate: profile.cccdIssuedDate,
          cccdIssuedPlace: profile.cccdIssuedPlace,
        }}
        onSubmit={handleEditSubmit}
      />

      <MessageTenantModal
        isOpen={isMessageModalOpen}
        tenantName={profile.fullName}
        isSending={isSendingMessage}
        onClose={() => {
          if (!isSendingMessage) setIsMessageModalOpen(false);
        }}
        onSubmit={handleSendMessage}
      />

      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end">
        <div className="group relative">
          <img
            src={profile.avatarUrl || DEFAULT_TENANT_AVATAR_URL}
            className="h-32 w-32 rounded-[40px] border-4 border-white object-cover shadow-2xl transition-transform duration-500 group-hover:scale-105"
            alt={profile.fullName}
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-[40px] bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Ảnh hồ sơ</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-display tracking-tighter text-primary">{profile.fullName}</h1>
            <StatusBadge status={profile.status} size="sm" className="shadow-lg" />
            <span className="rounded-full bg-bg px-3 py-1 text-body font-bold text-muted">
              {calculateAge(profile.dateOfBirth)}
            </span>
            {profile.hasPortalAccount ? (
              <span className="rounded-full border border-success/15 bg-success/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-success">
                Có tài khoản cư dân
              </span>
            ) : (
              <span className="rounded-full border border-muted/20 bg-muted/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-muted">
                Chưa có tài khoản cư dân
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-6 text-small font-medium text-muted">
            <span className="flex items-center gap-2">
              <Phone size={14} className="text-primary" />
              {profile.phone}
            </span>
            <span className="flex items-center gap-2">
              <Mail size={14} className="text-primary" />
              {profile.email || 'Chưa có email'}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              {profile.currentRoomCode || 'Chưa nhận phòng'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-outline-sm flex items-center gap-2" onClick={() => navigate(-1)}>
            Quay lại
          </button>
          <button
            className={cn(
              'btn-outline flex items-center gap-2 px-6',
              !profile.hasPortalAccount && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none',
            )}
            onClick={() => setIsMessageModalOpen(true)}
            disabled={!profile.hasPortalAccount}
            title={profile.hasPortalAccount ? 'Gửi tin nhắn nội bộ' : 'Cư dân chưa có tài khoản cổng cư dân'}
          >
            <MessageSquare size={16} />
            Gửi tin nhắn
          </button>
          <button
            className="btn-primary flex items-center gap-2 px-6 shadow-xl shadow-primary/20"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit size={16} />
            Chỉnh sửa
          </button>
        </div>
      </div>

      <div className="flex flex-nowrap gap-8 overflow-x-auto border-b border-border/20 no-scrollbar">
        {(['Ho so', 'Lien he', 'Hop dong', 'Hoa don', 'Phan hoi', 'Onboarding'] as TenantDetailTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative whitespace-nowrap pb-4 text-[11px] font-black uppercase tracking-[2px] transition-all',
              activeTab === tab ? 'text-primary opacity-100' : 'text-muted opacity-50 hover:opacity-80',
            )}
          >
            {TENANT_TAB_LABELS[tab]}
            {activeTab === tab ? (
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-full bg-primary animate-in slide-in-from-bottom-1" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'Ho so' ? (
          <ProfileTab
            profile={profile}
            canViewPII={canViewPII}
            showSensitive={showSensitive}
            setShowSensitive={setShowSensitive}
            onSaveVehiclePlates={handleVehicleSave}
            isSavingVehicles={isSavingVehicles}
          />
        ) : null}
        {activeTab === 'Lien he' ? <ContactTab profile={profile} contacts={contacts} /> : null}
        {activeTab === 'Hop dong' ? <ContractTab contract={contracts?.[0]} /> : null}
        {activeTab === 'Hoa don' ? <InvoiceTab invoices={invoices} /> : null}
        {activeTab === 'Phan hoi' ? <FeedbackTab feedback={feedback} nps={nps} /> : null}
        {activeTab === 'Onboarding' ? <OnboardingTab onboarding={onboarding} onTabChange={setActiveTab} /> : null}

        {isTabLoading ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center animate-in zoom-in-95 duration-500">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary">
              <History size={40} className="animate-spin-slow" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-h3 font-black uppercase tracking-[4px] text-primary">Dữ liệu {TENANT_TAB_LABELS[activeTab]}</h3>
              <p className="text-small font-medium italic text-muted">Thông tin đang được đồng bộ từ SmartStay.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TenantDetail;
