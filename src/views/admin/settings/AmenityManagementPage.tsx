import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ClipboardList, Filter, ShieldCheck, Waves } from 'lucide-react';
import amenityAdminService, { type AmenityPolicyRecord } from '@/services/amenityAdminService';
import { ErrorBanner } from '@/components/ui/StatusStates';
import AmenityPoliciesTab from './amenity-components/AmenityPoliciesTab';
import AmenityExceptionsTab from './amenity-components/AmenityExceptionsTab';
import AmenityVersionsTab from './amenity-components/AmenityVersionsTab';

export default function AmenityManagementPage() {
  const [activeTab, setActiveTab] = useState<'policies' | 'exceptions' | 'versions'>('policies');
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<AmenityPolicyRecord | null>(null);

  const dashboardQuery = useQuery({ queryKey: ['amenity-dashboard'], queryFn: () => amenityAdminService.getDashboard() });
  const tabs = [
    { key: 'policies' as const, label: 'Chính sách và nội quy' },
    { key: 'exceptions' as const, label: 'Ngoại lệ và ghi đè' },
    { key: 'versions' as const, label: 'Lịch sử và thông báo' },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 pb-16">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            <Waves size={14} />
            Quản lý tiện ích đặt chỗ
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Quản trị tiện ích</h1>
          <p className="max-w-5xl text-sm font-medium leading-6 text-muted-foreground">
            Dành cho gym, hồ bơi, BBQ, sân thể thao và các tiện ích cần đặt chỗ. Phần này tách khỏi điện nước để nhân sự vận hành không nhầm giữa đặt chỗ và tính phí tiện ích.
          </p>
        </div>
        <div className="max-w-xl rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs font-bold leading-5 text-primary">
          Các thiết lập ngày chốt công tơ, ngày xuất hóa đơn và tiền cọc theo người vẫn nằm trong Cài đặt hệ thống / Thanh toán.
        </div>
      </div>

      {dashboardQuery.isError ? (
        <ErrorBanner
          message="Không tải được dữ liệu bảng điều khiển tiện ích."
          onRetry={() => void dashboardQuery.refetch()}
        />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {[
          { label: 'Chính sách', value: dashboardQuery.data?.totalPolicies ?? 0, icon: ClipboardList },
          { label: 'Chờ duyệt', value: dashboardQuery.data?.pendingApprovals ?? 0, icon: ShieldCheck },
          { label: 'Ngoại lệ đang mở', value: dashboardQuery.data?.activeExceptions ?? 0, icon: Filter },
          { label: 'Đặt chỗ hôm nay', value: dashboardQuery.data?.todayBookings ?? 0, icon: CalendarClock },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
              <item.icon size={18} />
            </div>
            <p className="text-3xl font-black text-foreground">{item.value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-[13px] font-bold transition-all duration-200 ${activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
    </div>
  );
}
