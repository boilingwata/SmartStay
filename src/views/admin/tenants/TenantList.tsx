import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Search, Plus, Filter, 
  MoreVertical, Phone, Mail, 
  ShieldCheck, Eye, EyeOff, Building,
  ExternalLink, Download, ArrowRight,
  Info, CheckCircle2, UserPlus,
  ArrowUpDown
} from 'lucide-react';
import { tenantService } from '@/services/tenantService';
import { TenantSummary, TenantStatus } from '@/models/Tenant';
import { cn, maskCCCD, maskPhone } from '@/utils';
import { Spinner } from '@/components/ui/Feedback';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorBanner } from '@/components/ui/StatusStates';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import { TenantFormModal } from '@/components/forms/TenantFormModal';
import { SelectAsync } from '@/components/ui/SelectAsync';
import { toast } from 'sonner';
import useUIStore from '@/stores/uiStore';

const TenantList = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { activeBuildingId, setBuilding } = useUIStore();
  const canViewPII = hasPermission('owner.view_pii') || hasPermission('tenant.view_pii'); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<TenantStatus[]>(['Active']);
  const [hasActiveContract, setHasActiveContract] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [showSensitive, setShowSensitive] = useState<string[]>([]);

  // Queries
  const { data: tenants, isLoading, isError, refetch } = useQuery<TenantSummary[]>({
    queryKey: ['tenants', debouncedSearch, statusFilter, activeBuildingId, hasActiveContract, onboardingComplete],
    queryFn: () => tenantService.getTenants({ 
       search: debouncedSearch, 
       status: statusFilter,
       buildingId: activeBuildingId || undefined,
       hasActiveContract: hasActiveContract || undefined,
       onboardingComplete: onboardingComplete || undefined
    })
  });

  const handleCreateSubmit = (data: any) => {
    toast.success(`Hồ sơ cư dân ${data.fullName} đã được tạo thành công!`);
    setIsModalOpen(false);
    refetch();
  };

  const toggleMask = (id: string) => {
    if (!canViewPII) return;
    setShowSensitive(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleStatus = (status: TenantStatus) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 3.1 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
                 <Users size={28} />
              </div>
              <h1 className="text-display text-primary leading-tight">Cư dân & Khách thuê</h1>
           </div>
           <p className="text-body text-muted font-medium">Quản lý hồ sơ, trạng thái onboarding và lịch sử lưu trú của cư dân.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2 h-11 transition-all hover:bg-white hover:shadow-md"><Download size={18} /> Export</button>
          <button 
            className="btn-primary flex items-center gap-2 px-8 h-11 shadow-xl shadow-primary/20 hover:-translate-y-0.5"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={18} /> Thêm cư dân
          </button>
        </div>
      </div>

      <TenantFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreateSubmit} 
      />

      {/* 3.1.1 Filter Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center bg-bg/20 p-6 rounded-[32px] border border-border/10">
        <div className="lg:col-span-3">
           <SelectAsync 
             placeholder="Tất cả tòa nhà"
             icon={Building}
             value={activeBuildingId}
             onChange={setBuilding}
             loadOptions={async () => [
               { label: 'The Manor Central Park', value: 'B1' },
               { label: 'Vinhomes Central Park', value: 'B2' }
             ]}
           />
        </div>

        <div className="lg:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo Tên, SĐT, CCCD..." 
            className="input-base w-full pl-12 pr-4 h-12 shadow-sm focus:shadow-lg transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="lg:col-span-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
           <div className="flex items-center gap-2">
              {(['Active', 'CheckedOut', 'Blacklisted'] as TenantStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "px-5 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                    statusFilter.includes(s) 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-white text-muted hover:text-primary border border-border/50"
                  )}
                >
                  {s}
                </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-2 flex items-center gap-4">
            <div className="h-8 w-[1px] bg-border/20 hidden lg:block" />
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                 <div 
                   onClick={() => setHasActiveContract(!hasActiveContract)}
                   className={cn(
                     "w-10 h-5 rounded-full transition-all relative border",
                     hasActiveContract ? "bg-primary border-primary" : "bg-white border-border shadow-inner"
                   )}
                 >
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md border border-border/10",
                      hasActiveContract ? "right-1" : "left-1"
                    )} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-tighter text-muted group-hover:text-primary transition-colors">HD Active</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                 <div 
                   onClick={() => setOnboardingComplete(!onboardingComplete)}
                   className={cn(
                     "w-10 h-5 rounded-full transition-all relative border",
                     onboardingComplete ? "bg-success border-success" : "bg-white border-border shadow-inner"
                   )}
                 >
                    <div className={cn(
                      "absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-md border border-border/10",
                      onboardingComplete ? "right-1" : "left-1"
                    )} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-tighter text-muted group-hover:text-success transition-colors">Onboard 100%</span>
              </label>
            </div>
        </div>

        <div className="lg:col-span-2 flex justify-end">
           <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-border/50 text-muted hover:text-primary transition-all shadow-sm">
              <Filter size={16} /> <span className="text-[11px] font-black uppercase">Lọc</span>
           </button>
        </div>
      </div>

      {isError && <ErrorBanner message="Đã xảy ra lỗi khi tải dữ liệu cư dân. Vui lòng thử lại." onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Spinner />
          <p className="text-small text-muted font-bold animate-pulse uppercase tracking-[3px]">Loading Profiles...</p>
        </div>
      ) : (
        /* 3.1.2 DataTable */
        <div className="card-container overflow-hidden p-0 border-none shadow-2xl shadow-primary/5 bg-white/40 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-bg/50 border-b border-border/20">
                <tr>
                  <th className="px-6 py-5 text-label text-muted">Cư dân</th>
                  <th className="px-6 py-5 text-label text-muted">Số điện thoại</th>
                  <th className="px-6 py-5 text-label text-muted">CCCD</th>
                  <th className="px-6 py-5 text-label text-muted">Phòng hiện tại</th>
                  <th className="px-6 py-5 text-label text-muted text-center">Trạng thái</th>
                  <th className="px-6 py-5 text-label text-muted">Onboarding</th>
                  <th className="px-6 py-5 text-label text-muted text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {tenants?.map((tenant) => (
                  <tr 
                    key={tenant.id} 
                    className="group hover:bg-white transition-all cursor-pointer"
                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={tenant.avatarUrl} 
                            className="w-12 h-12 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-500" 
                            alt="" 
                          />
                          {tenant.onboardingPercent === 100 && (
                            <CheckCircle2 size={16} className="absolute -bottom-1 -right-1 text-success bg-white rounded-full p-0.5 shadow-sm" />
                          )}
                        </div>
                        <div>
                          <p className="text-body font-black text-primary leading-tight group-hover:underline">{tenant.fullName}</p>
                          <p className="text-[10px] text-muted italic flex items-center gap-1 mt-0.5">
                            <Mail size={10} className="text-accent" /> {tenant.email || '---'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`tel:${tenant.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 font-mono text-small font-bold text-muted bg-bg/50 px-3 py-1.5 rounded-xl w-fit group/tel hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        <Phone size={14} className="text-primary group-hover/tel:scale-110" />
                        {showSensitive.includes(tenant.id) ? tenant.phone : maskPhone(tenant.phone)}
                        {canViewPII && (
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMask(tenant.id); }} 
                            className="ml-1 hover:text-primary transition-colors p-1"
                          >
                            {showSensitive.includes(tenant.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        )}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                       <span className="font-mono text-[13px] font-bold text-slate-500 tracking-tighter">
                         {showSensitive.includes(tenant.id) ? tenant.cccd : maskCCCD(tenant.cccd)}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       {tenant.currentRoomCode ? (
                         <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/rooms/${tenant.currentRoomId}`); }}
                              className="px-3 py-1 bg-primary/5 text-primary text-[11px] font-black rounded-lg border border-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                            >
                               <Building size={12} />
                               {tenant.currentRoomCode}
                            </button>
                            {tenant.isRepresentative && (
                              <span className="px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-black rounded uppercase border border-accent/20">Đại diện</span>
                            )}
                         </div>
                       ) : (
                         <span className="text-muted italic opacity-50">--</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={tenant.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                       {/* 3.1.2 Onboarding % bar */}
                       <div className="w-24 space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase text-muted">
                             <span>{tenant.onboardingPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-bg rounded-full overflow-hidden border border-border/20">
                             <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  tenant.onboardingPercent === 100 ? "bg-success" : "bg-primary"
                                )}
                                style={{ width: `${tenant.onboardingPercent}%` }}
                             />
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2.5 hover:bg-bg rounded-xl text-muted hover:text-primary transition-all">
                             <MoreVertical size={18} />
                          </button>
                          <button className="p-2.5 hover:bg-bg rounded-xl text-muted hover:text-primary transition-all">
                             <ArrowRight size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantList;
