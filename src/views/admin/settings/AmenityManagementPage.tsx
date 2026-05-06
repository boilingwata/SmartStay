import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Waves } from 'lucide-react';
import amenityAdminService, { type AmenityPolicyRecord } from '@/services/amenityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import AmenityPoliciesTab from './amenity-components/AmenityPoliciesTab';
import AmenityExceptionsTab from './amenity-components/AmenityExceptionsTab';
import AmenityVersionsTab from './amenity-components/AmenityVersionsTab';
import AmenityStats from './amenity-components/AmenityStats';

export default function AmenityManagementPage() {
  const [activeTab, setActiveTab] = useState<'policies' | 'exceptions' | 'versions'>('policies');
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<AmenityPolicyRecord | null>(null);

  const dashboardQuery = useQuery({ 
    queryKey: ['amenity-dashboard'], 
    queryFn: () => amenityAdminService.getDashboard() 
  });

  const tabs = [
    { key: 'policies' as const, label: 'Chính sách & Nội quy' },
    { key: 'exceptions' as const, label: 'Ngoại lệ & Ghi đè' },
    { key: 'versions' as const, label: 'Lịch sử & Thông báo' },
  ];

  return (
    <div className="relative w-full min-w-0 space-y-8 pb-16">
      {/* Background Gradient Mesh (Difference Anchor) */}
      <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[140px] opacity-50" />
      <div className="pointer-events-none absolute top-48 -left-24 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] opacity-50" />
      
      {/* Grain Overlay (Premium Texture) */}
      <div className="pointer-events-none fixed inset-0 -z-20 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      <header className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
              <Waves size={24} strokeWidth={2.5} />
            </div>
            <div className="text-[12px] font-black uppercase tracking-[0.4em] text-primary/80">
              Operations Console
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-7xl lg:text-8xl animate-in fade-in slide-in-from-left-12 duration-1000 ease-out">
              Quản trị <span className="text-primary drop-shadow-sm">Tiện ích</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground/70">
              Hệ thống quản lý Gym, Pool, BBQ và các tiện ích vận hành tập trung. 
              <span className="hidden sm:inline"> Thiết lập quy tắc, ngoại lệ và theo dõi lịch sử đặt chỗ với độ chính xác tuyệt đối.</span>
            </p>
          </div>
        </div>


        <div className="max-w-sm shrink-0 rounded-[2rem] border border-primary/20 bg-primary/[0.03] p-6 backdrop-blur-sm">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary/60">Lưu ý vận hành</div>
          <p className="text-xs font-bold leading-relaxed text-primary/80">
            Các thiết lập ngày chốt công tơ, ngày xuất hóa đơn và tiền cọc vẫn nằm trong <span className="underline underline-offset-4">Cài đặt hệ thống / Thanh toán</span>.
          </p>
        </div>
      </header>

      {dashboardQuery.isError ? (
        <ErrorBanner
          message="Không tải được dữ liệu bảng điều khiển tiện ích."
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : null}

      <AmenityStats data={dashboardQuery.data} isLoading={dashboardQuery.isLoading} />

      <nav className="flex flex-wrap gap-2 border-b border-border/60 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === tab.key 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute -bottom-[9px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </nav>

      <main className="min-h-[400px]">
        {activeTab === 'policies' && (
          <AmenityPoliciesTab 
            selectedPolicyId={selectedPolicyId} 
            setSelectedPolicyId={setSelectedPolicyId} 
            setSelectedPolicy={setSelectedPolicy} 
          />
        )}
        
        {activeTab === 'exceptions' && (
          <AmenityExceptionsTab />
        )}
        
        {activeTab === 'versions' && (
          <AmenityVersionsTab selectedPolicy={selectedPolicy} />
        )}
      </main>
    </div>
  );
}

